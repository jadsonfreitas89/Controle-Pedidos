import { Solicitacao } from '../types/solicitacao';

const BASE_URL = '/api';

async function request(action: string, data: any = {}) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data })
  });
  return response.json();
}

export const api = {
  listarSolicitacoes: () => request('listarSolicitacoes'),
  buscarSolicitacao: (protocolo: string) => request('buscarSolicitacao', { protocolo }),
  criarSolicitacao: (dados: Omit<Solicitacao, 'protocolo' | 'dataPedido' | 'ultimaAtualizacao' | 'diasDecorridos'>) => request('criarSolicitacao', dados),
  atualizarSolicitacao: (protocolo: string, dados: Partial<Solicitacao>) => request('atualizarSolicitacao', { protocolo, ...dados }),
  excluirSolicitacao: (protocolo: string) => request('excluirSolicitacao', { protocolo }),
  marcarComoEntregue: (protocolo: string) => request('marcarComoEntregue', { protocolo }),
  marcarWhatsAppEnviado: (protocolo: string, enviado: 'SIM' | 'NÃO') => request('marcarWhatsAppEnviado', { protocolo, enviado }),
  listarItens: () => request('listarItens'),
  cadastrarItem: (dados: { item: string; tipo: string; unidade: string; observacoes?: string }) => request('cadastrarItem', dados),
  listarUsuarios: () => request('listarUsuarios'),
  cadastrarUsuario: (dados: { nome: string; email: string }) => request('cadastrarUsuario', dados),
  gerarListaWhatsApp: () => request('gerarListaWhatsApp')
};
