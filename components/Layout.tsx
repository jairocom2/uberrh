
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
  
  const [syncRoom, setSyncRoom] = useState<string | null>(localStorage.getItem('meup_sync_room'));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'sending' | 'receiving' | 'error'>('idle');

  const refreshActiveJob = () => {
    if (!user) return;
    const db = getDb();
    let jobId: string | null = null;

    if (user.role === 'profissional') {
      const activeAsg = db.job_assignments.find(a => a.professional_id === user.id && a.status !== 'finalizado');
      if (activeAsg) jobId = activeAsg.job_id;
    } else if (user.role === 'empresa') {
      const activeJob = db.job_requests.find(j => j.company_id === user.id && (j.status === 'match_confirmado' || j.status === 'em_andamento'));
      if (activeJob) jobId = activeJob.id;
    }
    setActiveJobId(jobId);
  };

  useEffect(() => {
    refreshActiveJob();
    
    // Escuta eventos de sincronia
    const handleSync = (e: any) => setSyncStatus(e.detail);
    window.addEventListener('meup-sync-status', handleSync);
    window.addEventListener('meup-job-updated', refreshActiveJob);
    
    let stop: (() => void) | undefined;
    if (syncRoom) {
      stop = startCloudSync(syncRoom, () => {
        refreshActiveJob();
        window.dispatchEvent(new CustomEvent('meup-job-updated'));
      });
    }

    return () => {
      window.removeEventListener('meup-sync-status', handleSync);
      window.removeEventListener('meup-job-updated', refreshActiveJob);
      if (stop) stop();
    };
  }, [user, location.pathname, syncRoom]);

  const handleSyncToggle = () => {
    if (syncRoom) {
      if (confirm("Sair da sala de sincronização?")) {
        stopCloudSync();
        setSyncRoom(null);
        window.location.reload();
      }
    } else {
      const room = prompt("DIGITE O NOME DA SALA (ex: BOSS):");
      if (room && room.trim()) {
        const cleanRoom = room.trim().toLowerCase();
        setSyncRoom(cleanRoom);
        localStorage.setItem('meup_sync_room', cleanRoom);
        window.location.reload();
      }
    }
  };

  const goHome = () => {
    if (user?.role === 'empresa') navigate('/empresa/dashboard');
    else if (user?.role === 'profissional') navigate('/profissional/dashboard');
    else if (user?.role === 'admin') navigate('/admin');
    else navigate('/');
  };

  const showNav = user && !['/login', '/onboarding'].includes(location.pathname);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white shadow-xl relative overflow-hidden mx-auto max-w-md border-x">
      {/* Marcador Visual #V4-ULTRA */}
      <div className="absolute top-0 right-0 z-[200] bg-black text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest border-l border-b border-white/20">#V4-ULTRA</div>

      <div className={`text-white text-[8px] py-1 text-center font-black z-50 uppercase tracking-[0.2em] shrink-0 transition-colors flex items-center justify-center gap-2 ${syncRoom ? 'bg-green-600' : 'bg-blue-600'}`}>
        <span>SISTEMA MEUP {syncRoom ? `• SALA ${syncRoom.toUpperCase()}` : '• APENAS LOCAL'}</span>
        
        {/* LED DE STATUS DE SINCRONIA */}
        {syncRoom && (
          <div className={`w-1.5 h-1.5 rounded-full ${
            syncStatus === 'sending' ? 'bg-white animate-pulse' : 
            syncStatus === 'receiving' ? 'bg-yellow-300 animate-bounce' : 
            syncStatus === 'error' ? 'bg-red-500' : 'bg-green-300 opacity-50'
          }`}></div>
        )}
      </div>

      <header className="px-5 py-3 flex items-center justify-between border-b bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-base">M</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter">MeUp</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <button 
              onClick={handleSyncToggle}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${syncRoom ? 'bg-green-600 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}
            >
              <Icons.Map />
              {syncRoom && <span className="text-[10px] font-black uppercase">{syncRoom}</span>}
            </button>
          )}

          {user && (
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-300 ml-1">
              <Icons.LogOut />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar bg-gray-50/20">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {showNav && (
        <nav className="bg-white border-t px-4 py-2 flex items-center justify-around z-50 shrink-0 pb-safe shadow-2xl">
          <NavLink icon={<Icons.Home />} label="Início" active={location.pathname.includes('dashboard') || location.pathname === '/admin'} onClick={goHome} />
          {user.role === 'empresa' && (
            <NavLink icon={<Icons.Plus />} label="Novo" active={location.pathname === '/empresa/novo-chamado'} onClick={() => navigate('/empresa/novo-chamado')} />
          )}
          <NavLink icon={<Icons.User />} label="Perfil" active={false} onClick={() => {}} />
        </nav>
      )}
    </div>
  );
};

const NavLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all active:scale-90 ${active ? 'text-black' : 'text-gray-300'}`}>
    <div className={`${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default Layout;
