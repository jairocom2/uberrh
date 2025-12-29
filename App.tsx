
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import EmpresaDashboard from './pages/EmpresaDashboard';
import NewJob from './pages/NewJob';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import JobView from './pages/JobView';
import ProfessionalProfileView from './pages/ProfessionalProfileView';
import CompanyProfileView from './pages/CompanyProfileView';
import AdminDashboard from './pages/AdminDashboard';
import Rating from './pages/Rating';
import { seedDatabase, getDb } from './services/mockDatabase';

const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: string[] }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-10 text-center font-black">Iniciando MeUp...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'empresa') return <Navigate to="/empresa/dashboard" />;
  if (user.role === 'profissional') return <Navigate to="/profissional/dashboard" />;
  return <Navigate to="/login" />;
};

const App: React.FC = () => {
  React.useEffect(() => {
    const db = getDb();
    if (db.profiles.length === 0) {
      seedDatabase();
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route path="/empresa/dashboard" element={<ProtectedRoute roles={['empresa']}><EmpresaDashboard /></ProtectedRoute>} />
          <Route path="/empresa/novo-chamado" element={<ProtectedRoute roles={['empresa']}><NewJob /></ProtectedRoute>} />
          <Route path="/empresa/:id" element={<ProtectedRoute><CompanyProfileView /></ProtectedRoute>} />
          
          <Route path="/profissional/dashboard" element={<ProtectedRoute roles={['profissional']}><ProfessionalDashboard /></ProtectedRoute>} />
          <Route path="/profissional/:id" element={<ProtectedRoute><ProfessionalProfileView /></ProtectedRoute>} />
          
          <Route path="/job/:id" element={<ProtectedRoute><JobView /></ProtectedRoute>} />
          <Route path="/avaliar/:jobId" element={<ProtectedRoute><Rating /></ProtectedRoute>} />
          
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
