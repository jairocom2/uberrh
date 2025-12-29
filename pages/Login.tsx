
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, seedDatabase } from '../services/mockDatabase';
import { Icons } from '../constants';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redireciona automaticamente se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const db = getDb();
    if (db.profiles.length === 0) {
      setIsDbEmpty(true);
    }
  }, []);

  const handleSeed = () => {
    seedDatabase();
    setIsDbEmpty(false);
    alert('Sistema inicializado com dados do Rio de Janeiro!');
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await login(email, pass);
      if (success) {
        navigate('/');
      } else {
        setError('Credenciais inválidas ou conta suspensa. Verifique se o banco foi inicializado.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-y-auto no-scrollbar">
      <div className="max-w-md w-full mx-auto px-8 py-10 flex flex-col min-h-full">
        <div className="w-14 h-14 bg-black rounded-2xl mb-8 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-2xl">M</span>
        </div>
        
        <h1 className="text-3xl font-black mb-1 tracking-tighter">Bem-vindo ao MeUp</h1>
        <p className="text-gray-500 mb-8 text-sm leading-snug">O Uber do RH. Trabalho imediato, profissionais aprovados.</p>

        {isDbEmpty && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl shrink-0">
            <p className="text-xs text-blue-700 font-bold mb-2">O sistema está vazio.</p>
            <button 
              type="button"
              onClick={handleSeed}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-transform"
            >
              Inicializar Demo (Dados RJ)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 shrink-0">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all font-bold text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Senha</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all font-bold text-sm"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-[9px] font-black uppercase bg-red-50 p-3 rounded-xl text-center leading-tight">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-xl font-black text-base hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-black/10"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center shrink-0">
          <p className="text-xs text-gray-400 font-bold">Não tem conta?</p>
          <Link to="/onboarding" className="text-xs font-black text-blue-600 hover:underline">Cadastre-se agora</Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 shrink-0">
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Acessos Rápidos (DEMO)</p>
          <div className="grid grid-cols-1 gap-2">
            <button 
              type="button"
              onClick={() => {setEmail('admin@meup.demo'); setPass('Meup@123456');}} 
              className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-100 p-3 rounded-xl text-left flex justify-between items-center transition-colors group"
            >
              <span className="font-bold">Admin Master</span>
              <span className="text-[9px] text-gray-300 font-black">LOGIN AUTO</span>
            </button>
            <button 
              type="button"
              onClick={() => {setEmail('c1@empresa.com'); setPass('demo');}} 
              className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-100 p-3 rounded-xl text-left flex justify-between items-center transition-colors group"
            >
              <span className="font-bold">Empresa (Padaria)</span>
              <span className="text-[9px] text-gray-300 font-black">demo</span>
            </button>
            <button 
              type="button"
              onClick={() => {setEmail('p1@prof.com'); setPass('demo');}} 
              className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-100 p-3 rounded-xl text-left flex justify-between items-center transition-colors group"
            >
              <span className="font-bold">Profissional Aprovado</span>
              <span className="text-[9px] text-gray-300 font-black">demo</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-10 pb-6">
          <p className="text-center text-[9px] font-bold text-gray-300 px-4 leading-relaxed uppercase tracking-wider">
            A plataforma apenas intermedia. Pagamentos e condições são acordados entre as partes fora do app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
