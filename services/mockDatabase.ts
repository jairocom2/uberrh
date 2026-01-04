
import { DbState } from '../types';
import { RJ_COORDS } from '../constants';

const STORAGE_KEY = 'meup_v6_blindada_prod';
// Novo provedor mais estável e rápido
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

// Chave única para evitar conflitos com versões anteriores
const getRoomKey = (room: string) => `meupv6_${room.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`;

async function pushToCloud(room: string, state: DbState) {
  try {
    const key = getRoomKey(room);
    // POST simples sem headers complexos para evitar bloqueio de firewall mobile
    const response = await fetch(`${SYNC_BASE_URL}/${key}`, {
      method: 'POST',
      body: JSON.stringify(state)
    });
    
    if (response.ok) {
      window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'UP', status: 'OK' } }));
    } else {
      window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'UP', status: 'ERRO' } }));
    }
  } catch (e) { 
    window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'UP', status: 'FALHA' } }));
  }
}

export const forceCloudFetch = async (room: string): Promise<boolean> => {
  try {
    const key = getRoomKey(room);
    const res = await fetch(`${SYNC_BASE_URL}/${key}?cb=${Date.now()}`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (res.ok) {
      const cloudState: DbState = await res.json();
      const localState = getDb();
      
      if (cloudState && cloudState.last_update > (localState.last_update || 0)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
        window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'SYNC' } }));
        return true;
      }
      window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'OK' } }));
      return false;
    } 
    
    // Se der 404, a sala apenas não existe ainda, não é falha
    if (res.status === 404) {
      window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'VAZIO' } }));
      return false;
    }
  } catch (e) { 
    window.dispatchEvent(new CustomEvent('meup-net-log', { detail: { type: 'DOWN', status: 'FALHA' } }));
  }
  return false;
};

export const startCloudSync = (room: string, onUpdate: () => void) => {
  const cleanRoom = room.trim().toLowerCase();
  localStorage.setItem('meup_sync_room', cleanRoom);
  
  // Primeiro check
  forceCloudFetch(cleanRoom).then(u => { if(u) onUpdate(); });

  const interval = setInterval(async () => {
    if (await forceCloudFetch(cleanRoom)) {
      onUpdate();
      window.dispatchEvent(new CustomEvent('meup-job-updated'));
    }
  }, 2000); // 2 segundos para não sobrecarregar redes 4G instáveis
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
