export type StatusCompra = 
  | 'AGUARDANDO COMPRA' 
  | 'COMPRA REALIZADA' 
  | 'AGUARDANDO ENTREGA' 
  | 'ENTREGUE' 
  | 'CANCELADA';

export type PerfilUsuario = 'ADM' | 'USUARIO';

export interface Solicitacao {
  protocolo: string;
  dataPedido: string;
  dataHora?: string;
  solicitante: string;
  email: string;
  material: string;
  quantidade: number;
  onde: string;
  paraQue: string;
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  precisaLiberacaoShe: 'SIM' | 'NÃO';
  observacoes: string;
  ultimaAtualizacao: string;
  dataEntrega: string | null;
  diasDecorridos: number;
  situacao: 'PENDENTE' | 'ENTREGUE';
  whatsappEnviado: 'SIM' | 'NÃO' | string;

  // Controle de Compra
  responsavelCompra?: string;
  dataCompra?: string;
  previsaoChegada?: string;
  statusCompra?: StatusCompra;
}

export interface Item {
  item: string;
  tipo: 'MATERIAL' | 'FERRAMENTA' | 'EQUIPAMENTO' | 'OUTROS';
  unidade: 'UN' | 'M' | 'KG' | 'L' | 'CX' | 'PC' | 'KIT';
  observacoes?: string;
}

export interface Usuario {
  idUsuario?: string;
  usuario: string; // Login
  nome: string;
  email?: string;
  senha?: string;
  senhaHash?: string;
  perfil: PerfilUsuario;
  ativo: 'SIM' | 'NÃO' | boolean;
  primeiroAcesso?: 'SIM' | 'NÃO';
  dataCriacao?: string;
  dataAtualizacao?: string;
  token?: string;
}

