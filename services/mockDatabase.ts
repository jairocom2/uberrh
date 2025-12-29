
import { Profile, CompanyProfile, ProfessionalProfile, JobRequest, JobOffer, JobAssignment, ChatThread, ChatMessage, Rating, WorkHistory } from '../types';
import { RJ_COORDS } from '../constants';

const STORAGE_KEY = 'meup_demo_v1';
const SYNC_BASE_URL = 'https://api.keyvalue.xyz'; // Public KV Store para demos

interface DbState {
  profiles: Profile[];
  company_profiles: CompanyProfile[];
  professional_profiles: ProfessionalProfile[];
  job_requests: JobRequest[];
  job_offers: JobOffer[];
  job_assignments: JobAssignment[];
  chat_threads: ChatThread[];
  chat_messages: ChatMessage[];
  ratings: Rating[];
}

const getInitialState = (): DbState => ({
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

export const saveDb = (state: DbState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  // Se estiver em uma sala de sincronização, envia para a nuvem
  const room = localStorage.getItem('meup_sync_room');
  if (room) {
    pushToCloud(room, state);
  }
};

// --- LÓGICA DE SINCRONIZAÇÃO EM NUVEM PARA TESTES ---

async function pushToCloud(room: string, state: DbState) {
  try {
    // KeyValue.xyz usa uma chave que criamos baseada no nome da sala
    // Usamos btoa para garantir que o nome da sala seja uma chave válida
    const key = btoa(`meup-${room}`).substring(0, 16);
    await fetch(`${SYNC_BASE_URL}/${key}`, {
      method: 'POST',
      body: JSON.stringify(state),
    });
  } catch (e) {
    console.warn("Falha ao sincronizar com a nuvem", e);
  }
}

export const startCloudSync = (room: string, onUpdate: () => void) => {
  localStorage.setItem('meup_sync_room', room);
  const key = btoa(`meup-${room}`).substring(0, 16);

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${SYNC_BASE_URL}/${key}`);
      if (res.ok) {
        const cloudState = await res.json();
        const localState = getDb();
        
        // Merge simples: Se o estado da nuvem for diferente e mais populoso ou novo, atualiza
        if (JSON.stringify(cloudState) !== JSON.stringify(localState)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          onUpdate();
        }
      }
    } catch (e) {
      console.log("Aguardando dados na sala...");
    }
  }, 3500); // Polling a cada 3.5s

  return () => clearInterval(interval);
};

export const stopCloudSync = () => {
  localStorage.removeItem('meup_sync_room');
};

export const seedDatabase = () => {
  const db = getInitialState();

  // 1. Admin
  const adminId = 'admin-123';
  db.profiles.push({
    id: adminId,
    role: 'admin',
    name: 'Admin MeUp',
    email: 'admin@meup.demo',
    phone: '21999999999',
    is_suspended: false,
    created_at: new Date().toISOString()
  });

  // 2. Companies
  const companies = [
    { id: 'c1', name: 'Padaria Atlântico', owner: 'Carlos Silva', cnpj: '12.345.678/0001-90', location: 'Copacabana', segment: 'Alimentação', street: 'Av. Atlântica, 1500' },
    { id: 'c2', name: 'Farmácia Carioca 24h', owner: 'Ana Rocha', cnpj: '23.456.789/0001-01', location: 'Botafogo', segment: 'Saúde', street: 'Rua Voluntários da Pátria, 45' }
  ];

  companies.forEach(c => {
    const coords = (RJ_COORDS as any)[c.location];
    db.profiles.push({
      id: c.id,
      role: 'empresa',
      name: c.name,
      email: `${c.id}@empresa.com`,
      phone: '2188888888',
      is_suspended: false,
      created_at: new Date().toISOString()
    });
    db.company_profiles.push({
      user_id: c.id,
      company_name: c.name,
      owner_name: c.owner,
      cnpj: c.cnpj,
      municipal_registration: 'IM-' + Math.floor(Math.random() * 999999),
      segment: c.segment,
      address: c.location,
      full_address: `${c.street}, ${c.location}, Rio de Janeiro`,
      zip_code: '20000-000',
      commercial_phone: '2133334444',
      geo_lat: coords.lat,
      geo_lng: coords.lng,
      is_verified: true
    });
  });

  // 3. Professionals
  for (let i = 1; i <= 3; i++) {
    const id = `p${i}`;
    const loc = i === 1 ? 'Meier' : 'Tijuca';
    const coords = (RJ_COORDS as any)[loc];

    db.profiles.push({
      id,
      role: 'profissional',
      name: `Parceiro ${i}`,
      email: `${id}@prof.com`,
      phone: '2177777777',
      is_suspended: false,
      created_at: new Date().toISOString()
    });

    db.professional_profiles.push({
      user_id: id,
      approval_status: 'aprovado',
      skills: ['caixa', 'atendente'],
      rating_avg: 4.8 + (i * 0.1),
      jobs_completed: 5 + i,
      city: 'Rio de Janeiro',
      geo_lat: coords.lat,
      geo_lng: coords.lng,
      docs_verified: true,
      bio: "Disponível para reforço imediato em toda zona norte e centro.",
      experience: []
    });
  }

  saveDb(db);
};
