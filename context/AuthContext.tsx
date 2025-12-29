
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '../types';
import { getDb } from '../services/mockDatabase';

interface AuthContextType {
  user: Profile | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('meup_auth');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('meup_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Forçar leitura atualizada do banco simulado
    const db = getDb();
    
    // 1. Lógica especial para Admin Master
    if (email === 'admin@meup.demo' && pass === 'Meup@123456') {
      const admin = db.profiles.find(p => p.email === email);
      if (admin) {
        setUser(admin);
        localStorage.setItem('meup_auth', JSON.stringify(admin));
        return true;
      }
    }

    // 2. Lógica para usuários de demonstração (senha padrão: demo)
    const found = db.profiles.find(p => p.email === email);
    if (found && !found.is_suspended) {
      // Para o MVP Demo, aceitamos 'demo' para todos os perfis gerados pelo seed
      if (pass === 'demo' || (found.role === 'admin' && pass === 'Meup@123456')) {
        setUser(found);
        localStorage.setItem('meup_auth', JSON.stringify(found));
        return true;
      }
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('meup_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
