
import { DbState, Profile, CompanyProfile, ProfessionalProfile } from '../types';
import { RJ_COORDS, SKILLS_LIST } from '../constants';

// CHAVE V3 - Garante que os celulares não tentem ler lixo de versões antigas
const STORAGE_KEY = 'meup_v3_production_final';
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

// Prefixo V3 único para a nuvem
const getRoomKey = (room: string) => `meup_v3_cloud_${room.trim().toLowerCase()}`;

async function pushToCloud(room: string, state: DbState) {
  try {
    const key = getRoomKey(room);
    await fetch(`${SYNC_BASE_URL}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (e) { console.error("Cloud Error:", e); }
}

export const forceCloudFetch = async (room: string): Promise<boolean> => {
  try {
    const key = getRoomKey(room);
    const res = await fetch(`${SYNC_BASE_URL}/${key}?t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const cloudState: DbState = await res.json();
      const localState = getDb();
      
      // Sincroniza se houve mudança de status ou novos registros
      if (cloudState.last_update > (localState.last_update || 0) || 
          cloudState.job_requests.length !== localState.job_requests.length ||
          cloudState.job_assignments.length !== localState.job_assignments.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
        return true;
      }
    }
  } catch (e) { }
  return false;
};

export const startCloudSync = (room: string, onUpdate: () => void) => {
  const cleanRoom = room.trim().toLowerCase();
  localStorage.setItem('meup_sync_room', cleanRoom);
  
  // Sincronia imediata
  forceCloudFetch(cleanRoom).then(u => { if(u) onUpdate(); });

  const interval = setInterval(async () => {
    if (await forceCloudFetch(cleanRoom)) {
      onUpdate();
      window.dispatchEvent(new CustomEvent('meup-job-updated'));
    }
  }, 1000); // 1 segundo para ser "tempo real"
  return () => clearInterval(interval);
};

export const stopCloudSync = () => localStorage.removeItem('meup_sync_room');

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
