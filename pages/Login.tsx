
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
    if (confirm("UPGRADE V9: Isso ativará o protocolo Smart Sync (PUT/POST). Deseja limpar os dados e atualizar?")) {
      clearAndRestart();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, pass);
    if (success) navigate('/');
    else setError('Erro de login. Tente o RESET V9 abaixo.');
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
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-indigo-700"
          >
            Reset Sistema (V9)
          </button>
        </div>
        
        <h1 className="text-4xl font-black mb-1 tracking-tighter text-gray-900">MeUp</h1>
        <div className="flex items-center gap-2 mb-10">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Protocolo Ultra</p>
          <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">V9 SMART</span>
        </div>

        {isDbEmpty && (
          <div className="mb-8 p-6 bg-black rounded-[2rem] shadow-xl text-center animate-in zoom-in duration-300">
            <button 
              type="button"
              onClick={() => { seedDatabase(); setIsDbEmpty(false); }}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase hover:bg-gray-100 transition-colors"
            >
              Ativar Base V9
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputGroup label="E-mail" value={email} onChange={setEmail} type="email" placeholder="c1@empresa.com" />
          <InputGroup label="Senha" value={pass} onChange={setPass} type="password" placeholder="demo" />
          
          {error && <p className="text-red-500 text-[10px] font-black uppercase bg-red-50 p-4 rounded-2xl text-center border border-red-100">{error}</p>}
          
          <button type="submit" className="w-full bg-black text-white h-16 rounded-3xl font-black text-base shadow-2xl active:scale-95 transition-all">
            Entrar
          </button>
        </form>

        <div className="mt-12 pt-10 border-t border-gray-100 space-y-4">
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">Dica de Sincronia</p>
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner">
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed text-center">
              Para sincronizar em tempo real, defina o mesmo nome de sala nos dois dispositivos (Ex: <span className="text-black">LOJA01</span>).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <QuickLoginBtn color="bg-blue-50 text-blue-600 border-blue-100" label="Empresa (c1@empresa.com)" onClick={() => {setEmail('c1@empresa.com'); setPass('demo');}} />
            <QuickLoginBtn color="bg-green-50 text-green-600 border-green-100" label="Profissional (p1@prof.com)" onClick={() => {setEmail('p1@prof.com'); setPass('demo');}} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-gray-100 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-black transition-all"
      placeholder={placeholder} required
    />
  </div>
);

const QuickLoginBtn = ({ label, onClick, color }: any) => (
  <button 
    type="button" onClick={onClick} 
    className={`text-[11px] p-5 rounded-2xl text-left flex justify-between items-center transition-all border active:scale-95 ${color}`}
  >
    <span className="font-black uppercase tracking-tighter">{label}</span>
    <span className="text-[9px] font-black border-l pl-3 border-current/20">LOGIN</span>
  </button>
);

export default Login;
