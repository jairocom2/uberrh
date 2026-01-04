
import { DbState, Profile, CompanyProfile, ProfessionalProfile } from '../types';
import { RJ_COORDS, SKILLS_LIST } from '../constants';

// CHAVE V4 - Nova infraestrutura de dados isolada
const STORAGE_KEY = 'meup_v4_ultra_production';
const SYNC_BASE_URL = 'https://api.keyvalue.xyz';

const getInitialState = (): DbState => ({
  last_update: Date.now(),
  profiles: [],
  company_profiles: [],
  professional_profiles: [],
  job_requests: [],
  job_offers: [],
  job_assignments: [],
  chat_threads: [],
  chat_messages: [],
  ratings: [],
});

export const getDb = (): DbState => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : getInitialState();
};

export const clearAndRestart = () => {
  localStorage.clear();
  seedDatabase();
  window.location.reload();
};

export const saveDb = (state: DbState) => {
  state.last_update = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  const room = localStorage.getItem('meup_sync_room');
  if (room) {
    pushToCloud(room, state);
  }
};

// Prefixo V4
const getRoomKey = (room: string) => `meup_v4_room_${room.trim().toLowerCase()}`;

async function pushToCloud(room: string, state: DbState) {
  try {
    // Sinaliza na interface que está enviando
    window.dispatchEvent(new CustomEvent('meup-sync-status', { detail: 'sending' }));
    
    const key = getRoomKey(room);
    await fetch(`${SYNC_BASE_URL}/${key}`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('meup-sync-status', { detail: 'idle' }));
    }, 500);
  } catch (e) { 
    console.error("Cloud Push Error:", e);
    window.dispatchEvent(new CustomEvent('meup-sync-status', { detail: 'error' }));
  }
}

export const forceCloudFetch = async (room: string): Promise<boolean> => {
  try {
    const key = getRoomKey(room);
    // Bypass agressivo de cache para mobile
    const res = await fetch(`${SYNC_BASE_URL}/${key}?nocache=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (res.ok) {
      const cloudState: DbState = await res.json();
      const localState = getDb();
      
      // Sincroniza se a nuvem for mais recente ou tiver contagem de dados diferente
      const cloudNewer = cloudState.last_update > (localState.last_update || 0);
      const dataMismatched = cloudState.job_requests.length !== localState.job_requests.length ||
                            cloudState.job_assignments.length !== localState.job_assignments.length;

      if (cloudNewer || dataMismatched) {
        window.dispatchEvent(new CustomEvent('meup-sync-status', { detail: 'receiving' }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('meup-sync-status', { detail: 'idle' }));
        }, 500);
        return true;
      }
    }
  } catch (e) { 
    // Silencioso para não travar o app se o servidor cair
  }
  return false;
};

export const startCloudSync = (room: string, onUpdate: () => void) => {
  const cleanRoom = room.trim().toLowerCase();
  localStorage.setItem('meup_sync_room', cleanRoom);
  
  // Pull inicial
  forceCloudFetch(cleanRoom).then(updated => { if(updated) onUpdate(); });

  const interval = setInterval(async () => {
    if (await forceCloudFetch(cleanRoom)) {
      onUpdate();
    }
  }, 1500); // 1.5s para evitar rate limiting do KeyValue
  return () => clearInterval(interval);
};

export const stopCloudSync = () => {
  localStorage.removeItem('meup_sync_room');
};

export const seedDatabase = () => {
  const db = getInitialState();
  
  db.profiles.push({
    id: 'admin-1', role: 'admin', name: 'Admin Master', 
    email: 'admin@meup.demo', phone: '21999999999', is_suspended: false, created_at: new Date().toISOString()
  });

  const empId = 'emp-1';
  db.profiles.push({
    id: empId, role: 'empresa', name: 'Carlos Gestor', 
    email: 'c1@empresa.com', phone: '21988887777', is_suspended: false, created_at: new Date().toISOString()
  });
  db.company_profiles.push({
    user_id: empId, company_name: 'Padaria Copacabana', owner_name: 'Carlos Silva',
    cnpj: '12.345.678/0001-90', segment: 'Alimentação', address: 'Copacabana',
    full_address: 'Av. Nossa Sra. de Copacabana, 500', zip_code: '22020-001',
    geo_lat: RJ_COORDS.Copacabana.lat, geo_lng: RJ_COORDS.Copacabana.lng, is_verified: true
  });

  const profId = 'prof-1';
  db.profiles.push({
    id: profId, role: 'profissional', name: 'Ricardo Silva', 
    email: 'p1@prof.com', phone: '21977776666', is_suspended: false, created_at: new Date().toISOString()
  });
  db.professional_profiles.push({
    user_id: profId, approval_status: 'aprovado', skills: ['caixa', 'atendente'],
    rating_avg: 4.9, jobs_completed: 12, city: 'Rio de Janeiro',
    geo_lat: RJ_COORDS.Meier.lat, geo_lng: RJ_COORDS.Meier.lng, docs_verified: true,
    bio: 'Experiência com frente de loja.',
    experience: [{ company: 'Mercado Extra', role: 'Caixa', period: '2021-2023' }]
  });

  saveDb(db);
};
