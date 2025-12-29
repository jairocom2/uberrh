
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, saveDb, forceCloudFetch } from '../services/mockDatabase';
import { JobOffer, JobRequest, JobAssignment, CompanyProfile } from '../types';
import Layout from '../components/Layout';
import { Icons, RJ_COORDS } from '../constants';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<(JobOffer & { job: JobRequest, company?: CompanyProfile })[]>([]);
  const [declinedOffers, setDeclinedOffers] = useState<(JobOffer & { job: JobRequest, company?: CompanyProfile })[]>([]);
  const [openJobs, setOpenJobs] = useState<(JobRequest & { company?: CompanyProfile })[]>([]);
  const [activeJob, setActiveJob] = useState<JobAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<'disponiveis' | 'recusadas'>('disponiveis');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const room = localStorage.getItem('meup_sync_room');

  const refreshState = () => {
    const db = getDb();
    setLastUpdate(new Date());
    
    const allProfOffers = db.job_offers
      .filter(o => o.professional_id === user?.id)
      .map(o => {
        const job = db.job_requests.find(j => j.id === o.job_id);
        const company = db.company_profiles.find(cp => cp.user_id === job?.company_id);
        return { ...o, job: job!, company };
      })
      .filter(o => o.job !== undefined);

    setOffers(allProfOffers.filter(o => o.status === 'enviado').reverse());
    setDeclinedOffers(allProfOffers.filter(o => o.status === 'recusado').reverse());
    
    const open = db.job_requests
      .filter(j => (j.status === 'aberto' || j.status === 'distribuido'))
      .map(j => {
        const company = db.company_profiles.find(cp => cp.user_id === j.company_id);
        return { ...j, company };
      })
      .filter(j => !allProfOffers.some(o => o.job_id === j.id)); 
    
    setOpenJobs(open.reverse());

    const current = db.job_assignments.find(a => a.professional_id === user?.id && a.status !== 'finalizado');
    setActiveJob(current || null);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (room) {
      await forceCloudFetch(room);
    }
    refreshState();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    refreshState();
    window.addEventListener('meup-job-updated', refreshState);
    if (room) forceCloudFetch(room).then(refreshState);
    return () => window.removeEventListener('meup-job-updated', refreshState);
  }, [user, room]);

  const handleAcceptJob = (jobId: string) => {
    const db = getDb();
    const jobIdx = db.job_requests.findIndex(j => j.id === jobId);
    if (jobIdx === -1) return;
    const job = db.job_requests[jobIdx];
    
    db.job_assignments.push({
      id: `asg-${Date.now()}`,
      job_id: job.id,
      company_id: job.company_id,
      professional_id: user!.id,
      status: 'a_caminho',
      last_lat: RJ_COORDS.Meier.lat,
      last_lng: RJ_COORDS.Meier.lng,
      updated_at: new Date().toISOString()
    });
    db.job_requests[jobIdx].status = 'match_confirmado';
    db.chat_threads.push({
      id: `th-${Date.now()}`,
      job_id: job.id,
      company_id: job.company_id,
      professional_id: user!.id,
      created_at: new Date().toISOString()
    });
    saveDb(db);
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    navigate(`/job/${jobId}`);
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-gray-50/20 overflow-hidden">
        
        {/* Radar Header V6 - SE ISSO NÃO APARECER, O CACHE NÃO FOI LIMPO */}
        <div className="bg-white px-5 pt-6 pb-6 border-b border-gray-100 shadow-sm relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm ${!isRefreshing ? 'animate-ping' : ''}`}></div>
                <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Radar {room ? room.toUpperCase() : 'Ativado'}</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                  {isRefreshing ? 'Sincronizando...' : `Update: ${lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 text-[11px] font-black uppercase px-5 py-3 rounded-2xl transition-all shadow-xl active:scale-90 ${isRefreshing ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              <div className={isRefreshing ? 'animate-spin' : ''}><Icons.Search /></div>
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {activeJob && (
          <div className="px-5 mt-4 animate-in zoom-in duration-300">
            <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-4 ring-blue-50">
               <div className="relative z-10">
                 <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">Trabalho em Curso</p>
                 <h4 className="text-xl font-black mb-4 tracking-tighter">Você tem um job ativo agora!</h4>
                 <button onClick={() => navigate(`/job/${activeJob.job_id}`)} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-[11px] uppercase shadow-xl tracking-widest">Abrir Mapa de Apoio</button>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10 scale-150 rotate-12"><Icons.Map /></div>
            </div>
          </div>
        )}

        <div className="px-5 mt-6 mb-4">
          <div className="flex bg-gray-200/50 p-1.5 rounded-2xl">
            <button onClick={() => setActiveTab('disponiveis')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'disponiveis' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>
              Disponíveis ({offers.length + openJobs.length})
            </button>
            <button onClick={() => setActiveTab('recusadas')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recusadas' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>
              Recusadas ({declinedOffers.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-12 no-scrollbar">
          {activeTab === 'disponiveis' ? (
            <div className="space-y-4">
              {(offers.length === 0 && openJobs.length === 0) && (
                <div className="bg-white border border-gray-100 rounded-[3rem] p-16 text-center shadow-sm mt-4 animate-in fade-in duration-1000">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 relative">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-full animate-ping"></div>
                    <Icons.Search />
                  </div>
                  <p className="text-gray-900 text-xl font-black tracking-tighter mb-1">Escaneando...</p>
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4 uppercase tracking-tighter">
                    O radar está buscando reforços operacionais próximos a você em tempo real.
                  </p>
                </div>
              )}

              {openJobs.map(job => (
                <JobCard 
                  key={job.id} 
                  title={job.title} 
                  value={job.value_offered} 
                  address={job.address_text} 
                  company={job.company?.company_name}
                  onAccept={() => handleAcceptJob(job.id)}
                  onDecline={() => { /* ocultar da lista atual */ }}
                />
              ))}

              {offers.map(off => (
                <JobCard 
                  key={off.id} 
                  title={off.job.title} 
                  value={off.job.value_offered} 
                  address={off.job.address_text} 
                  company={off.company?.company_name}
                  isOffer
                  onAccept={() => handleAcceptJob(off.job_id)}
                  onDecline={() => { /* ... */ }}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest italic">Nenhum chamado recusado.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const JobCard = ({ title, value, address, company, onAccept, onDecline, isOffer }: any) => (
  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/30 animate-in slide-in-from-bottom duration-500 hover:scale-[1.02] transition-transform ring-1 ring-black/5">
    <div className="flex justify-between items-start mb-6">
      <div className="flex-1 pr-4">
        {isOffer && <span className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-lg">Chamado Direto</span>}
        <h4 className="font-black text-2xl text-gray-900 leading-[1] mb-1 tracking-tighter">{title}</h4>
        <p className="text-[12px] text-blue-600 font-black uppercase tracking-tighter">{company || 'Contratante MeUp'}</p>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Ganhos</p>
        <span className="font-black text-2xl text-green-600 tracking-tighter">R${value}</span>
      </div>
    </div>
    <div className="flex items-center gap-3 text-xs text-gray-400 bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100/50">
      <Icons.Map />
      <span className="truncate font-bold uppercase tracking-tighter">{address}</span>
    </div>
    <div className="flex gap-4">
      <button onClick={onAccept} className="flex-[2.5] bg-black text-white py-5 rounded-[1.5rem] font-black text-lg active:scale-95 transition-all shadow-2xl shadow-black/20 uppercase tracking-widest">Aceitar</button>
      <button onClick={onDecline} className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[1.5rem] font-black text-[10px] active:scale-95 transition-all uppercase tracking-widest">Pular</button>
    </div>
  </div>
);

export default ProfessionalDashboard;
