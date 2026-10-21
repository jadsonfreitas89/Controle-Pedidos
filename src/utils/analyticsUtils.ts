import { Solicitacao } from '../types/solicitacao';

export interface SolicitacaoAnalitica extends Solicitacao {
  dataSolicitacaoObj: Date | null;
  dataEntregaObj: Date | null;
  diasCalculados: number | null;
  isDataValida: boolean;
  tempoTipo: 'ATENDIMENTO' | 'ESPERA' | 'INVALIDO' | 'CANCELADO';
}

export interface IndicadoresAnaliticos {
  totalPedidos: number;
  pedidosEntregues: number;
  pedidosEntreguesPct: number;
  pedidosPendentes: number;
  pedidosPendentesPct: number;
  pedidosCancelados: number;
  pedidosComDataInvalida: number;

  tempoMedioEntregaDias: number;
  tempoMedianoEntregaDias: number;

  maiorEsperaAbertaDias: number;
  maiorEsperaPedido: SolicitacaoAnalitica | null;

  tempoAtualEsperaMedioDias: number;
}

export interface FaixaPrazo {
  id: string;
  label: string;
  descricao: string;
  min: number;
  max: number; // Infinity para última faixa
  quantidade: number;
  percentual: number;
  pedidos: SolicitacaoAnalitica[];
  cor: string;
}

export interface EvolucaoMensal {
  mesAnoKey: string; // YYYY-MM
  mesAnoFormatado: string; // MMM/YYYY
  novosPedidosAbertos: number;
  pedidosConcluidos: number;
  tempoMedioDias: number;
  tempoMedianoDias: number;
}

