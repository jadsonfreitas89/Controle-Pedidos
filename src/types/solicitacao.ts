export interface Solicitacao {
  protocolo: string;
  dataPedido: string;
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
}

export interface Item {
  item: string;
  tipo: 'MATERIAL' | 'FERRAMENTA' | 'EQUIPAMENTO' | 'OUTROS';
  unidade: 'UN' | 'M' | 'KG' | 'L' | 'CX' | 'PC' | 'KIT';
  observacoes?: string;
}

export interface Usuario {
  nome: string;
  email: string;
}

