import { Solicitacao } from '../types/solicitacao';

// MOCK DATA - To be replaced by backend integration
export const mockSolicitacoes: Solicitacao[] = [
  {
    protocolo: 'SOL-2026-0001',
    dataPedido: '2026-09-01T10:00:00',
    solicitante: 'João Silva',
    email: 'joao.silva@empresa.com',
    material: 'Furadeira Impacto',
    quantidade: 1,
    onde: 'Manutenção',
    paraQue: 'Reparo de infraestrutura',
    prioridade: 'ALTA',
    precisaLiberacaoShe: 'NÃO',
    observacoes: 'Urgente para a obra A',
    ultimaAtualizacao: '2026-09-01T10:00:00',
    dataEntrega: null,
    diasDecorridos: 0,
    situacao: 'PENDENTE',
    whatsappEnviado: 'NÃO'
  },
  {
    protocolo: 'SOL-2026-0002',
    dataPedido: '2026-08-30T14:30:00',
    solicitante: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    material: 'Cabo 2.5mm',
    quantidade: 100,
    onde: 'Obra B',
    paraQue: 'Instalação elétrica',
    prioridade: 'NORMAL',
    precisaLiberacaoShe: 'SIM',
    observacoes: '',
    ultimaAtualizacao: '2026-09-01T09:00:00',
    dataEntrega: '2026-09-01T09:00:00',
    diasDecorridos: 2,
    situacao: 'ENTREGUE',
    whatsappEnviado: 'NÃO'
  }
];