/**
 * Converte qualquer valor de data (string BR, ISO, Date) de forma segura.
 */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const text = String(value).trim();
  if (!text) return null;

  // DD/MM/YYYY ou DD/MM/YYYY HH:mm ou DD/MM/YYYY HH:mm:ss
  const brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = Number(brMatch[3]);
    const hour = Number(brMatch[4] || 0);
    const minute = Number(brMatch[5] || 0);
    const second = Number(brMatch[6] || 0);
    const d = new Date(year, month, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD
  const isoDateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]) - 1;
    const day = Number(isoDateMatch[3]);
    const hour = Number(isoDateMatch[4] || 0);
    const minute = Number(isoDateMatch[5] || 0);
    const second = Number(isoDateMatch[6] || 0);
    const d = new Date(year, month, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normaliza uma data para 00:00:00 no fuso local.
 */
export function normalizarDataZero(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Calcula dias corridos entre duas datas, considerando dias de calendário (mínimo 0).
 */
export function calcularDiasCorridos(inicio: Date, fim: Date): number {
  const dInicio = normalizarDataZero(inicio);
  const dFim = normalizarDataZero(fim);
  const diffTime = dFim.getTime() - dInicio.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calcula a média aritmética de um array de números.
 */
export function calcularMedia(valores: number[]): number {
  if (!valores.length) return 0;
  const soma = valores.reduce((acc, curr) => acc + curr, 0);
  return soma / valores.length;
}

/**
 * Calcula a mediana estatística de um array de números.
 */
export function calcularMediana(valores: number[]): number {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);

  if (ordenados.length % 2 !== 0) {
    return ordenados[meio];
  } else {
    return (ordenados[meio - 1] + ordenados[meio]) / 2;
  }
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA.
 */
export function formatarDataBr(value: unknown): string {
  const date = parseDate(value);
  if (!date) return '-';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data e hora no padrão brasileiro DD/MM/AAAA HH:mm.
 */
export function formatarDataHoraBr(value: unknown): string {
  const date = parseDate(value);
  if (!date) return '-';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${horas}:${mins}`;
}

/**
 * Processa a lista bruta de solicitações, calculando datas, dias de atendimento ou espera.
 */
export function processarSolicitacoesAnaliticas(
  solicitacoes: Solicitacao[],
  hojeRef: Date = new Date()
): SolicitacaoAnalitica[] {
  return solicitacoes.map((s) => {
    const dataSol = parseDate(s.dataHora || s.dataPedido);
    const dataEnt = parseDate(s.dataEntrega);
    const isCancelada =
      String(s.statusCompra || '').trim().toUpperCase() === 'CANCELADA' ||
      String(s.situacao || '').trim().toUpperCase() === 'CANCELADO';
    const isEntregue =
      String(s.situacao || '').trim().toUpperCase() === 'ENTREGUE' ||
      String(s.statusCompra || '').trim().toUpperCase() === 'ENTREGUE';

    if (isCancelada) {
      return {
        ...s,
        dataSolicitacaoObj: dataSol,
        dataEntregaObj: dataEnt,
        diasCalculados: null,
        isDataValida: !!dataSol,
        tempoTipo: 'CANCELADO',
      };
    }

    if (!dataSol) {
      return {
        ...s,
        dataSolicitacaoObj: null,
        dataEntregaObj: dataEnt,
        diasCalculados: null,
        isDataValida: false,
        tempoTipo: 'INVALIDO',
      };
    }

    if (isEntregue) {
      if (dataEnt) {
        const dias = calcularDiasCorridos(dataSol, dataEnt);
        return {
          ...s,
          dataSolicitacaoObj: dataSol,
          dataEntregaObj: dataEnt,
          diasCalculados: dias,
          isDataValida: true,
          tempoTipo: 'ATENDIMENTO',
        };
      } else {
        // Marcado como entregue, mas sem data de entrega registrada
        return {
          ...s,
          dataSolicitacaoObj: dataSol,
          dataEntregaObj: null,
          diasCalculados: null,
          isDataValida: false,
          tempoTipo: 'INVALIDO',
        };
      }
    } else {
      // Pedido pendente: calcular dias de espera até hoje
      const diasEspera = calcularDiasCorridos(dataSol, hojeRef);
      return {
        ...s,
        dataSolicitacaoObj: dataSol,
        dataEntregaObj: null,
        diasCalculados: diasEspera,
        isDataValida: true,
        tempoTipo: 'ESPERA',
      };
    }
  });
}

/**
 * Calcula os indicadores gerenciais (KPIs).
 */
export function calcularIndicadores(dados: SolicitacaoAnalitica[]): IndicadoresAnaliticos {
  const totalPedidos = dados.length;

  const cancelados = dados.filter((d) => d.tempoTipo === 'CANCELADO');
  const invalidos = dados.filter((d) => d.tempoTipo === 'INVALIDO' || !d.isDataValida);

  const entreguesValidos = dados.filter(
    (d) => d.tempoTipo === 'ATENDIMENTO' && d.diasCalculados !== null
  );
  const pendentesValidos = dados.filter(
    (d) => d.tempoTipo === 'ESPERA' && d.diasCalculados !== null
  );

  // Considera no total de entregues todos com situacao ENTREGUE
  const totalEntregues = dados.filter(
    (d) =>
      String(d.situacao || '').trim().toUpperCase() === 'ENTREGUE' ||
      String(d.statusCompra || '').trim().toUpperCase() === 'ENTREGUE'
  ).length;

  const totalPendentes = dados.filter(
    (d) =>
      String(d.situacao || '').trim().toUpperCase() !== 'ENTREGUE' &&
      String(d.statusCompra || '').trim().toUpperCase() !== 'CANCELADA' &&
      String(d.situacao || '').trim().toUpperCase() !== 'CANCELADO'
  ).length;

  const pedidosEntreguesPct = totalPedidos > 0 ? (totalEntregues / totalPedidos) * 100 : 0;
  const pedidosPendentesPct = totalPedidos > 0 ? (totalPendentes / totalPedidos) * 100 : 0;

  // Tempos dos entregues
  const diasEntregues = entreguesValidos.map((d) => d.diasCalculados as number);
  const tempoMedioEntregaDias = calcularMedia(diasEntregues);
  const tempoMedianoEntregaDias = calcularMediana(diasEntregues);

  // Pendentes: maior espera e tempo médio atual de espera
  let maiorEsperaAbertaDias = 0;
  let maiorEsperaPedido: SolicitacaoAnalitica | null = null;

  if (pendentesValidos.length > 0) {
    const sorted = [...pendentesValidos].sort(
      (a, b) => (b.diasCalculados ?? 0) - (a.diasCalculados ?? 0)
    );
    maiorEsperaPedido = sorted[0];
    maiorEsperaAbertaDias = sorted[0].diasCalculados ?? 0;
  }

  const diasPendentes = pendentesValidos.map((d) => d.diasCalculados as number);
  const tempoAtualEsperaMedioDias = calcularMedia(diasPendentes);

  return {
    totalPedidos,
    pedidosEntregues: totalEntregues,
    pedidosEntreguesPct,
    pedidosPendentes: totalPendentes,
    pedidosPendentesPct,
    pedidosCancelados: cancelados.length,
    pedidosComDataInvalida: invalidos.length,
    tempoMedioEntregaDias,
    tempoMedianoEntregaDias,
    maiorEsperaAbertaDias,
    maiorEsperaPedido,
    tempoAtualEsperaMedioDias,
  };
}

/**
 * Agrupa os pedidos entregues nas 5 faixas exclusivas especificadas no prompt.
 */
export function calcularFaixasPrazo(entreguesValidos: SolicitacaoAnalitica[]): FaixaPrazo[] {
  const faixasDef: Omit<FaixaPrazo, 'quantidade' | 'percentual' | 'pedidos'>[] = [
    {
      id: 'ate-7',
      label: 'Até 7 dias',
      descricao: 'Entregas em até 1 semana',
      min: 0,
      max: 7,
      cor: 'bg-emerald-500',
    },
    {
      id: '8-15',
      label: '8 a 15 dias',
      descricao: 'Entregas entre 1 e 2 semanas',
      min: 8,
      max: 15,
      cor: 'bg-blue-500',
    },
    {
      id: '16-30',
      label: '16 a 30 dias',
      descricao: 'Entregas entre 2 semanas e 1 mês',
      min: 16,
      max: 30,
      cor: 'bg-amber-500',
    },
    {
      id: '31-60',
      label: '31 a 60 dias',
      descricao: 'Entregas entre 1 e 2 meses',
      min: 31,
      max: 60,
      cor: 'bg-orange-500',
    },
    {
      id: 'mais-60',
      label: 'Mais de 60 dias',
      descricao: 'Entregas acima de 2 meses',
      min: 61,
      max: Infinity,
      cor: 'bg-rose-500',
    },
  ];

  const total = entreguesValidos.length;

  return faixasDef.map((f) => {
    const pedidos = entreguesValidos.filter((p) => {
      const dias = p.diasCalculados ?? 0;
      return dias >= f.min && dias <= f.max;
    });

    const quantidade = pedidos.length;
    const percentual = total > 0 ? (quantidade / total) * 100 : 0;

    return {
      ...f,
      quantidade,
      percentual,
      pedidos,
    };
  });
}

/**
 * Calcula a evolução mensal (agrupamento mês a mês) dos prazos e volumes.
 */
export function calcularEvolucaoMensal(dados: SolicitacaoAnalitica[]): EvolucaoMensal[] {
  const mapaMeses: Record<
    string,
    {
      abertos: number;
      concluidos: number;
      diasConcluidos: number[];
      dataReferencia: Date;
    }
  > = {};

  const mesesAbreviados = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  dados.forEach((s) => {
    // Pedidos abertos no mês da solicitação
    if (s.dataSolicitacaoObj) {
      const y = s.dataSolicitacaoObj.getFullYear();
      const m = String(s.dataSolicitacaoObj.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;

      if (!mapaMeses[key]) {
        mapaMeses[key] = {
          abertos: 0,
          concluidos: 0,
          diasConcluidos: [],
          dataReferencia: new Date(y, s.dataSolicitacaoObj.getMonth(), 1),
        };
      }
      mapaMeses[key].abertos += 1;
    }

    // Pedidos concluídos no mês da entrega
    if (s.tempoTipo === 'ATENDIMENTO' && s.dataEntregaObj && s.diasCalculados !== null) {
      const y = s.dataEntregaObj.getFullYear();
      const m = String(s.dataEntregaObj.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;

      if (!mapaMeses[key]) {
        mapaMeses[key] = {
          abertos: 0,
          concluidos: 0,
          diasConcluidos: [],
          dataReferencia: new Date(y, s.dataEntregaObj.getMonth(), 1),
        };
      }
      mapaMeses[key].concluidos += 1;
      mapaMeses[key].diasConcluidos.push(s.diasCalculados);
    }
  });

  const chavesOrdenadas = Object.keys(mapaMeses).sort();

  return chavesOrdenadas.map((key) => {
    const item = mapaMeses[key];
    const [y, mStr] = key.split('-');
    const mesIndex = Number(mStr) - 1;
    const mesNome = mesesAbreviados[mesIndex] || mStr;

    return {
      mesAnoKey: key,
      mesAnoFormatado: `${mesNome}/${y}`,
      novosPedidosAbertos: item.abertos,
      pedidosConcluidos: item.concluidos,
      tempoMedioDias: calcularMedia(item.diasConcluidos),
      tempoMedianoDias: calcularMediana(item.diasConcluidos),
    };
  });
}
