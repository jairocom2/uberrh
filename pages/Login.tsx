
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, seedDatabase, clearAndRestart } from '../services/mockDatabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
    const db = getDb();
    if (db.profiles.length === 0) setIsDbEmpty(true);
  }, [user, navigate]);

  const handleForceRestart = () => {
    if (confirm("Isso irá apagar todos os dados locais e restaurar os usuários padrão (v11). Continuar?")) {
      clearAndRestart();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, pass);
    if (success) navigate('/');
    else setError('Credenciais inválidas. Clique em "RESET V11" caso o erro persista.');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-y-auto no-scrollbar">
      <div className="max-w-md w-full mx-auto px-8 py-10 flex flex-col min-h-full">
        <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-2xl tracking-tighter">M</span>
          </div>
          <button 
            onClick={handleForceRestart}
            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 active:scale-95 transition-all"
          >
            Reset v11.0
          </button>
        </div>
        
        <h1 className="text-4xl font-black mb-1 tracking-tighter">MeUp</h1>
        <p className="text-gray-400 mb-10 text-sm font-bold uppercase tracking-widest">O Uber do RH • v11.0</p>

        {isDbEmpty && (
          <div className="mb-8 p-6 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20">
            <p className="text-xs text-blue-100 font-black mb-4 uppercase tracking-widest">Atenção: Banco v11 Vazio</p>
            <button 
              type="button"
              onClick={() => { seedDatabase(); setIsDbEmpty(false); }}
              className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all uppercase"
            >
              Inicializar Demo v11
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold text-sm"
              placeholder="ex: admin@meup.demo" required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Senha</label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold text-sm"
              placeholder="demo" required
            />
          </div>
          
          {error && <p className="text-red-500 text-[10px] font-black uppercase bg-red-50 p-4 rounded-2xl text-center leading-tight border border-red-100">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-black text-white py-5 rounded-2xl font-black text-base active:scale-95 transition-all shadow-2xl"
          >
            Entrar
          </button>
        </form>

        <div className="mt-12 pt-10 border-t border-gray-100">
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Acessos Rápidos (DEMO v11)</p>
          <div className="grid grid-cols-1 gap-3">
            <QuickLoginBtn color="bg-red-50 text-red-600 border-red-100" label="Admin (admin@meup.demo)" onClick={() => {setEmail('admin@meup.demo'); setPass('Meup@123456');}} />
            <QuickLoginBtn color="bg-blue-50 text-blue-600 border-blue-100" label="Empresa (c1@empresa.com)" onClick={() => {setEmail('c1@empresa.com'); setPass('demo');}} />
            <QuickLoginBtn color="bg-green-50 text-green-600 border-green-100" label="Profissional (p1@prof.com)" onClick={() => {setEmail('p1@prof.com'); setPass('demo');}} />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickLoginBtn = ({ label, onClick, color }: any) => (
  <button 
    type="button" onClick={onClick} 
    className={`text-[11px] p-4 rounded-2xl text-left flex justify-between items-center transition-all border active:scale-95 ${color || 'bg-gray-50 text-gray-700 border-gray-50'}`}
  >
    <span className="font-black uppercase tracking-tighter">{label}</span>
    <span className="text-[9px] font-black">CARREGAR</span>
  </button>
);

export default Login;
