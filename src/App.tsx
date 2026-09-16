/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  const { currentUser, isAdmin, isFirstAccess, setIsFirstAccess } = useAuth();

  if (isFirstAccess) {
    return <PrimeiroAcesso onSuccess={() => setIsFirstAccess(false)} />;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

