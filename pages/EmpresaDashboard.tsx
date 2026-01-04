
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
  const [notification, setNotification] = useState<{jobId: string, profName: string, title: string} | null>(null);
  const prevJobsRef = useRef<JobRequest[]>([]);

  const syncRoom = localStorage.getItem('meup_sync_room');

  const copyInviteLink = () => {
    if (!syncRoom) {
      alert("Primeiro, conecte-se a uma sala clicando no mapa no topo!");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?room=${syncRoom}`;
    navigator.clipboard.writeText(url);
    alert("LINK DE CONVITE COPIADO!\nEnvie para o celular do profissional e ele entrará na mesma sala automaticamente.");
  };

  const refreshData = () => {
    const db = getDb();
    const currentJobs = db.job_requests.filter(j => j.company_id === user?.id).reverse();
    
    if (prevJobsRef.current.length > 0) {
      currentJobs.forEach(job => {
        const prevJob = prevJobsRef.current.find(pj => pj.id === job.id);
        if (prevJob && prevJob.status === 'distribuido' && job.status === 'match_confirmado') {
          const asg = db.job_assignments.find(a => a.job_id === job.id);
          const prof = db.profiles.find(p => p.id === asg?.professional_id);
          if (prof) {
            setNotification({ jobId: job.id, profName: prof.name, title: job.title });
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

  const filteredJobs = allJobs.filter(job => filterType === 'ativos' ? !['finalizado', 'cancelado'].includes(job.status) : true);

  return (
    <Layout title="Meus Chamados">
      {notification && (
        <div className="fixed top-16 left-0 right-0 z-[100] px-4 animate-in slide-in-from-top duration-500">
          <div onClick={() => { setNotification(null); navigate(`/job/${notification.jobId}`); }}
               className="bg-black text-white p-5 rounded-[1.5rem] shadow-2xl border border-blue-500/40 flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"><Icons.Check /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Novo Match!</p>
                <h4 className="text-sm font-black leading-tight truncate">{notification.profName} aceitou!</h4>
              </div>
            </div>
            <Icons.ArrowRight />
          </div>
        </div>
      )}

      <div className="px-5 pb-5 space-y-4">
        {/* Ferramentas de Sincronia */}
        <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col gap-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Ferramentas de Sincronia V6</p>
          <button 
            onClick={copyInviteLink}
            className="w-full bg-blue-50 text-blue-600 p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
          >
            <Icons.Plus /> COPIAR LINK DE CONVITE DA SALA
          </button>
        </div>

        <button 
          onClick={() => navigate('/empresa/novo-chamado')}
          className="w-full bg-black text-white p-5 rounded-3xl flex items-center justify-center gap-3 font-black text-base shadow-2xl active:scale-[0.98] transition-all"
        >
          <Icons.Plus /> CRIAR NOVO CHAMADO
        </button>

        <div className="pt-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">
            {filterType === 'ativos' ? 'Chamados em Aberto' : 'Histórico Completo'}
          </h3>
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm active:bg-gray-50 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${job.status === 'match_confirmado' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-black text-gray-900">R$ {job.value_offered}</span>
                </div>
                <h4 className="font-black text-lg text-gray-900 mb-1">{job.title}</h4>
                <p className="text-xs text-gray-400 font-medium">{job.address_text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmpresaDashboard;
