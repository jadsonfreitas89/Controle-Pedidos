/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Solicitacoes from './pages/Solicitacoes';
import NovaSolicitacao from './pages/NovaSolicitacao';
import Itens from './pages/Itens';
import Usuarios from './pages/Usuarios';
import WhatsApp from './pages/WhatsApp';
import Login from './pages/Login';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import RecuperarSenha from './pages/RecuperarSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import PainelAnalitico from './pages/PainelAnalitico';

function AppContent() {
  const { currentUser, isAdmin, isFirstAccess, setIsFirstAccess } = useAuth();
  const location = useLocation();

  // Rotas de recuperação e redefinição de senha sempre disponíveis e preservando query parameters
  if (location.pathname.startsWith('/redefinir-senha')) {
    return <RedefinirSenha />;
  }

  if (location.pathname.startsWith('/recuperar-senha')) {
    return <RecuperarSenha />;
  }

  if (isFirstAccess) {
    return <PrimeiroAcesso onSuccess={() => setIsFirstAccess(false)} />;
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analitico" element={<PainelAnalitico />} />
        <Route path="/solicitacoes" element={<Solicitacoes />} />
        <Route path="/nova" element={<NovaSolicitacao />} />
        <Route path="/itens" element={<Itens />} />
        <Route 
          path="/usuarios" 
          element={isAdmin ? <Usuarios /> : <Navigate to="/" replace />} 
        />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

