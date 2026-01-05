
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startCloudSync, stopCloudSync } from '../services/mockDatabase';
import { Icons } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, noPadding = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [syncRoom, setSyncRoom] = useState<string | null>(localStorage.getItem('meup_sync_room'));
  const [netLogs, setNetLogs] = useState({ up: '---', down: '---' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam !== syncRoom) {
      localStorage.setItem('meup_sync_room', roomParam.toLowerCase());
      setSyncRoom(roomParam.toLowerCase());
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
  }, [location.search, syncRoom]);

  useEffect(() => {
    const handleLog = (e: any) => {
      const { type, status } = e.detail;
      setNetLogs(prev => ({ ...prev, [type.toLowerCase()]: status }));
    };
    window.addEventListener('meup-net-log', handleLog);
    
    let stop: (() => void) | undefined;
    if (syncRoom) {
      stop = startCloudSync(syncRoom, () => {
        window.dispatchEvent(new CustomEvent('meup-job-updated'));
      });
    }

    return () => {
      window.removeEventListener('meup-net-log', handleLog);
      if (stop) stop();
    };
  }, [user, syncRoom]);

  const handleSyncToggle = () => {
    const room = prompt("SALA DE SINCRONIA (EX: MEUP1):");
    if (room && room.trim()) {
      const cleanRoom = room.trim().toLowerCase();
      setSyncRoom(cleanRoom);
      localStorage.setItem('meup_sync_room', cleanRoom);
      window.location.reload();
    }
  };

  const showNav = user && !['/login', '/onboarding'].includes(location.pathname);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white shadow-xl relative overflow-hidden mx-auto max-w-md border-x font-sans">
      {/* Status Bar Estilo Mobile */}
      <div className={`flex items-center justify-between px-6 py-1 z-[100] transition-colors ${syncRoom ? 'bg-black text-green-400' : 'bg-gray-100 text-gray-400'}`}>
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${syncRoom ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
           <span className="text-[9px] font-black uppercase tracking-widest">
             {syncRoom ? `SALA: ${syncRoom.toUpperCase()}` : 'OFFLINE MODE'}
           </span>
        </div>
        <div className="flex gap-3 text-[8px] font-bold">
          <span>UP: {netLogs.up}</span>
          <span>DOWN: {netLogs.down}</span>
        </div>
      </div>

      <header className="px-6 py-4 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            <span className="text-white font-black text-xl">M</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">MeUp</h1>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] mt-1">Uber do RH</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncToggle}
            className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shadow-sm ${syncRoom ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
          >
            <Icons.Map />
          </button>
          {user && (
            <button onClick={logout} className="w-12 h-12 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center border border-gray-100">
              <Icons.LogOut />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar bg-white">
        {children}
      </main>

      {showNav && (
        <nav className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-around z-50 shrink-0 pb-safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <NavLink icon={<Icons.Home />} label="Início" active={location.pathname.includes('dashboard')} onClick={() => navigate('/')} />
          {user.role === 'empresa' && (
            <NavLink icon={<Icons.Plus />} label="Novo" active={location.pathname.includes('novo')} onClick={() => navigate('/empresa/novo-chamado')} />
          )}
          <NavLink icon={<Icons.Chat />} label="Chats" active={false} onClick={() => {}} />
          <NavLink icon={<Icons.User />} label="Perfil" active={false} onClick={() => {}} />
        </nav>
      )}
    </div>
  );
};

const NavLink = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${active ? 'text-black' : 'text-gray-300'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className={`text-[10px] font-black uppercase tracking-tight ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default Layout;
