
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, startCloudSync, stopCloudSync } from '../services/mockDatabase';
import { Icons } from '../constants';
import { JobAssignment } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, noPadding = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<JobAssignment['status'] | null>(null);
  
  // Sync State
  const [syncRoom, setSyncRoom] = useState<string | null>(localStorage.getItem('meup_sync_room'));
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshActiveJob = () => {
    if (!user) return;
    const db = getDb();
    let jobId: string | null = null;
    let status: JobAssignment['status'] | null = null;

    if (user.role === 'profissional') {
      const activeAsg = db.job_assignments.find(a => a.professional_id === user.id && a.status !== 'finalizado');
      if (activeAsg) { jobId = activeAsg.job_id; status = activeAsg.status; }
    } else if (user.role === 'empresa') {
      const activeJob = db.job_requests.find(j => j.company_id === user.id && (j.status === 'match_confirmado' || j.status === 'em_andamento'));
      if (activeJob) {
        jobId = activeJob.id;
        const asg = db.job_assignments.find(a => a.job_id === activeJob.id);
        if (asg) status = asg.status;
      }
    }
    setActiveJobId(jobId);
    setActiveStatus(status);
  };

  useEffect(() => {
    refreshActiveJob();
    window.addEventListener('meup-job-updated', refreshActiveJob);
    
    // Iniciar sync se houver sala salva
    let stop: (() => void) | undefined;
    if (syncRoom) {
      setIsSyncing(true);
      stop = startCloudSync(syncRoom, () => {
        refreshActiveJob();
        window.dispatchEvent(new CustomEvent('meup-job-updated'));
      });
    }

    return () => {
      window.removeEventListener('meup-job-updated', refreshActiveJob);
      if (stop) stop();
    };
  }, [user, location.pathname, syncRoom]);

  const handleSyncToggle = () => {
    if (syncRoom) {
      if (confirm("Deseja sair da sala de sincronização? Seus dados voltarão a ser apenas locais.")) {
        stopCloudSync();
        setSyncRoom(null);
        setIsSyncing(false);
      }
    } else {
      const room = prompt("Digite um código para criar/entrar em uma sala de teste compartilhado (ex: MEUP-RIO):");
      if (room && room.trim()) {
        setSyncRoom(room.trim());
      }
    }
  };

  const goHome = () => {
    if (user?.role === 'empresa') navigate('/empresa/dashboard');
    else if (user?.role === 'profissional') navigate('/profissional/dashboard');
    else if (user?.role === 'admin') navigate('/admin');
    else navigate('/');
  };

  const isJobPage = location.pathname.startsWith('/job/');
  const currentJobId = location.pathname.split('/').pop();
  const showCheckInFAB = isJobPage && user?.role === 'profissional' && activeJobId === currentJobId && activeStatus === 'a_caminho';
  const showNav = user && !['/login', '/onboarding'].includes(location.pathname);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white shadow-xl relative overflow-hidden mx-auto max-w-md border-x">
      <div className="bg-blue-600 text-white text-[8px] py-1 text-center font-bold z-50 uppercase tracking-widest shrink-0">
        PAGAMENTOS POR FORA DA PLATAFORMA
      </div>

      <header className="px-5 py-2 flex items-center justify-between border-b bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
          <div className="w-7 h-7 bg-black rounded flex items-center justify-center">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <h1 className="text-lg font-black tracking-tighter">MeUp</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Sync Cloud */}
          {user && (
            <button 
              onClick={handleSyncToggle}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 ${syncRoom ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}
              title={syncRoom ? `Sincronizado na sala: ${syncRoom}` : "Sincronizar com outro celular"}
            >
              <div className={`${isSyncing && syncRoom ? 'animate-pulse' : ''}`}>
                <Icons.Map />
              </div>
              {syncRoom && <span className="text-[8px] font-black uppercase tracking-tighter">{syncRoom}</span>}
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2 ml-1">
              <div className="text-right hidden sm:block">
                <p className="text-[7px] font-bold text-gray-400 uppercase leading-none">{user.role}</p>
                <p className="text-[10px] font-bold leading-tight">{user.name.split(' ')[0]}</p>
              </div>
              <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-300">
                <Icons.LogOut />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative flex flex-col no-scrollbar bg-gray-50/30`}>
        {title && !isJobPage && (
          <div className="px-5 pt-4 pb-1 shrink-0">
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {showCheckInFAB && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('meup-trigger-checkin'))}
            className="fixed bottom-24 right-5 bg-blue-600 text-white px-6 py-4 rounded-full shadow-[0_10px_30px_rgba(39,110,241,0.4)] flex items-center justify-center gap-3 z-50 active:scale-95 transition-all animate-bounce border-2 border-white"
          >
            <Icons.Check />
            <span className="font-black text-sm uppercase tracking-wider">Fazer Check-in</span>
          </button>
        )}

        {activeJobId && !isJobPage && !showCheckInFAB && (
          <button
            onClick={() => navigate(`/job/${activeJobId}`)}
            className="fixed bottom-20 right-5 bg-black text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform border-2 border-white"
          >
            <div className="relative">
              <Icons.Map />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
            </div>
          </button>
        )}
      </main>

      {showNav && (
        <nav className="bg-white border-t px-4 py-2 flex items-center justify-around z-50 shrink-0 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <NavLink icon={<Icons.Home />} label="Início" active={location.pathname.includes('dashboard') || location.pathname === '/admin' || (location.pathname === '/' && !isJobPage)} onClick={goHome} />
          {user.role === 'empresa' && (
            <NavLink icon={<Icons.Plus />} label="Novo" active={location.pathname === '/empresa/novo-chamado'} onClick={() => navigate('/empresa/novo-chamado')} />
          )}
          <NavLink icon={<Icons.User />} label="Perfil" active={false} onClick={() => alert('Perfil em desenvolvimento')} />
        </nav>
      )}
    </div>
  );
};

const NavLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all active:scale-90 ${active ? 'text-black' : 'text-gray-300'}`}>
    <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</div>
    <span className={`text-[9px] font-bold ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default Layout;
