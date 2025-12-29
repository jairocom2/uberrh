
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb, saveDb, seedDatabase } from '../services/mockDatabase';
import { Profile, ProfessionalProfile, CompanyProfile, JobRequest, Role, JobAssignment } from '../types';
import Layout from '../components/Layout';
import { Icons, RJ_COORDS, SKILLS_LIST } from '../constants';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profData, setProfData] = useState<ProfessionalProfile[]>([]);
  const [compData, setCompData] = useState<CompanyProfile[]>([]);
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  
  const [activeTab, setActiveTab] = useState<'usuarios' | 'pendentes' | 'chamados' | 'config'>('usuarios');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'empresa' | 'profissional'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [viewingUser, setViewingUser] = useState<{ profile: Profile, extra: any } | null>(null);
  const [viewingJob, setViewingJob] = useState<JobRequest | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const refresh = () => {
    const db = getDb();
    setProfiles(db.profiles);
    setProfData(db.professional_profiles);
    setCompData(db.company_profiles);
    setJobs(db.job_requests);
  };

  useEffect(() => refresh(), []);

  const handleSaveUser = (profile: Profile, extra: any) => {
    const db = getDb();
    db.profiles.push(profile);
    if (profile.role === 'profissional') {
      db.professional_profiles.push(extra);
    } else {
      db.company_profiles.push(extra);
    }
    saveDb(db);
    setIsCreating(false);
    refresh();
  };

  const toggleVerification = (userId: string, role: Role) => {
    const db = getDb();
    if (role === 'profissional') {
      const idx = db.professional_profiles.findIndex(p => p.user_id === userId);
      if (idx !== -1) {
        db.professional_profiles[idx].docs_verified = !db.professional_profiles[idx].docs_verified;
        db.professional_profiles[idx].approval_status = db.professional_profiles[idx].docs_verified ? 'aprovado' : 'pendente';
      }
    } else if (role === 'empresa') {
      const idx = db.company_profiles.findIndex(p => p.user_id === userId);
      if (idx !== -1) {
        db.company_profiles[idx].is_verified = !db.company_profiles[idx].is_verified;
      }
    }
    saveDb(db);
    refresh();
    if (viewingUser) {
      const dbFresh = getDb();
      const extra = role === 'profissional' 
        ? dbFresh.professional_profiles.find(d => d.user_id === userId) 
        : dbFresh.company_profiles.find(d => d.user_id === userId);
      setViewingUser({ ...viewingUser, extra });
    }
  };

  const filteredUsers = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'todos' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendentesProfs = profData.filter(p => p.approval_status === 'pendente');
  const pendentesComps = compData.filter(c => !c.is_verified);

  return (
    <Layout title="Painel de Controle">
      <div className="px-5 pb-24 space-y-6">
        
        {/* Sumário de Operações */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Auditados" value={compData.filter(c => c.is_verified).length + profData.filter(p => p.docs_verified).length} icon={<Icons.Check />} color="bg-green-600" />
          <StatCard label="Aguardando" value={pendentesComps.length + pendentesProfs.length} icon={<Icons.Search />} color="bg-amber-500" />
        </div>

        {/* Tabs de Navegação Principal */}
        <div className="flex bg-gray-100 p-1 rounded-2xl sticky top-0 z-30 shadow-sm">
          {(['usuarios', 'pendentes', 'chamados', 'config'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              {tab === 'pendentes' ? `Auditoria (${pendentesComps.length + pendentesProfs.length})` : tab}
            </button>
          ))}
        </div>

        {activeTab === 'usuarios' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 pointer-events-none scale-75"><Icons.Search /></div>
                  <input 
                    type="text" placeholder="Nome, e-mail ou empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-black text-white px-5 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-xl"
                  title="Novo Cadastro"
                >
                  <Icons.Plus />
                </button>
             </div>

             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['todos', 'empresa', 'profissional'] as const).map(f => (
                  <button 
                    key={f} onClick={() => setRoleFilter(f)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap ${roleFilter === f ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'empresa' ? 'Empresas' : 'Profissionais'}
                  </button>
                ))}
             </div>

             {roleFilter === 'empresa' && (
               <button 
                onClick={() => { setRoleFilter('empresa'); setIsCreating(true); }}
                className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl border-2 border-dashed border-blue-200 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
               >
                 <Icons.Plus /> CADASTRAR NOVA EMPRESA CONTRATANTE
               </button>
             )}

             <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                {filteredUsers.map(p => {
                  const extra = p.role === 'profissional' ? profData.find(d => d.user_id === p.id) : compData.find(d => d.user_id === p.id);
                  const verified = p.role === 'profissional' ? (extra as ProfessionalProfile)?.docs_verified : (extra as CompanyProfile)?.is_verified;
                  
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => setViewingUser({ profile: p, extra })}
                      className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${p.role === 'empresa' ? 'bg-blue-600' : 'bg-green-600'}`}>
                          {p.role === 'empresa' ? <Icons.Home /> : <Icons.User />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm text-gray-900 leading-tight">
                              {p.role === 'empresa' && extra ? extra.company_name : p.name}
                            </p>
                            {verified && <div className="text-blue-500 scale-75"><Icons.Check /></div>}
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.role} • {p.email}</p>
                        </div>
                      </div>
                      <Icons.ArrowRight />
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {activeTab === 'pendentes' && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-10">
             <div>
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Empresas Aguardando Validação ({pendentesComps.length})</h3>
               <div className="space-y-3">
                {pendentesComps.map(c => {
                  const user = profiles.find(u => u.id === c.user_id);
                  return (
                    <div key={c.user_id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-gray-900 leading-none mb-1">{c.company_name}</h4>
                          <p className="text-[10px] font-bold text-gray-400">CNPJ: {c.cnpj}</p>
                        </div>
                        <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-full uppercase">Pendente</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 py-3 border-y border-gray-50">
                         <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase">Segmento</p>
                            <p className="text-[10px] font-bold">{c.segment}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase">Localização</p>
                            <p className="text-[10px] font-bold">{c.address}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setViewingUser({ profile: user!, extra: c })}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
                      >
                        Verificar Documentação
                      </button>
                    </div>
                  );
                })}
                {pendentesComps.length === 0 && <p className="text-center text-xs text-gray-300 font-bold italic py-4">Nenhuma empresa pendente.</p>}
               </div>
             </div>

             <div>
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Profissionais Aguardando Aprovação ({pendentesProfs.length})</h3>
               <div className="space-y-3">
                {pendentesProfs.map(p => {
                  const user = profiles.find(pr => pr.id === p.user_id);
                  return (
                    <div key={p.user_id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between">
                          <h4 className="font-black text-gray-900">{user?.name}</h4>
                          <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-full uppercase">Pendente</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.skills.map(s => <span key={s} className="text-[8px] bg-gray-50 px-2 py-1 rounded-lg font-bold uppercase">{s}</span>)}
                        </div>
                        <button 
                          onClick={() => setViewingUser({ profile: user!, extra: p })}
                          className="w-full bg-black text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Auditar Currículo
                        </button>
                    </div>
                  );
                })}
               </div>
             </div>
          </div>
        )}

        {/* Modal de Detalhes e Verificação */}
        {viewingUser && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingUser(null)}></div>
            <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                      {viewingUser.profile.role === 'empresa' ? viewingUser.extra.company_name : viewingUser.profile.name}
                    </h2>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{viewingUser.profile.role}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    (viewingUser.profile.role === 'empresa' ? viewingUser.extra.is_verified : viewingUser.extra.docs_verified) 
                    ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {(viewingUser.profile.role === 'empresa' ? viewingUser.extra.is_verified : viewingUser.extra.docs_verified) ? 'Verificado' : 'Em Auditoria'}
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="E-mail" value={viewingUser.profile.email} />
                    <DetailRow label="WhatsApp" value={viewingUser.profile.phone} />
                  </div>
                  
                  {viewingUser.profile.role === 'empresa' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Razão Social" value={viewingUser.extra.company_name} />
                        <DetailRow label="CNPJ" value={viewingUser.extra.cnpj} />
                        <DetailRow label="Segmento" value={viewingUser.extra.segment} />
                        <DetailRow label="Bairro" value={viewingUser.extra.address} />
                      </div>
                      <DetailRow label="Logradouro" value={viewingUser.extra.full_address} />
                      <button 
                        onClick={() => toggleVerification(viewingUser.profile.id, 'empresa')}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${viewingUser.extra.is_verified ? 'bg-red-50 text-red-600' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`}
                      >
                        {viewingUser.extra.is_verified ? 'REVOGAR VERIFICAÇÃO' : 'APROVAR E VERIFICAR EMPRESA'}
                      </button>
                    </div>
                  )}

                  {viewingUser.profile.role === 'profissional' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <DetailRow label="Resumo" value={viewingUser.extra.bio || 'Sem bio'} />
                      <div className="flex flex-wrap gap-2">
                         {viewingUser.extra.skills.map((s:string) => <span key={s} className="bg-gray-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{s}</span>)}
                      </div>
                      <button 
                        onClick={() => toggleVerification(viewingUser.profile.id, 'profissional')}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${viewingUser.extra.docs_verified ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white shadow-xl shadow-green-600/20'}`}
                      >
                        {viewingUser.extra.docs_verified ? 'REVOGAR APROVAÇÃO' : 'APROVAR E LIBERAR PERFIL'}
                      </button>
                    </div>
                  )}
               </div>
               <button onClick={() => setViewingUser(null)} className="w-full mt-6 bg-gray-50 text-gray-400 py-4 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">Fechar Detalhes</button>
            </div>
          </div>
        )}

        {/* Modal de Criação (Customizado para Admin) */}
        {isCreating && (
          <UserCreationForm 
            onClose={() => setIsCreating(false)} 
            onSave={handleSaveUser}
          />
        )}

      </div>
    </Layout>
  );
};

