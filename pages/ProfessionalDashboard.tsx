
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, saveDb } from '../services/mockDatabase';
import { JobOffer, JobRequest, JobAssignment, CompanyProfile } from '../types';
import Layout from '../components/Layout';
import { Icons, RJ_COORDS } from '../constants';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<(JobOffer & { job: JobRequest, company?: CompanyProfile })[]>([]);
  const [declinedOffers, setDeclinedOffers] = useState<(JobOffer & { job: JobRequest, company?: CompanyProfile })[]>([]);
  const [activeJob, setActiveJob] = useState<JobAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<'disponiveis' | 'recusadas'>('disponiveis');

  const refresh = () => {
    const db = getDb();
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
    
    const current = db.job_assignments.find(a => a.professional_id === user?.id && a.status !== 'finalizado');
    setActiveJob(current || null);
  };

  useEffect(() => refresh(), [user]);

  const simulateNewOffer = () => {
    const db = getDb();
    const newJobId = `sim-job-${Date.now()}`;
    const comp = db.company_profiles[0];
    
    if (!comp) {
        alert("Nenhuma empresa cadastrada no sistema. Por favor, inicialize o banco na tela de Login.");
        return;
    }

    db.job_requests.push({
      id: newJobId,
      company_id: comp.user_id,
      title: "Reforço Operacional (SIMULADO)",
      description: "Trabalho imediato simulado para teste de fluxo.",
      skill_required: "caixa",
      date_start: new Date().toISOString(),
      duration_hours: 4,
      value_offered: 150,
      address_text: comp.address,
      geo_lat: comp.geo_lat,
      geo_lng: comp.geo_lng,
      status: 'distribuido',
      created_at: new Date().toISOString()
    });

    db.job_offers.push({
      id: `sim-off-${Date.now()}`,
      job_id: newJobId,
      professional_id: user!.id,
      status: 'enviado',
      sent_at: new Date().toISOString()
    });

    saveDb(db);
    refresh();
  };

  const handleOffer = (offerId: string, action: 'aceito' | 'recusado' | 'enviado') => {
    const db = getDb();
    const offIdx = db.job_offers.findIndex(o => o.id === offerId);
    if (offIdx === -1) return;

    db.job_offers[offIdx].status = action;
    
    if (action === 'aceito') {
      const offer = db.job_offers[offIdx];
      const job = db.job_requests.find(j => j.id === offer.job_id)!;
      
      db.job_assignments.push({
        id: `asg-${Date.now()}`,
        job_id: offer.job_id,
        company_id: job.company_id,
        professional_id: user!.id,
        status: 'a_caminho',
        last_lat: RJ_COORDS.Meier.lat,
        last_lng: RJ_COORDS.Meier.lng,
        updated_at: new Date().toISOString()
      });

      const jobIdx = db.job_requests.findIndex(j => j.id === offer.job_id);
      db.job_requests[jobIdx].status = 'match_confirmado';

      db.chat_threads.push({
        id: `th-${Date.now()}`,
        job_id: offer.job_id,
        company_id: job.company_id,
        professional_id: user!.id,
        created_at: new Date().toISOString()
      });
    }

    saveDb(db);
    // CRITICAL: Dispatch event for notifications in other components
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    
    refresh();
    if (action === 'aceito') {
      const dbFresh = getDb();
      const offer = dbFresh.job_offers.find(o => o.id === offerId);
      if (offer) navigate(`/job/${offer.job_id}`);
    }
  };

  const removeOfferPermanently = (offerId: string) => {
    const db = getDb();
    db.job_offers = db.job_offers.filter(o => o.id !== offerId);
    saveDb(db);
    refresh();
  };

  const currentDisplayList = activeTab === 'disponiveis' ? offers : declinedOffers;

  return (
    <Layout title="Trabalhos Próximos">
      <div className="px-5 pb-5 space-y-5">
        {/* Active Job Alert */}
        {activeJob && (
          <div className="bg-black text-white p-5 rounded-2xl shadow-xl border-t-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[10px] uppercase font-black tracking-widest text-blue-400 mb-1">Trabalho Ativo</h3>
                <h4 className="text-xl font-black">Em andamento</h4>
              </div>
              <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                <Icons.Map />
              </div>
            </div>
            <button 
              onClick={() => navigate(`/job/${activeJob.job_id}`)}
              className="w-full bg-blue-600 py-4 rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              ABRIR MAPA DA CORRIDA
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('disponiveis')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'disponiveis' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
          >
            Disponíveis ({offers.length})
          </button>
          <button 
            onClick={() => setActiveTab('recusadas')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'recusadas' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
          >
            Recusadas ({declinedOffers.length})
          </button>
        </div>

        {/* Offers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {activeTab === 'disponiveis' ? 'Ofertas no seu radar' : 'Ofertas descartadas'}
            </h3>
          </div>

          {/* Prominent Demo Simulation Button for Professionals */}
          {activeTab === 'disponiveis' && (
            <button 
              onClick={simulateNewOffer}
              className="w-full bg-blue-50 border-2 border-dashed border-blue-200 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 group active:scale-[0.98] transition-all hover:bg-blue-100/50"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Icons.Search />
              </div>
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.15em]">Simular Nova Oferta Próxima</span>
              <p className="text-[9px] text-blue-400 font-bold max-w-[200px] text-center">Gera um novo chamado automático para teste imediato do fluxo.</p>
            </button>
          )}

          <div className="space-y-4">
            {currentDisplayList.length === 0 && activeTab === 'recusadas' && (
              <div className="bg-white border border-dashed border-gray-200 rounded-[2rem] p-10 text-center">
                <p className="text-gray-300 text-sm font-bold italic">Nenhuma oferta recusada no histórico.</p>
              </div>
            )}
            
            {currentDisplayList.map(off => (
              <div key={off.id} className={`bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group transition-all ${activeTab === 'recusadas' ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h4 className="font-black text-xl text-gray-900 leading-tight mb-1">{off.job.title}</h4>
                      <button 
                        onClick={() => navigate(`/empresa/${off.job.company_id}`)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                      >
                        <Icons.User />
                        <span>{off.company?.company_name || 'Ver Contratante'}</span>
                        <Icons.Star filled />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Ganhos</p>
                      <span className="font-black text-2xl text-green-600">R$ {off.job.value_offered}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                      <div className="shrink-0 text-gray-400"><Icons.Map /></div>
                      <span className="truncate font-medium">{off.job.address_text}</span>
                    </div>
                  </div>

                  {activeTab === 'disponiveis' ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleOffer(off.id, 'aceito')} 
                        className="flex-[2] bg-black text-white py-4 rounded-2xl font-black text-base active:scale-95 transition-all shadow-xl shadow-black/10"
                      >
                        Aceitar Oferta
                      </button>
                      <button 
                        onClick={() => handleOffer(off.id, 'recusado')} 
                        className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleOffer(off.id, 'enviado')} 
                        className="flex-[2] bg-gray-100 text-gray-900 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
                      >
                        Reconsiderar
                      </button>
                      <button 
                        onClick={() => removeOfferPermanently(off.id)} 
                        className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all border border-red-100"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;
