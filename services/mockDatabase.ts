
import { DbState } from '../types';
import { RJ_COORDS } from '../constants';

// Novo endpoint para garantir requests limpas no CrudCrud
const CRUD_ID = '35f299108f92476bb148560183187a55'; 
const SYNC_BASE_URL = `https://crudcrud.com/api/${CRUD_ID}`;
const STORAGE_KEY = 'meup_v9_ultimate_prod';

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

const getRoomCollection = (room: string) => room.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

async function pushToCloud(room: string, state: DbState) {
  try {
    const collection = getRoomCollection(room);
    
    // V9 Smart Sync: Primeiro tentamos ver se já existe algo na sala
    const checkRes = await fetch(`${SYNC_BASE_URL}/${collection}`);
    const existing = await checkRes.json();
    
    if (Array.isArray(existing) && existing.length > 0) {
      // Se existe, atualizamos o primeiro registro usando PUT (evita 403/429)
      const targetId = existing[0]._id;
      // Removendo o ID interno do crudcrud se ele vier no estado por engano
      const { _id, ...cleanState } = state as any;
      
      await fetch(`${SYNC_BASE_URL}/${collection}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanState)
      });
    } else {
      // Se não existe nada, criamos o primeiro registro da sala
      await fetch(`${SYNC_BASE_URL}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    }
    
    window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'UP', status: 'OK' } }));
  } catch (e: any) { 
    window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'UP', status: 'ERRO' } }));
  }
}

export const forceCloudFetch = async (room: string): Promise<boolean> => {
  try {
    const collection = getRoomCollection(room);
    const res = await fetch(`${SYNC_BASE_URL}/${collection}`);
    
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Pegamos o estado da nuvem (seja o primeiro via PUT ou o último via POST)
        const cloudState = data[data.length - 1] as DbState;
        const localState = getDb();
        
        if (cloudState && cloudState.last_update > (localState.last_update || 0)) {
          const { _id, ...rest } = cloudState as any;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
          window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'SYNC' } }));
          return true;
        }
      }
      window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'OK' } }));
      return false;
    }
  } catch (e: any) { 
    window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'FALHA' } }));
  }
  return false;
};

export const startCloudSync = (room: string, onUpdate: () => void) => {
  const cleanRoom = room.trim().toLowerCase();
  localStorage.setItem('meup_sync_room', cleanRoom);
  
  forceCloudFetch(cleanRoom).then(u => { if(u) onUpdate(); });

  const interval = setInterval(async () => {
    if (await forceCloudFetch(cleanRoom)) {
      onUpdate();
      window.dispatchEvent(new CustomEvent('meup-job-updated'));
    }
  }, 4000); 
  return () => clearInterval(interval);
};

export const stopCloudSync = () => localStorage.removeItem('meup_sync_room');

export const seedDatabase = () => {
  const db = getInitialState();
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
    bio: 'Experiência com frente de loja.'
  });
  saveDb(db);
};
