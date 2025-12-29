
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../services/mockDatabase';
import { JobRequest, Rating, JobAssignment, Profile, ProfessionalProfile } from '../types';
import Layout from '../components/Layout';
import { Icons } from '../constants';

const EmpresaDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allJobs, setAllJobs] = useState<JobRequest[]>([]);
  const [filterType, setFilterType] = useState<'ativos' | 'todos'>('ativos');
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profData, setProfData] = useState<ProfessionalProfile[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  
  // Estados para Notificação
  const [notification, setNotification] = useState<{jobId: string, profName: string, title: string} | null>(null);
  const prevJobsRef = useRef<JobRequest[]>([]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  const refreshData = () => {
    const db = getDb();
    const currentJobs = db.job_requests.filter(j => j.company_id === user?.id).reverse();
    
    // Lógica para detectar novo Match (transição distribuido -> match_confirmado)
    if (prevJobsRef.current.length > 0) {
      currentJobs.forEach(job => {
        const prevJob = prevJobsRef.current.find(pj => pj.id === job.id);
        if (prevJob && prevJob.status === 'distribuido' && job.status === 'match_confirmado') {
          const asg = db.job_assignments.find(a => a.job_id === job.id);
          const prof = db.profiles.find(p => p.id === asg?.professional_id);
          
          if (prof) {
            setNotification({
              jobId: job.id,
              profName: prof.name,
              title: job.title
            });
            playNotificationSound();
            setTimeout(() => setNotification(null), 7000);
          }
        }
      });
    }

    setAllJobs(currentJobs);
    prevJobsRef.current = currentJobs;
    setAssignments(db.job_assignments);
    setProfiles(db.profiles);
    setProfData(db.professional_profiles);
    setRatings(db.ratings.filter(r => r.rater_id === user?.id));
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('meup-job-updated', refreshData);
    return () => window.removeEventListener('meup-job-updated', refreshData);
  }, [user]);

  const getStatusColor = (status: JobRequest['status'], jobId: string) => {
    const asg = assignments.find(a => a.job_id === jobId);
    if (asg?.status === 'cheguei') return 'bg-blue-600 text-white animate-pulse';
    
    switch (status) {
      case 'finalizado': return 'bg-gray-100 text-gray-400';
      case 'em_andamento': return 'bg-blue-50 text-blue-600';
      case 'match_confirmado': return 'bg-green-50 text-green-600';
      case 'cancelado': return 'bg-red-50 text-red-400';
      default: return 'bg-yellow-50 text-yellow-600';
    }
  };

  const hasBeenRated = (jobId: string) => ratings.some(r => r.job_id === jobId);

  const getProfessionalInfo = (jobId: string) => {
    const asg = assignments.find(a => a.job_id === jobId);
    if (!asg) return null;
    const profile = profiles.find(p => p.id === asg.professional_id);
    const data = profData.find(pd => pd.user_id === asg.professional_id);
    return { profile, data, status: asg.status };
  };

  const filteredJobs = allJobs.filter(job => {
    if (filterType === 'ativos') {
      return !['finalizado', 'cancelado'].includes(job.status);
    }
    return true;
  });

  return (
    <Layout title="Meus Chamados">
      {/* Toast de Notificação de Match */}
      {notification && (
        <div className="fixed top-16 left-0 right-0 z-[100] px-4 animate-in slide-in-from-top duration-500">
          <div 
            onClick={() => { setNotification(null); navigate(`/job/${notification.jobId}`); }}
            className="bg-black text-white p-5 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-blue-500/40 flex items-center justify-between gap-4 cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 relative">
                <Icons.Check />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none mb-1.5">Trabalho Confirmado!</p>
                <h4 className="text-sm font-black leading-tight truncate">
                  <span className="text-blue-200">{notification.profName}</span> aceitou o chamado
                </h4>
              </div>
            </div>
            <div className="shrink-0 bg-white/10 p-2 rounded-lg">
              <Icons.ArrowRight />
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pb-5 space-y-4">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/empresa/novo-chamado')}
            className="w-full bg-black text-white p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-base shadow-xl active:scale-[0.98] transition-all"
          >
            <Icons.Plus /> CRIAR NOVO CHAMADO
          </button>
          
          <button 
            onClick={() => setFilterType(filterType === 'todos' ? 'ativos' : 'todos')}
            className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs transition-all border-2 active:scale-[0.98] ${
              filterType === 'todos' 
              ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' 
              : 'bg-white border-gray-100 text-gray-400 shadow-sm'
            }`}
          >
            <Icons.Search /> {filterType === 'todos' ? 'OCULTAR HISTÓRICO' : 'VER HISTÓRICO COMPLETO'}
          </button>
        </div>

        <div className="pt-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">
            {filterType === 'ativos' ? 'Chamados em Aberto' : 'Histórico Completo'}
          </h3>
          <div className="space-y-4">
            {filteredJobs.length === 0 && (
              <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center">
                <p className="text-gray-300 text-sm font-bold italic">Nenhum chamado registrado.</p>
              </div>
            )}
            {filteredJobs.map(job => {
              const profInfo = getProfessionalInfo(job.id);
              const showProfInfo = ['match_confirmado', 'em_andamento', 'finalizado'].includes(job.status) && profInfo?.profile;
              const isProgress = job.status === 'em_andamento';
              const isArrived = profInfo?.status === 'cheguei';

              return (
                <div 
                  key={job.id} 
                  className={`bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all ${job.status === 'cancelado' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  <div 
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="p-5 cursor-pointer active:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${getStatusColor(job.status, job.id)}`}>
                        {isArrived ? 'NO LOCAL' : job.status.replace('_', ' ')}
                      </span>
                      <span className="text-lg font-black text-gray-900">R$ {job.value_offered}</span>
                    </div>
                    <h4 className="font-black text-lg text-gray-900 mb-2 leading-tight">{job.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="shrink-0 scale-75"><Icons.Map /></div>
                      <span className="truncate font-medium">{job.address_text}</span>
                    </div>
                  </div>
                  
                  {showProfInfo && (
                    <div className={`border-t border-gray-100 p-4 px-5 flex flex-col gap-3 ${isProgress || isArrived ? 'bg-blue-50/20' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                            <Icons.User />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">
                              {isArrived ? 'PARCEIRO CHEGOU' : 'Profissional Alocado'}
                            </p>
                            <h5 className="text-sm font-black text-gray-900 truncate">{profInfo.profile?.name}</h5>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${job.id}`);
                          }}
                          className={`text-[10px] font-black px-4 py-2.5 rounded-xl active:scale-95 transition-all shrink-0 ml-3 shadow-sm ${
                            isArrived 
                            ? 'bg-blue-600 text-white ring-2 ring-blue-100' 
                            : 'bg-white text-blue-600 border border-blue-50'
                          }`}
                        >
                          {isArrived ? 'CONFIRMAR CHEGADA' : 'ABRIR MAPA'}
                        </button>
                      </div>
                    </div>
                  )}

                  {job.status === 'finalizado' && !hasBeenRated(job.id) && (
                    <div className="bg-green-50/50 border-t border-green-50 p-4">
                      <button 
                        onClick={() => navigate(`/avaliar/${job.id}`)}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-green-600/10 active:scale-95 transition-all"
                      >
                        AVALIAR PROFISSIONAL
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmpresaDashboard;
