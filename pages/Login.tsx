
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
    if (confirm("ATENÇÃO: Isso limpará o cache de todos os testes anteriores e ativará a Versão V3 de Sincronia. Deseja continuar?")) {
      clearAndRestart();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, pass);
    if (success) navigate('/');
    else setError('Credenciais inválidas. Clique no botão LARANJA acima se a sincronia falhar.');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-y-auto no-scrollbar">
      <div className="max-w-md w-full mx-auto px-8 py-10 flex flex-col min-h-full">
        <div className="flex justify-between items-start mb-8">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-2xl tracking-tighter">M</span>
          </div>
          
          {/* BOTÃO DE EMERGÊNCIA LARANJA - CURA TUDO */}
          <button 
            onClick={handleForceRestart}
            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-500/30"
          >
            Reset Total (V3)
          </button>
        </div>
        
        <h1 className="text-4xl font-black mb-1 tracking-tighter">MeUp</h1>
        <div className="flex items-center gap-2 mb-10">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronia Ativa</p>
          <span className="bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded-full font-black">#V3-FIX</span>
        </div>

        {isDbEmpty && (
          <div className="mb-8 p-6 bg-orange-500 rounded-[2rem] shadow-xl shadow-orange-500/20">
            <p className="text-xs text-white font-black mb-4 uppercase tracking-widest">Banco V3 Necessário</p>
            <button 
              type="button"
              onClick={() => { seedDatabase(); setIsDbEmpty(false); }}
              className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all uppercase"
            >
              Ativar Base V3
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
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Contas para teste em 2 aparelhos</p>
          <div className="grid grid-cols-1 gap-3">
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
    <span className="text-[9px] font-black">ENTRAR</span>
  </button>
);

export default Login;
