/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Solicitacoes from './pages/Solicitacoes';
import NovaSolicitacao from './pages/NovaSolicitacao';
import Itens from './pages/Itens';
import Usuarios from './pages/Usuarios';
import WhatsApp from './pages/WhatsApp';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
          <Route path="/nova" element={<NovaSolicitacao />} />
          <Route path="/itens" element={<Itens />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