const UserCreationForm = ({ onClose, onSave }: { onClose: () => void, onSave: any }) => {
  const [role, setRole] = useState<Role>('empresa');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Empresa extra
  const [compName, setCompName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('Varejo');
  const [neighborhood, setNeighborhood] = useState('Centro');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = `admin-u-${Date.now()}`;
    const profile: Profile = {
      id: userId,
      role, name, email, phone,
      is_suspended: false,
      created_at: new Date().toISOString()
    };

    let extra: any;
    if (role === 'empresa') {
      const coords = (RJ_COORDS as any)[neighborhood];
      extra = {
        user_id: userId,
        company_name: compName || name,
        owner_name: name,
        cnpj,
        segment,
        address: neighborhood,
        full_address: 'Registrado via Admin',
        zip_code: '20000-000',
        geo_lat: coords.lat,
        geo_lng: coords.lng,
        is_verified: true // Admin criando já verifica automaticamente se desejar
      };
    } else {
      extra = {
        user_id: userId,
        approval_status: 'aprovado',
        skills: [SKILLS_LIST[0]],
        rating_avg: 5.0,
        jobs_completed: 0,
        city: 'Rio de Janeiro',
        geo_lat: RJ_COORDS.Centro.lat,
        geo_lng: RJ_COORDS.Centro.lng,
        docs_verified: true,
        bio: 'Perfil criado pelo administrador.'
      };
    }

    onSave(profile, extra);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[2.5rem] relative z-10 p-8 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Cadastro Admin</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button type="button" onClick={() => setRole('empresa')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'empresa' ? 'bg-black text-white' : 'text-gray-400'}`}>Empresa</button>
          <button type="button" onClick={() => setRole('profissional')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'profissional' ? 'bg-black text-white' : 'text-gray-400'}`}>Profissional</button>
        </div>

        <div className="space-y-4">
          <Input label="Nome Completo do Responsável" value={name} onChange={setName} placeholder="Ex: João da Silva" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-mail de Acesso" value={email} onChange={setEmail} type="email" placeholder="gestor@email.com" />
            <Input label="WhatsApp" value={phone} onChange={setPhone} placeholder="21999999999" />
          </div>

          {role === 'empresa' && (
            <div className="pt-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top duration-300">
               <Input label="Razão Social / Nome Fantasia" value={compName} onChange={setCompName} placeholder="Padaria da Esquina" />
               <Input label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0001-00" />
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Segmento</label>
                    <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm">
                      <option>Varejo</option><option>Alimentação</option><option>Saúde</option><option>Serviços</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bairro Sede</label>
                    <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold text-sm">
                      {Object.keys(RJ_COORDS).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
               </div>
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all">Finalizar Cadastro</button>
        <button type="button" onClick={onClose} className="w-full text-gray-400 font-bold text-xs uppercase py-2">Cancelar</button>
      </form>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder }: any) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} placeholder={placeholder}
      className="w-full p-4 bg-gray-50 border border-transparent rounded-xl outline-none text-sm font-bold focus:border-black transition-all"
      value={value} onChange={e => onChange(e.target.value)} required 
    />
  </div>
);

const DetailRow = ({ label, value }: { label: string, value: string | number }) => (
  <div>
    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">{label}</p>
    <p className="text-xs font-bold text-gray-800 leading-tight">{value}</p>
  </div>
);

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
    <div className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-lg font-black text-gray-900 leading-none mb-0.5">{value}</p>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default AdminDashboard;
