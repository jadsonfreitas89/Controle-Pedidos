import { Solicitacao, Usuario, StatusCompra } from '../types/solicitacao';

const BASE_URL = '/api';

async function request(action: string, data: any = {}) {
  // Pass active user context from localStorage if available
  let userSession: (Partial<Usuario> & { token?: string }) | null = null;
  try {
    const stored = localStorage.getItem('usuario_logado');
    if (stored) {
      userSession = JSON.parse(stored);
    }
  } catch (e) {
    // Ignore error
  }

  const token = userSession?.token || localStorage.getItem('auth_token') || '';

  const payloadData = {
    ...data,
    token,
    usuarioLogado: userSession?.usuario || userSession?.nome || 'SISTEMA',
    perfilLogado: userSession?.perfil || 'USUARIO'
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data: payloadData })
  });
  const json = await response.json();
  
  return {
    success: json.success ?? json.sucesso ?? false,
    data: json.data ?? json.dados ?? undefined,
    message: json.message ?? json.mensagem ?? undefined,
    error: json.error ?? json.erro ?? undefined,
    ...json
  };
}

export const api = {
  // Autenticação & Usuários
  corrigirEstruturaUsuarios: () => request('corrigirEstruturaUsuarios'),
  verificarPrimeiroAcesso: () => request('verificarPrimeiroAcesso'),
  criarPrimeiroAdministrador: (dados: { nome: string; email: string; usuario: string; senha: string; confirmarSenha?: string }) => request('criarPrimeiroAdministrador', dados),
  login: (usuario: string, senha?: string) => request('login', { usuario, senha }),
  definirSenhaPrimeiroAcesso: (dados: { usuario: string; senha?: string; novaSenha?: string }) => request('definirSenhaPrimeiroAcesso', dados),
  logout: () => request('logout'),
  listarUsuarios: () => request('listarUsuarios'),
  cadastrarUsuario: (dados: { usuario: string; nome: string; email?: string; senha?: string; perfil: 'ADM' | 'USUARIO'; ativo?: 'SIM' | 'NÃO' }) => request('cadastrarUsuario', dados),
  atualizarUsuario: (usuario: string, dados: Partial<Usuario>) => request('atualizarUsuario', { usuarioTarget: usuario, ...dados }),
  alterarStatusUsuario: (usuario: string, ativo: 'SIM' | 'NÃO') => request('alterarStatusUsuario', { usuarioTarget: usuario, ativo }),
  excluirUsuario: (idUsuario: string) => request('excluirUsuario', { idUsuario, usuarioTarget: idUsuario }),

  // Solicitações
  listarSolicitacoes: () => request('listarSolicitacoes'),
  buscarSolicitacao: (protocolo: string) => request('buscarSolicitacao', { protocolo }),
  criarSolicitacao: (dados: Partial<Solicitacao>) => request('criarSolicitacao', dados),
  atualizarSolicitacao: (protocolo: string, dados: Partial<Solicitacao>) => request('atualizarSolicitacao', { protocolo, ...dados }),
  atualizarControleCompra: (protocolo: string, dados: { responsavelCompra?: string; dataCompra?: string; previsaoChegada?: string; statusCompra?: StatusCompra }) => 
    request('atualizarControleCompra', { protocolo, ...dados }),
  excluirSolicitacao: (protocolo: string) => request('excluirSolicitacao', { protocolo }),
  marcarComoEntregue: (protocolo: string) => request('marcarComoEntregue', { protocolo }),
  marcarWhatsAppEnviado: (protocolo: string, enviado: 'SIM' | 'NÃO') => request('marcarWhatsAppEnviado', { protocolo, enviado }),

  // Itens & WhatsApp
  listarItens: () => request('listarItens'),
  cadastrarItem: (dados: { item: string; tipo: string; unidade: string; observacoes?: string }) => request('cadastrarItem', dados),
  gerarListaWhatsApp: () => request('gerarListaWhatsApp')
};
