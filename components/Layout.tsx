
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, startCloudSync, stopCloudSync } from '../services/mockDatabase';
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

  // Captura sala via URL se disponível (?room=NOME)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam !== syncRoom) {
      localStorage.setItem('meup_sync_room', roomParam.toLowerCase());
      setSyncRoom(roomParam.toLowerCase());
      window.location.reload();
    }
  }, [location.search]);

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
    if (syncRoom) {
      if (confirm("Desconectar desta sala?")) {
        stopCloudSync();
        setSyncRoom(null);
        window.location.reload();
      }
    } else {
      const room = prompt("CRIE OU ENTRE NUMA SALA (Ex: TESTE):");
      if (room && room.trim()) {
        const cleanRoom = room.trim().toLowerCase();
        setSyncRoom(cleanRoom);
        localStorage.setItem('meup_sync_room', cleanRoom);
        window.location.reload();
      }
    }
  };

  const showNav = user && !['/login', '/onboarding'].includes(location.pathname);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white shadow-xl relative overflow-hidden mx-auto max-w-md border-x">
      {/* Marcador de Versão V5 */}
      <div className="absolute top-0 right-0 z-[200] bg-black text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">#V5-PRO</div>

      {/* Header Sync */}
      <div className={`text-white text-[8px] py-1 text-center font-black z-50 uppercase tracking-[0.2em] shrink-0 transition-colors ${syncRoom ? 'bg-green-600' : 'bg-blue-600'}`}>
        {syncRoom ? `SALA ATIVA: ${syncRoom.toUpperCase()}` : 'MODO LOCAL - CLIQUE NO MAPA PARA SINCRONIZAR'}
      </div>

      <header className="px-5 py-3 flex items-center justify-between border-b bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-base">M</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter">MeUp</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSyncToggle}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${syncRoom ? 'bg-green-600 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}
          >
            <Icons.Map />
            {syncRoom && <span className="text-[10px] font-black uppercase">{syncRoom}</span>}
          </button>
          {user && (
            <button onClick={logout} className="p-2 text-gray-300 ml-1"><Icons.LogOut /></button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar bg-gray-50/20">
        {children}
      </main>

      {/* DIAGNÓSTICO DE REDE V5 NO RODAPÉ */}
      <div className="bg-black text-[7px] text-gray-500 py-1 px-4 flex justify-between font-black uppercase tracking-widest z-[100]">
        <div className="flex gap-3">
          <span>UP: <span className={netLogs.up === 'OK' ? 'text-green-500' : 'text-red-500'}>{netLogs.up}</span></span>
          <span>DOWN: <span className={netLogs.down === 'OK' || netLogs.down === 'SYNC' ? 'text-green-500' : 'text-red-500'}>{netLogs.down}</span></span>
        </div>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>

      {showNav && (
        <nav className="bg-white border-t px-4 py-2 flex items-center justify-around z-50 shrink-0 pb-safe shadow-2xl">
          <NavLink icon={<Icons.Home />} label="Início" active={true} onClick={() => navigate('/')} />
          {user.role === 'empresa' && (
            <NavLink icon={<Icons.Plus />} label="Novo" active={false} onClick={() => navigate('/empresa/novo-chamado')} />
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
