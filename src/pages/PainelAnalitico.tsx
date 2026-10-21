import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Solicitacao } from '../types/solicitacao';
import {
  SolicitacaoAnalitica,
  processarSolicitacoesAnaliticas,
  calcularIndicadores,
  calcularFaixasPrazo,
  calcularEvolucaoMensal,
  formatarDataBr,
  formatarDataHoraBr,
  parseDate,
} from '../utils/analyticsUtils';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ShoppingBag,
  User,
  Timer,
  TrendingUp,
  AlertTriangle,
  Layers,
  Inbox,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function PainelAnalitico() {
  const { currentUser } = useAuth();
  const [dadosBrutos, setDadosBrutos] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  // Filtros Globais
  const [dataInicioFiltro, setDataInicioFiltro] = useState<string>('');
  const [dataFimFiltro, setDataFimFiltro] = useState<string>('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<'TODOS' | 'ENTREGUE' | 'PENDENTE' | 'CANCELADO'>('TODOS');
  const [solicitanteFiltro, setSolicitanteFiltro] = useState<string>('');
  const [buscaMaterial, setBuscaMaterial] = useState<string>('');

  // Estados dos Gráficos & Interatividade
  const [ordemGrafico1, setOrdemGrafico1] = useState<'MAIOR_DIAS' | 'MENOR_DIAS' | 'RECENTE'>('MAIOR_DIAS');
  const [paginaGrafico1, setPaginaGrafico1] = useState<number>(1);
  const ITENS_POR_PAGINA_G1 = 8;

  const [faixaSelecionadaId, setFaixaSelecionadaId] = useState<string | null>(null);

  // Paginação e Ordenação da Tabela Geral
  const [termoBuscaTabela, setTermoBuscaTabela] = useState<string>('');
  const [colunaOrdenacao, setColunaOrdenacao] = useState<'protocolo' | 'solicitante' | 'material' | 'dataPedido' | 'dias' | 'situacao'>('dataPedido');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc');
  const [paginaTabela, setPaginaTabela] = useState<number>(1);
  const ITENS_POR_PAGINA_TABELA = 12;

  // Modal de Detalhes
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoAnalitica | null>(null);

  // Modal de Relatório Gerencial de Impressão
  const [exibirRelatorioImpressao, setExibirRelatorioImpressao] = useState<boolean>(false);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listarSolicitacoes();
      if (res.success && Array.isArray(res.data)) {
        setDadosBrutos(res.data);
        setUltimaAtualizacao(new Date());
      } else {
        setError(res.error || 'Não foi possível carregar os registros reais da planilha.');
      }
    } catch (err: any) {
      setError('Erro de conexão ao consultar dados: ' + (err.message || 'Servidor indisponível.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Lista única de solicitantes dos dados reais para o dropdown de filtro
  const listaSolicitantes = useMemo(() => {
    const setSol = new Set<string>();
    dadosBrutos.forEach((s) => {
      if (s.solicitante && s.solicitante.trim()) {
        setSol.add(s.solicitante.trim());
      }
    });
    return Array.from(setSol).sort((a, b) => a.localeCompare(b));
  }, [dadosBrutos]);

  // Processamento e aplicação dos filtros
  const dadosFiltrados = useMemo(() => {
    const processados = processarSolicitacoesAnaliticas(dadosBrutos);

    return processados.filter((item) => {
      // Filtro de Data Inicial
      if (dataInicioFiltro) {
        const dIni = parseDate(dataInicioFiltro);
        if (dIni && item.dataSolicitacaoObj) {
          const itemDate = new Date(
            item.dataSolicitacaoObj.getFullYear(),
            item.dataSolicitacaoObj.getMonth(),
            item.dataSolicitacaoObj.getDate()
          );
          if (itemDate < dIni) return false;
        }
      }

      // Filtro de Data Final
      if (dataFimFiltro) {
        const dFim = parseDate(dataFimFiltro);
        if (dFim && item.dataSolicitacaoObj) {
          const itemDate = new Date(
            item.dataSolicitacaoObj.getFullYear(),
            item.dataSolicitacaoObj.getMonth(),
            item.dataSolicitacaoObj.getDate()
          );
          if (itemDate > dFim) return false;
        }
      }

      // Filtro de Situação
      if (situacaoFiltro !== 'TODOS') {
        if (situacaoFiltro === 'ENTREGUE') {
          const isEnt =
            String(item.situacao || '').trim().toUpperCase() === 'ENTREGUE' ||
            String(item.statusCompra || '').trim().toUpperCase() === 'ENTREGUE';
          if (!isEnt) return false;
        } else if (situacaoFiltro === 'PENDENTE') {
          const isEnt =
            String(item.situacao || '').trim().toUpperCase() === 'ENTREGUE' ||
            String(item.statusCompra || '').trim().toUpperCase() === 'ENTREGUE';
          const isCanc =
            String(item.statusCompra || '').trim().toUpperCase() === 'CANCELADA' ||
            String(item.situacao || '').trim().toUpperCase() === 'CANCELADO';
          if (isEnt || isCanc) return false;
        } else if (situacaoFiltro === 'CANCELADO') {
          const isCanc =
            String(item.statusCompra || '').trim().toUpperCase() === 'CANCELADA' ||
            String(item.situacao || '').trim().toUpperCase() === 'CANCELADO';
          if (!isCanc) return false;
        }
      }

      // Filtro de Solicitante
      if (solicitanteFiltro) {
        if (String(item.solicitante || '').trim() !== solicitanteFiltro) {
          return false;
        }
      }

      // Busca por Material / Descrição
      if (buscaMaterial) {
        const termo = buscaMaterial.toLowerCase().trim();
        const mat = String(item.material || '').toLowerCase();
        const prot = String(item.protocolo || '').toLowerCase();
        if (!mat.includes(termo) && !prot.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [dadosBrutos, dataInicioFiltro, dataFimFiltro, situacaoFiltro, solicitanteFiltro, buscaMaterial]);

  // Cálculos consolidados para os indicadores, faixas e evoluções
  const indicadores = useMemo(() => calcularIndicadores(dadosFiltrados), [dadosFiltrados]);

  const entreguesValidos = useMemo(
    () => dadosFiltrados.filter((d) => d.tempoTipo === 'ATENDIMENTO' && d.diasCalculados !== null),
    [dadosFiltrados]
  );

  const pendentesValidos = useMemo(
    () => dadosFiltrados.filter((d) => d.tempoTipo === 'ESPERA' && d.diasCalculados !== null),
    [dadosFiltrados]
  );

  const faixasPrazo = useMemo(() => calcularFaixasPrazo(entreguesValidos), [entreguesValidos]);

  const evolucaoMensal = useMemo(() => calcularEvolucaoMensal(dadosFiltrados), [dadosFiltrados]);

  // Prepara dados do Gráfico 1 (Lead time individual por pedido entregue)
  const pedidosGrafico1Ordenados = useMemo(() => {
    const copia = [...entreguesValidos];
    if (ordemGrafico1 === 'MAIOR_DIAS') {
      copia.sort((a, b) => (b.diasCalculados ?? 0) - (a.diasCalculados ?? 0));
    } else if (ordemGrafico1 === 'MENOR_DIAS') {
      copia.sort((a, b) => (a.diasCalculados ?? 0) - (b.diasCalculados ?? 0));
    } else {
      // Recente
      copia.sort((a, b) => {
        const tA = a.dataEntregaObj ? a.dataEntregaObj.getTime() : 0;
        const tB = b.dataEntregaObj ? b.dataEntregaObj.getTime() : 0;
        return tB - tA;
      });
    }
    return copia;
  }, [entreguesValidos, ordemGrafico1]);

  const totalPaginasG1 = Math.max(1, Math.ceil(pedidosGrafico1Ordenados.length / ITENS_POR_PAGINA_G1));
  const pedidosGrafico1Paginados = useMemo(() => {
    const inicio = (paginaGrafico1 - 1) * ITENS_POR_PAGINA_G1;
    return pedidosGrafico1Ordenados.slice(inicio, inicio + ITENS_POR_PAGINA_G1);
  }, [pedidosGrafico1Ordenados, paginaGrafico1]);

  const maxDiasEntregues = useMemo(() => {
    if (!entreguesValidos.length) return 10;
    return Math.max(...entreguesValidos.map((p) => p.diasCalculados ?? 0), 10);
  }, [entreguesValidos]);

  // Prepara dados do Gráfico 3 (Pendentes com tempo de espera)
  const pendentesOrdenadosEspera = useMemo(() => {
    return [...pendentesValidos].sort((a, b) => (b.diasCalculados ?? 0) - (a.diasCalculados ?? 0));
  }, [pendentesValidos]);

  const maxDiasEspera = useMemo(() => {
    if (!pendentesValidos.length) return 10;
    return Math.max(...pendentesValidos.map((p) => p.diasCalculados ?? 0), 10);
  }, [pendentesValidos]);

  // Tabela Geral: filtragem adicional por termo e ordenação
  const dadosTabelaFinal = useMemo(() => {
    let result = [...dadosFiltrados];

    if (termoBuscaTabela) {
      const q = termoBuscaTabela.toLowerCase().trim();
      result = result.filter(
        (s) =>
          String(s.protocolo || '').toLowerCase().includes(q) ||
          String(s.material || '').toLowerCase().includes(q) ||
          String(s.solicitante || '').toLowerCase().includes(q) ||
          String(s.responsavelCompra || '').toLowerCase().includes(q) ||
          String(s.onde || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (colunaOrdenacao === 'protocolo') {
        valA = String(a.protocolo || '');
        valB = String(b.protocolo || '');
      } else if (colunaOrdenacao === 'solicitante') {
        valA = String(a.solicitante || '');
        valB = String(b.solicitante || '');
      } else if (colunaOrdenacao === 'material') {
        valA = String(a.material || '');
        valB = String(b.material || '');
      } else if (colunaOrdenacao === 'dataPedido') {
        valA = a.dataSolicitacaoObj ? a.dataSolicitacaoObj.getTime() : 0;
        valB = b.dataSolicitacaoObj ? b.dataSolicitacaoObj.getTime() : 0;
      } else if (colunaOrdenacao === 'dias') {
        valA = a.diasCalculados ?? -1;
        valB = b.diasCalculados ?? -1;
      } else if (colunaOrdenacao === 'situacao') {
        valA = String(a.situacao || '');
        valB = String(b.situacao || '');
      }

      if (valA < valB) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (valA > valB) return direcaoOrdenacao === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dadosFiltrados, termoBuscaTabela, colunaOrdenacao, direcaoOrdenacao]);

  const totalPaginasTabela = Math.max(1, Math.ceil(dadosTabelaFinal.length / ITENS_POR_PAGINA_TABELA));
  const dadosTabelaPaginados = useMemo(() => {
    const inicio = (paginaTabela - 1) * ITENS_POR_PAGINA_TABELA;
    return dadosTabelaFinal.slice(inicio, inicio + ITENS_POR_PAGINA_TABELA);
  }, [dadosTabelaFinal, paginaTabela]);

  // Exportação para CSV compatível com Excel Brasil
  const exportarCSV = () => {
    if (!dadosFiltrados.length) return;

    const cabecalhos = [
      'Protocolo',
      'Data da Solicitação',
      'Solicitante',
      'E-mail',
      'Material',
      'Quantidade',
      'Prioridade',
      'Situação',
      'Status da Compra',
      'Responsável pela Compra',
      'Data da Compra',
      'Previsão de Chegada',
      'Data da Entrega',
      'Tempo Transcorrido (Dias corridos)',
      'Situação do Prazo',
      'Onde Usar',
      'Para Que',
    ];

    const linhas = dadosFiltrados.map((item) => [
      `"${String(item.protocolo || '').replace(/"/g, '""')}"`,
      `"${formatarDataBr(item.dataPedido)}"`,
      `"${String(item.solicitante || '').replace(/"/g, '""')}"`,
      `"${String(item.email || '').replace(/"/g, '""')}"`,
      `"${String(item.material || '').replace(/"/g, '""')}"`,
      item.quantidade ?? 1,
      `"${String(item.prioridade || '').replace(/"/g, '""')}"`,
      `"${String(item.situacao || '').replace(/"/g, '""')}"`,
      `"${String(item.statusCompra || '').replace(/"/g, '""')}"`,
      `"${String(item.responsavelCompra || '').replace(/"/g, '""')}"`,
      `"${formatarDataBr(item.dataCompra)}"`,
      `"${formatarDataBr(item.previsaoChegada)}"`,
      `"${formatarDataBr(item.dataEntrega)}"`,
      item.diasCalculados !== null ? item.diasCalculados : '',
      item.tempoTipo === 'ATENDIMENTO'
        ? 'Entregue (Tempo de atendimento)'
        : item.tempoTipo === 'ESPERA'
        ? 'Aguardando entrega (Tempo de espera)'
        : 'Cancelado ou Data Inválida',
      `"${String(item.onde || '').replace(/"/g, '""')}"`,
      `"${String(item.paraQue || '').replace(/"/g, '""')}"`,
    ]);

    const conteudoCSV = '\uFEFF' + [cabecalhos.join(';'), ...linhas.map((l) => l.join(';'))].join('\r\n');
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `acompanhamento_pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preset de datas rápidas
  const aplicarPresetData = (dias: number | 'ano' | 'tudo') => {
    if (dias === 'tudo') {
      setDataInicioFiltro('');
      setDataFimFiltro('');
      return;
    }
    const hoje = new Date();
    const strFim = hoje.toISOString().slice(0, 10);

    if (dias === 'ano') {
      const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
      setDataInicioFiltro(primeiroDiaAno.toISOString().slice(0, 10));
      setDataFimFiltro(strFim);
    } else {
      const inicio = new Date();
      inicio.setDate(hoje.getDate() - dias);
      setDataInicioFiltro(inicio.toISOString().slice(0, 10));
      setDataFimFiltro(strFim);
    }
    setPaginaTabela(1);
    setPaginaGrafico1(1);
  };

  const limparFiltros = () => {
    setDataInicioFiltro('');
    setDataFimFiltro('');
    setSituacaoFiltro('TODOS');
    setSolicitanteFiltro('');
    setBuscaMaterial('');
    setTermoBuscaTabela('');
    setPaginaTabela(1);
    setPaginaGrafico1(1);
  };

  const temFiltroAtivo = Boolean(
    dataInicioFiltro || dataFimFiltro || situacaoFiltro !== 'TODOS' || solicitanteFiltro || buscaMaterial
  );

  // Helper de badges de status compra
  const renderBadgeStatus = (sol: SolicitacaoAnalitica) => {
    const isEnt = sol.situacao === 'ENTREGUE' || sol.statusCompra === 'ENTREGUE';
    if (isEnt) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Entregue
        </span>
      );
    }
    if (sol.statusCompra === 'CANCELADA' || String(sol.situacao) === 'CANCELADO') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
          Cancelada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        {sol.statusCompra || 'Aguardando entrega'}
      </span>
    );
  };

  // Helper de badge de tempo de espera/atendimento
  const renderBadgeTempo = (sol: SolicitacaoAnalitica) => {
    if (sol.diasCalculados === null) {
      return <span className="text-slate-400 text-xs">-</span>;
    }

    const dias = sol.diasCalculados;
    let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (dias > 30) cor = 'text-rose-700 bg-rose-50 border-rose-200';
    else if (dias > 15) cor = 'text-amber-700 bg-amber-50 border-amber-200';
    else if (dias > 7) cor = 'text-blue-700 bg-blue-50 border-blue-200';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold border ${cor}`}>
        <Clock size={12} />
        {dias} {dias === 1 ? 'dia corrido' : 'dias corridos'}
      </span>
    );
  };

  if (loading && dadosBrutos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm font-medium">Carregando dados dos pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:pb-0">
      {/* CORPO DO PAINEL INTERATIVO NA TELA (ESCONDIDO NA IMPRESSÃO PARA NÃO DUPLICAR NEM POLUIR O PDF) */}
      <div className="space-y-6 print:hidden">
        {/* CABEÇALHO DO PAINEL DE ACOMPANHAMENTO DE PEDIDOS */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={22} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Painel de Acompanhamento de Pedidos
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Acompanhe os prazos de atendimento, as entregas realizadas e os pedidos que continuam aguardando
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={carregarDados}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Recarregar dados reais da planilha"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={exportarCSV}
            disabled={!dadosFiltrados.length}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Exportar dados filtrados para Excel/CSV"
          >
            <Download size={15} />
            <span>Exportar planilha (CSV)</span>
          </button>

          <button
            onClick={() => setExibirRelatorioImpressao(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
            title="Abrir relatório formatado para impressão ou salvar em PDF"
          >
            <Printer size={15} />
            <span>Relatório para Impressão (PDF)</span>
          </button>
        </div>
      </div>

      {/* AVISO DE DADOS COM DATA INCOMPLETA / INVÁLIDA */}
      {indicadores.pedidosComDataInvalida > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Aviso sobre o registro de datas:</span>
            <p className="text-amber-800">
              {indicadores.pedidosComDataInvalida}{' '}
              {indicadores.pedidosComDataInvalida === 1 ? 'pedido possui' : 'pedidos possuem'} data de solicitação ou de entrega não informada e{' '}
              {indicadores.pedidosComDataInvalida === 1 ? 'não foi considerado' : 'não foram considerados'} no cálculo de médias de tempo para manter a exatidão dos indicadores.
            </p>
          </div>
        </div>
      )}

      {/* FILTROS DE CONSULTA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Filter size={15} className="text-blue-600" /> Filtros de Consulta
          </span>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1 hidden sm:inline">Período rápido:</span>
            <button
              onClick={() => aplicarPresetData(30)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => aplicarPresetData(90)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Últimos 90 dias
            </button>
            <button
              onClick={() => aplicarPresetData('ano')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Este ano
            </button>
            <button
              onClick={() => aplicarPresetData('tudo')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Todo o período
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Data Início */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data inicial (solicitação)</label>
            <input
              type="date"
              value={dataInicioFiltro}
              onChange={(e) => {
                setDataInicioFiltro(e.target.value);
                setPaginaTabela(1);
                setPaginaGrafico1(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data final (solicitação)</label>
            <input
              type="date"
              value={dataFimFiltro}
              onChange={(e) => {
                setDataFimFiltro(e.target.value);
                setPaginaTabela(1);
                setPaginaGrafico1(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Situação */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Situação do Pedido</label>
            <select
              value={situacaoFiltro}
              onChange={(e) => {
                setSituacaoFiltro(e.target.value as any);
                setPaginaTabela(1);
                setPaginaGrafico1(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="TODOS">Todas as situações</option>
              <option value="ENTREGUE">Pedidos entregues</option>
              <option value="PENDENTE">Pedidos aguardando entrega</option>
              <option value="CANCELADO">Pedidos cancelados</option>
            </select>
          </div>

          {/* Solicitante */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Solicitante</label>
            <select
              value={solicitanteFiltro}
              onChange={(e) => {
                setSolicitanteFiltro(e.target.value);
                setPaginaTabela(1);
                setPaginaGrafico1(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="">Todos os solicitantes</option>
              {listaSolicitantes.map((sol) => (
                <option key={sol} value={sol}>
                  {sol}
                </option>
              ))}
            </select>
          </div>

          {/* Busca por Material / Protocolo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Material ou Protocolo</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: broca, EPI, PED-..."
                value={buscaMaterial}
                onChange={(e) => {
                  setBuscaMaterial(e.target.value);
                  setPaginaTabela(1);
                  setPaginaGrafico1(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>
        </div>

        {temFiltroAtivo && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Exibindo <span className="font-bold text-slate-900">{dadosFiltrados.length}</span> de {dadosBrutos.length} pedidos registrados
            </span>
            <button
              onClick={limparFiltros}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Limpar filtros aplicados
            </button>
          </div>
        )}
      </div>

      {/* 4. CARDS DE INDICADORES PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 4.1 Total de Pedidos */}
        <Card className="p-4 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                Total de pedidos
                <span title="Quantidade de solicitações registradas no período selecionado." className="text-slate-400 hover:text-blue-600 cursor-help">
                  <Info size={13} />
                </span>
              </span>
              <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <FileText size={18} />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{indicadores.totalPedidos}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quantidade de solicitações registradas no período selecionado.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Filtros ativos aplicados
          </div>
        </Card>

        {/* 4.2 Pedidos Entregues */}
        <Card className="p-4 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                Pedidos entregues
                <span title="Quantidade de pedidos que possuem registro de entrega concluída." className="text-slate-400 hover:text-emerald-600 cursor-help">
                  <Info size={13} />
                </span>
              </span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{indicadores.pedidosEntregues}</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                {indicadores.pedidosEntreguesPct.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quantidade de pedidos que possuem registro de entrega concluída.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
            Pedidos com entrega registrada
          </div>
        </Card>

        {/* 4.3 Pedidos Pendentes */}
        <Card className="p-4 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                Pedidos pendentes
                <span title="Quantidade de pedidos que ainda não possuem registro de entrega concluída." className="text-slate-400 hover:text-amber-600 cursor-help">
                  <Info size={13} />
                </span>
              </span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Inbox size={18} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">{indicadores.pedidosPendentes}</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                {indicadores.pedidosPendentesPct.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quantidade de pedidos que ainda não possuem registro de entrega concluída.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
            Aguardando entrega
          </div>
        </Card>

        {/* 4.4 & 4.5 Tempo Médio e Mediano de Entrega */}
        <Card className="p-4 flex flex-col justify-between border-slate-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                Tempo médio para entrega
                <span
                  title="Quantidade média de dias entre a realização do pedido e a entrega, considerando os pedidos entregues com datas válidas."
                  className="text-slate-400 hover:text-blue-600 cursor-help"
                >
                  <Info size={13} />
                </span>
              </span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Timer size={18} />
              </span>
            </div>
            <div className="text-3xl font-extrabold text-blue-600">
              {entreguesValidos.length > 0 ? `${indicadores.tempoMedioEntregaDias.toFixed(1)} dias` : '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quantidade média de dias entre a realização do pedido e a entrega, considerando os pedidos entregues com datas válidas.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                Tempo mediano para entrega:
                <span
                  title="Metade dos pedidos entregues foi atendida em até esse número de dias, e a outra metade em um tempo igual ou maior, considerando o cálculo estatístico adotado."
                  className="text-slate-400 hover:text-blue-600 cursor-help"
                >
                  <Info size={11} />
                </span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {entreguesValidos.length > 0 ? `${indicadores.tempoMedianoEntregaDias.toFixed(1)} dias` : '-'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              (50% das entregas feitas em até esse prazo)
            </span>
          </div>
        </Card>
      </div>

      {/* LINHA DE INDICADORES DE PEDIDOS AGUARDANDO ENTREGA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 4.6 Pedido há mais tempo aguardando */}
        <Card className="p-4 sm:p-5 border-slate-200 bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={15} className="text-rose-600" />
                <span>Pedido há mais tempo aguardando</span>
                <span
                  title="Mostra o pedido pendente com maior tempo transcorrido desde a solicitação."
                  className="text-slate-400 hover:text-rose-600 cursor-help"
                >
                  <Info size={13} />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700">
                {indicadores.maiorEsperaAbertaDias > 0
                  ? `${indicadores.maiorEsperaAbertaDias} dias aguardando`
                  : 'Nenhum pedido aguardando'}
              </div>
              <p className="text-xs text-slate-500">
                Mostra o pedido pendente com maior tempo transcorrido desde a solicitação.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded shrink-0">
              Maior tempo de espera
            </span>
          </div>

          {indicadores.maiorEsperaPedido ? (
            <div className="mt-3 p-3 bg-white border border-rose-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">
                  {indicadores.maiorEsperaPedido.material}
                </div>
                <div className="text-[11px] text-slate-500">
                  Solicitante: <span className="font-medium text-slate-700">{indicadores.maiorEsperaPedido.solicitante}</span> • Data do pedido:{' '}
                  {formatarDataBr(indicadores.maiorEsperaPedido.dataPedido)}
                </div>
              </div>
              <button
                onClick={() => setSolicitacaoSelecionada(indicadores.maiorEsperaPedido)}
                className="shrink-0 text-xs font-semibold text-rose-700 hover:text-rose-800 underline flex items-center gap-1"
              >
                <span>{indicadores.maiorEsperaPedido.protocolo}</span>
                <ExternalLink size={12} />
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Todos os pedidos foram atendidos ou não há pendências.</p>
          )}
        </Card>

        {/* 4.7 Tempo médio de espera dos pedidos pendentes */}
        <Card className="p-4 sm:p-5 border-slate-200 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={15} className="text-amber-600" />
                <span>Tempo médio de espera dos pedidos pendentes</span>
                <span
                  title="Média de dias que os pedidos ainda não entregues estão aguardando, contados desde a data da solicitação até a data atual."
                  className="text-slate-400 hover:text-amber-600 cursor-help"
                >
                  <Info size={13} />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700">
                {pendentesValidos.length > 0 ? `${indicadores.tempoAtualEsperaMedioDias.toFixed(1)} dias em média` : '0 dias'}
              </div>
              <p className="text-xs text-slate-500">
                Média de dias que os pedidos ainda não entregues estão aguardando, contados desde a data da solicitação até a data atual.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded shrink-0">
              {pendentesValidos.length} {pendentesValidos.length === 1 ? 'pedido aguardando' : 'pedidos aguardando'}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Média de dias corridos dos pedidos que continuam aguardando atendimento. Quanto menor esse número, mais ágil é o atendimento da equipe.
          </p>
        </Card>
      </div>

      {/* SEÇÃO DE GRÁFICOS: 1 E 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: QUANTOS DIAS CADA PEDIDO LEVOU PARA SER ENTREGUE */}
        <Card className="p-4 sm:p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-600" />
                  Quantos dias cada pedido levou para ser entregue
                </h3>
                <p className="text-xs text-slate-500">
                  Duração em dias corridos de cada solicitação com entrega confirmada
                </p>
              </div>

              {/* Ordenação do Gráfico 1 */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => {
                    setOrdemGrafico1('MAIOR_DIAS');
                    setPaginaGrafico1(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    ordemGrafico1 === 'MAIOR_DIAS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Ordenar pelos que levaram mais dias"
                >
                  Mais demorados
                </button>
                <button
                  onClick={() => {
                    setOrdemGrafico1('MENOR_DIAS');
                    setPaginaGrafico1(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    ordemGrafico1 === 'MENOR_DIAS'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Ordenar pelos mais rápidos"
                >
                  Mais rápidos
                </button>
                <button
                  onClick={() => {
                    setOrdemGrafico1('RECENTE');
                    setPaginaGrafico1(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    ordemGrafico1 === 'RECENTE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Ordenar por data de entrega recente"
                >
                  Mais recentes
                </button>
              </div>
            </div>

            {/* Lista com Barras Horizontais */}
            {pedidosGrafico1Paginados.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum pedido entregue com datas válidas no período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosGrafico1Paginados.map((item) => {
                  const dias = item.diasCalculados ?? 0;
                  const pct = Math.min(100, Math.max(5, (dias / maxDiasEntregues) * 100));

                  let corBarra = 'bg-emerald-500';
                  if (dias > 30) corBarra = 'bg-rose-500';
                  else if (dias > 15) corBarra = 'bg-amber-500';
                  else if (dias > 7) corBarra = 'bg-blue-500';

                  return (
                    <div
                      key={item.protocolo}
                      onClick={() => setSolicitacaoSelecionada(item)}
                      className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer group"
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-blue-600 group-hover:underline">
                            {item.protocolo}
                          </span>
                          <span className="text-slate-800 font-medium truncate max-w-[180px] sm:max-w-[240px]">
                            {item.material}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 text-[11px] hidden sm:inline">
                            Entregue em: {formatarDataBr(item.dataEntrega)}
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {dias} {dias === 1 ? 'dia corrido' : 'dias corridos'}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                        <span>Solicitante: {item.solicitante}</span>
                        <span>Solicitado em: {formatarDataBr(item.dataPedido)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginação do Gráfico 1 */}
          {totalPaginasG1 > 1 && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Página {paginaGrafico1} de {totalPaginasG1} ({pedidosGrafico1Ordenados.length} pedidos entregues)
              </span>
              <div className="flex gap-1">
                <button
                  disabled={paginaGrafico1 === 1}
                  onClick={() => setPaginaGrafico1((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={paginaGrafico1 === totalPaginasG1}
                  onClick={() => setPaginaGrafico1((p) => Math.min(totalPaginasG1, p + 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* GRÁFICO 2: QUANTOS PEDIDOS FORAM ENTREGUES EM CADA FAIXA DE TEMPO */}
        <Card className="p-4 sm:p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                Quantos pedidos foram entregues em cada faixa de tempo
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição dos pedidos entregues por tempo de atendimento (clique para detalhar)
              </p>
            </div>

            <div className="space-y-3">
              {faixasPrazo.map((faixa) => {
                const isSelected = faixaSelecionadaId === faixa.id;

                return (
                  <div key={faixa.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => setFaixaSelecionadaId(isSelected ? null : faixa.id)}
                      className={`w-full p-3 flex flex-col sm:flex-row sm:items-center justify-between text-left gap-2 transition-colors ${
                        isSelected ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-sm ${faixa.cor}`}></span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{faixa.label}</span>
                          <span className="text-[11px] text-slate-500">({faixa.descricao})</span>
                        </div>

                        {/* Barra percentual */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full ${faixa.cor} transition-all duration-500`}
                            style={{ width: `${Math.max(faixa.percentual, 2)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-sm">
                            {faixa.quantidade} {faixa.quantidade === 1 ? 'pedido' : 'pedidos'}
                          </div>
                          <div className="text-[11px] text-slate-500">{faixa.percentual.toFixed(1)}% do total</div>
                        </div>
                        {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Drilldown: Lista de pedidos da faixa ao expandir */}
                    {isSelected && (
                      <div className="p-3 bg-slate-50/70 border-t border-slate-200 space-y-2 max-h-56 overflow-y-auto text-xs">
                        {faixa.pedidos.length === 0 ? (
                          <p className="text-slate-400 italic">Nenhum pedido nesta faixa.</p>
                        ) : (
                          faixa.pedidos.map((p) => (
                            <div
                              key={p.protocolo}
                              onClick={() => setSolicitacaoSelecionada(p)}
                              className="p-2 bg-white rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer flex justify-between items-center transition-colors"
                            >
                              <div className="truncate pr-2">
                                <span className="font-mono font-bold text-blue-600 mr-2">{p.protocolo}</span>
                                <span className="font-medium text-slate-800">{p.material}</span>
                                <span className="text-slate-500 text-[11px] ml-2">({p.solicitante})</span>
                              </div>
                              <div className="shrink-0 font-bold font-mono text-slate-700">
                                {p.diasCalculados} {p.diasCalculados === 1 ? 'dia' : 'dias'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Total avaliado: {entreguesValidos.length} pedidos com entrega registrada</span>
            <span className="font-medium text-slate-700">Classificação por tempo entre solicitação e entrega</span>
          </div>
        </Card>
      </div>

      {/* SEÇÃO DE GRÁFICOS: 3 E 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 3: PEDIDOS QUE CONTINUAM AGUARDANDO ENTREGA */}
        <Card className="p-4 sm:p-6 border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              Pedidos que continuam aguardando entrega
            </h3>
            <p className="text-xs text-slate-500">
              Pedidos pendentes em aberto ordenados pelo tempo transcorrido desde a solicitação
            </p>
          </div>

          {pendentesOrdenadosEspera.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhum pedido aguardando entrega no período selecionado.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pendentesOrdenadosEspera.map((item) => {
                const dias = item.diasCalculados ?? 0;
                let faixaEspera = {
                  label: 'Até 15 dias em espera',
                  cor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  barra: 'bg-emerald-500',
                };
                if (dias > 60) {
                  faixaEspera = {
                    label: 'Mais de 60 dias em espera',
                    cor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                    barra: 'bg-rose-600',
                  };
                } else if (dias > 30) {
                  faixaEspera = {
                    label: '31 a 60 dias em espera',
                    cor: 'bg-orange-100 text-orange-800 border-orange-200',
                    barra: 'bg-orange-500',
                  };
                } else if (dias > 15) {
                  faixaEspera = {
                    label: '16 a 30 dias em espera',
                    cor: 'bg-amber-100 text-amber-800 border-amber-200',
                    barra: 'bg-amber-500',
                  };
                }

                const pct = Math.min(100, Math.max(5, (dias / maxDiasEspera) * 100));

                return (
                  <div
                    key={item.protocolo}
                    onClick={() => setSolicitacaoSelecionada(item)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 text-xs">{item.protocolo}</span>
                          <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                            {item.material}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Solicitante: <span className="font-medium text-slate-700">{item.solicitante}</span> • Resp. Compra:{' '}
                          <span className="font-medium text-blue-700">{item.responsavelCompra || 'Não definido'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${faixaEspera.cor}`}>
                          {faixaEspera.label}
                        </span>
                        <span className="font-black font-mono text-slate-900 text-xs">
                          {dias} {dias === 1 ? 'dia corrido' : 'dias corridos'}
                        </span>
                      </div>
                    </div>

                    {/* Barra de espera */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${faixaEspera.barra}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* GRÁFICO 4: EVOLUÇÃO DO TEMPO DE ENTREGA AO LONGO DOS MESES */}
        <Card className="p-4 sm:p-6 border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              Evolução do tempo de entrega ao longo dos meses
            </h3>
            <p className="text-xs text-slate-500">
              Comparativo mensal do tempo médio e mediano de atendimento x quantidade de pedidos
            </p>
          </div>

          {evolucaoMensal.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Sem dados históricos suficientes para análise mensal.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabela Resumo da Evolução Mensal */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-2.5 py-2">Mês/Ano</th>
                      <th className="px-2.5 py-2 text-center">Pedidos Solicitados</th>
                      <th className="px-2.5 py-2 text-center">Pedidos Entregues</th>
                      <th className="px-2.5 py-2 text-right">Tempo Médio</th>
                      <th className="px-2.5 py-2 text-right">Tempo Mediano</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evolucaoMensal.map((m) => (
                      <tr key={m.mesAnoKey} className="hover:bg-slate-50/60">
                        <td className="px-2.5 py-2.5 font-bold text-slate-900">{m.mesAnoFormatado}</td>
                        <td className="px-2.5 py-2.5 text-center font-semibold text-blue-600">
                          {m.novosPedidosAbertos}
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-semibold text-emerald-600">
                          {m.pedidosConcluidos}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono font-bold text-slate-800">
                          {m.pedidosConcluidos > 0 ? `${m.tempoMedioDias.toFixed(1)} dias` : '-'}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-mono text-slate-600">
                          {m.pedidosConcluidos > 0 ? `${m.tempoMedianoDias.toFixed(1)} dias` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gráfico Visual em Barras Comparativas */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                  <span>Comparativo Visual de Desempenho Mensal</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs"></span> Solicitados
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> Entregues
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {evolucaoMensal.slice(-4).map((m) => (
                    <div key={m.mesAnoKey} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div className="text-[11px] font-bold text-slate-800 mb-1">{m.mesAnoFormatado}</div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        {m.pedidosConcluidos > 0 ? `${m.tempoMedioDias.toFixed(1)}d` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">Tempo médio</div>
                      <div className="mt-1 flex justify-center gap-2 text-[10px] font-semibold">
                        <span className="text-blue-600">+{m.novosPedidosAbertos}</span>
                        <span className="text-emerald-600">✓{m.pedidosConcluidos}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 5. TABELA GERAL: HISTÓRICO DOS PEDIDOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Histórico dos Pedidos
            </h3>
            <p className="text-xs text-slate-500">
              Consulte todas as solicitações com tempo de atendimento ou tempo de espera
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder="Buscar nesta tabela..."
              value={termoBuscaTabela}
              onChange={(e) => {
                setTermoBuscaTabela(e.target.value);
                setPaginaTabela(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Tabela Desktop / Tablet */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => {
                    setColunaOrdenacao('protocolo');
                    setDirecaoOrdenacao(colunaOrdenacao === 'protocolo' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Protocolo <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setColunaOrdenacao('solicitante');
                    setDirecaoOrdenacao(colunaOrdenacao === 'solicitante' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Solicitante <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setColunaOrdenacao('material');
                    setDirecaoOrdenacao(colunaOrdenacao === 'material' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Material / Item <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3.5 py-3 text-center">Qtd</th>
                <th
                  onClick={() => {
                    setColunaOrdenacao('dataPedido');
                    setDirecaoOrdenacao(colunaOrdenacao === 'dataPedido' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Data da Solicitação <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3.5 py-3">Data da Entrega</th>
                <th
                  onClick={() => {
                    setColunaOrdenacao('situacao');
                    setDirecaoOrdenacao(colunaOrdenacao === 'situacao' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Situação <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setColunaOrdenacao('dias');
                    setDirecaoOrdenacao(colunaOrdenacao === 'dias' && direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
                  }}
                  className="px-3.5 py-3 text-right cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    Tempo Transcorrido (Dias corridos) <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dadosTabelaPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma solicitação encontrada com os critérios definidos.
                  </td>
                </tr>
              ) : (
                dadosTabelaPaginados.map((item) => (
                  <tr
                    key={item.protocolo}
                    onClick={() => setSolicitacaoSelecionada(item)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-3.5 py-3 font-mono font-bold text-blue-600">{item.protocolo}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-800">{item.solicitante}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-900 max-w-xs truncate">{item.material}</td>
                    <td className="px-3.5 py-3 text-center text-slate-700 font-mono">{item.quantidade ?? 1}</td>
                    <td className="px-3.5 py-3 text-slate-600">{formatarDataBr(item.dataPedido)}</td>
                    <td className="px-3.5 py-3 text-slate-600">{formatarDataBr(item.dataEntrega)}</td>
                    <td className="px-3.5 py-3">{renderBadgeStatus(item)}</td>
                    <td className="px-3.5 py-3 text-right">{renderBadgeTempo(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação da Tabela Geral */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span className="text-slate-500">
            Mostrando {dadosTabelaPaginados.length} de {dadosTabelaFinal.length} registros
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={paginaTabela === 1}
              onClick={() => setPaginaTabela((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="font-semibold text-slate-700">
              Página {paginaTabela} de {totalPaginasTabela}
            </span>
            <button
              disabled={paginaTabela === totalPaginasTabela}
              onClick={() => setPaginaTabela((p) => Math.min(totalPaginasTabela, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* FIM DO CORPO DO PAINEL INTERATIVO NA TELA */}

      {/* MODAL DE DETALHES COMPLETOS DA SOLICITAÇÃO (ESCONDIDO NA IMPRESSÃO) */}
      {solicitacaoSelecionada && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono font-bold text-blue-600 text-lg mr-2">
                  {solicitacaoSelecionada.protocolo}
                </span>
                {renderBadgeStatus(solicitacaoSelecionada)}
              </div>
              <button
                onClick={() => setSolicitacaoSelecionada(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Resumo de Tempo de Atendimento / Espera */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 text-xs block">
                    {solicitacaoSelecionada.tempoTipo === 'ATENDIMENTO'
                      ? 'Tempo entre solicitação e entrega:'
                      : solicitacaoSelecionada.tempoTipo === 'ESPERA'
                      ? 'Tempo atual aguardando entrega:'
                      : 'Situação do prazo:'}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    {solicitacaoSelecionada.tempoTipo === 'ATENDIMENTO'
                      ? 'Dias corridos entre a data do pedido e a entrega efetiva'
                      : 'Dias corridos desde a data da solicitação até hoje'}
                  </span>
                </div>
                <div className="text-right">{renderBadgeTempo(solicitacaoSelecionada)}</div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Material / Item</span>
                  <span className="font-bold text-slate-900 text-sm">{solicitacaoSelecionada.material}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Quantidade</span>
                  <span className="font-semibold text-slate-900">{solicitacaoSelecionada.quantidade ?? 1}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Solicitante</span>
                  <span className="font-semibold text-slate-900">{solicitacaoSelecionada.solicitante}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">E-mail do Solicitante</span>
                  <span className="font-medium text-slate-700">{solicitacaoSelecionada.email || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data da Solicitação</span>
                  <span className="font-medium text-slate-900">
                    {formatarDataHoraBr(solicitacaoSelecionada.dataHora || solicitacaoSelecionada.dataPedido)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data Efetiva de Entrega</span>
                  <span className="font-medium text-slate-900">
                    {formatarDataBr(solicitacaoSelecionada.dataEntrega)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Prioridade</span>
                  <span className="font-semibold text-slate-900">{solicitacaoSelecionada.prioridade || 'NORMAL'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Precisa Liberação SHE?</span>
                  <span className="font-medium text-slate-900">
                    {solicitacaoSelecionada.precisaLiberacaoShe || 'NÃO'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Onde será utilizado</span>
                  <span className="font-medium text-slate-800">{solicitacaoSelecionada.onde || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Para que será utilizado</span>
                  <span className="font-medium text-slate-800">{solicitacaoSelecionada.paraQue || '-'}</span>
                </div>
                {solicitacaoSelecionada.observacoes && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Observações</span>
                    <span className="font-medium text-slate-800">{solicitacaoSelecionada.observacoes}</span>
                  </div>
                )}
              </div>

              {/* Bloco de Controle de Compra */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-4">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-blue-800">
                  <ShoppingBag size={14} /> Dados do Controle de Compra
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Responsável pela Compra:</span>
                    <span className="font-bold text-slate-800">
                      {solicitacaoSelecionada.responsavelCompra || 'Não definido'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status da Compra:</span>
                    <span className="font-bold text-slate-800">
                      {solicitacaoSelecionada.statusCompra || 'AGUARDANDO COMPRA'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Data da Compra:</span>
                    <span className="font-medium text-slate-800">
                      {formatarDataBr(solicitacaoSelecionada.dataCompra)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Previsão de Chegada:</span>
                    <span className="font-medium text-slate-800">
                      {formatarDataBr(solicitacaoSelecionada.previsaoChegada)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSolicitacaoSelecionada(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RELATÓRIO GERENCIAL COMPLETO PARA IMPRESSÃO E EXPORTAÇÃO EM PDF (A4)
          Garante 100% dos dados, sem truncamento, cabeçalho repetido em quebras
          de página e sem corte de linhas ao meio.
          ========================================================================= */}
      <div
        className={
          exibirRelatorioImpressao
            ? 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:max-w-none print:shadow-none print:border-none print:z-auto'
            : 'hidden print:block print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:w-full print:max-w-none print:shadow-none print:border-none print:z-auto'
        }
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 print:shadow-none print:border-none print:max-h-none print:overflow-visible print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none">
          {/* BARRA DE AÇÕES E INSTRUÇÕES NA TELA (OCULTA NA IMPRESSÃO) */}
          <div className="pb-4 border-b border-slate-200 mb-6 space-y-3 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Printer size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Visualização do Relatório Gerencial (PDF / Impressão A4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    O documento abaixo contém todos os indicadores, gráficos e os {dadosFiltrados.length} pedidos filtrados.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer size={16} /> Imprimir / Salvar em PDF
                </button>
                <button
                  onClick={() => setExibirRelatorioImpressao(false)}
                  className="px-3 py-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X size={16} /> Fechar
                </button>
              </div>
            </div>

            {/* Dica de configuração para o usuário */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Dica para exportação perfeita em PDF:</span>
                <span className="text-blue-800 ml-1">
                  Na janela do navegador que se abrirá ao clicar em &ldquo;Imprimir / Salvar em PDF&rdquo;, escolha o destino <strong>&ldquo;Salvar como PDF&rdquo;</strong>, formato <strong>A4</strong> e certifique-se de marcar a opção <strong>&ldquo;Gráficos de segundo plano&rdquo;</strong> para manter as cores dos indicadores e gráficos.
                </span>
              </div>
            </div>
          </div>

          {/* DOCUMENTO OFICIAL FORMATADO PARA A4 CONTÍNUO */}
          <div className="space-y-6 text-slate-900 print:space-y-5 print:text-[10pt]">
            {/* 1. CABEÇALHO CORPORATIVO */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end print:break-inside-avoid">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-blue-700">
                  Sistema de Gestão Operacional
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  CONTROLE DE PEDIDOS &amp; SUPRIMENTOS
                </h1>
                <h2 className="text-sm font-bold text-slate-700">
                  Relatório de Acompanhamento de Pedidos e Prazos de Entrega
                </h2>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-700">Emissão:</span>{' '}
                  {new Date().toLocaleDateString('pt-BR')} às{' '}
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Emitido por:</span>{' '}
                  {currentUser?.nome || 'Usuário do Sistema'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Base de dados: Registros Oficiais (Google Sheets)
                </div>
              </div>
            </div>

            {/* 2. RESUMO DO ESCOPO E FILTROS APLICADOS */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:break-inside-avoid print:bg-slate-50/80">
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Período Analisado:</span>
                <span className="font-bold text-slate-900">
                  {dataInicioFiltro ? formatarDataBr(dataInicioFiltro) : 'Início do histórico'} até{' '}
                  {dataFimFiltro ? formatarDataBr(dataFimFiltro) : 'Hoje'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Situação dos Pedidos:</span>
                <span className="font-bold text-slate-900">
                  {situacaoFiltro === 'TODOS'
                    ? 'Todas as situações'
                    : situacaoFiltro === 'ENTREGUE'
                    ? 'Pedidos entregues'
                    : situacaoFiltro === 'PENDENTE'
                    ? 'Pedidos aguardando entrega'
                    : 'Cancelados'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Solicitante:</span>
                <span className="font-bold text-slate-900">{solicitanteFiltro || 'Todos os solicitantes'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Total no Período:</span>
                <span className="font-black text-blue-700 text-sm">{dadosFiltrados.length} solicitações</span>
              </div>
            </div>

            {/* 3. QUADRO DE INDICADORES PRINCIPAIS */}
            <div className="print:break-inside-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                1. Indicadores Principais de Atendimento
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Total de pedidos</div>
                  <div className="text-xl font-black text-slate-900">{indicadores.totalPedidos}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Período selecionado</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Pedidos entregues</div>
                  <div className="text-xl font-black text-emerald-700">
                    {indicadores.pedidosEntregues} ({indicadores.pedidosEntreguesPct.toFixed(1)}%)
                  </div>
                  <div className="text-[9px] text-emerald-700 mt-0.5">Pedidos com entrega registrada</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Pedidos pendentes</div>
                  <div className="text-xl font-black text-amber-700">
                    {indicadores.pedidosPendentes} ({indicadores.pedidosPendentesPct.toFixed(1)}%)
                  </div>
                  <div className="text-[9px] text-amber-700 mt-0.5">Aguardando entrega</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Tempo médio para entrega</div>
                  <div className="text-xl font-black text-blue-700">
                    {entreguesValidos.length > 0 ? `${indicadores.tempoMedioEntregaDias.toFixed(1)} dias` : '-'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Média dos pedidos entregues</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Tempo mediano para entrega</div>
                  <div className="text-xl font-black text-slate-800">
                    {entreguesValidos.length > 0 ? `${indicadores.tempoMedianoEntregaDias.toFixed(1)} dias` : '-'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">50% entregues em até esse prazo</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white">
                  <div className="text-[10px] text-slate-500 font-medium">Pedido há mais tempo aguardando</div>
                  <div className="text-xl font-black text-rose-700">
                    {indicadores.maiorEsperaAbertaDias > 0 ? `${indicadores.maiorEsperaAbertaDias} dias` : '-'}
                  </div>
                  <div className="text-[9px] text-rose-600 mt-0.5">Maior tempo transcorrido</div>
                </div>
                <div className="p-2.5 border border-slate-300 rounded-lg bg-white col-span-2">
                  <div className="text-[10px] text-slate-500 font-medium">Tempo médio de espera dos pedidos pendentes</div>
                  <div className="text-xl font-black text-slate-900">
                    {pendentesValidos.length > 0 ? `${indicadores.tempoAtualEsperaMedioDias.toFixed(1)} dias corridos` : '0 dias'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Média dos pedidos que continuam aguardando</div>
                </div>
              </div>
            </div>

            {/* 4. QUADRO DE ENTREGAS POR TEMPO DE ATENDIMENTO */}
            <div className="print:break-inside-avoid">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                2. Entregas por tempo de atendimento (pedidos com entrega registrada)
              </h3>
              <table className="w-full text-xs text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Faixa de Tempo</th>
                    <th className="p-2 border-r border-slate-300">Descrição</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Quantidade</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">Percentual</th>
                    <th className="p-2 w-48">Proporção Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {faixasPrazo.map((f) => (
                    <tr key={f.id} className="print:break-inside-avoid even:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{f.label}</td>
                      <td className="p-2 text-slate-700 border-r border-slate-200">{f.descricao}</td>
                      <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                        {f.quantidade}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                        {f.percentual.toFixed(1)}%
                      </td>
                      <td className="p-2">
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full ${f.cor}`} style={{ width: `${Math.max(f.percentual, 3)}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>Total avaliado: {entreguesValidos.length} pedidos com data de entrega registrada</span>
                <span>Distribuição calculada em dias corridos entre solicitação e entrega</span>
              </div>
            </div>

            {/* 5. EVOLUÇÃO MENSAL DO ATENDIMENTO */}
            {evolucaoMensal.length > 0 && (
              <div className="print:break-inside-avoid">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
                  3. Evolução do tempo de entrega ao longo dos meses
                </h3>
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Mês/Ano</th>
                      <th className="p-2 border-r border-slate-300 text-center w-36">Pedidos Solicitados</th>
                      <th className="p-2 border-r border-slate-300 text-center w-36">Pedidos Entregues</th>
                      <th className="p-2 border-r border-slate-300 text-right w-36">Tempo Médio para Entrega</th>
                      <th className="p-2 text-right w-36">Tempo Mediano para Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {evolucaoMensal.map((m) => (
                      <tr key={m.mesAnoKey} className="print:break-inside-avoid even:bg-slate-50/50">
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{m.mesAnoFormatado}</td>
                        <td className="p-2 text-center font-bold text-blue-700 border-r border-slate-200 font-mono">
                          {m.novosPedidosAbertos}
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700 border-r border-slate-200 font-mono">
                          {m.pedidosConcluidos}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                          {m.pedidosConcluidos > 0 ? `${m.tempoMedioDias.toFixed(1)} dias` : '-'}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {m.pedidosConcluidos > 0 ? `${m.tempoMedianoDias.toFixed(1)} dias` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. PEDIDOS QUE CONTINUAM AGUARDANDO ENTREGA (PENDÊNCIAS) */}
            {pendentesValidos.length > 0 && (
              <div className="print:break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1 border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    4. Pedidos que Continuam Aguardando Entrega ({pendentesValidos.length} solicitações)
                  </h3>
                  <span className="text-[10px] text-slate-500">Ordenados pelo tempo transcorrido</span>
                </div>
                <table className="w-full text-[10px] text-left border border-amber-300">
                  <thead className="bg-amber-100 text-amber-950 font-bold uppercase text-[9px] border-b border-amber-300">
                    <tr>
                      <th className="p-1.5 border-r border-amber-200 w-24">Protocolo</th>
                      <th className="p-1.5 border-r border-amber-200 w-32">Solicitante</th>
                      <th className="p-1.5 border-r border-amber-200">Material / Item</th>
                      <th className="p-1.5 border-r border-amber-200 w-28">Resp. Compra</th>
                      <th className="p-1.5 border-r border-amber-200 w-28">Status Compra</th>
                      <th className="p-1.5 border-r border-amber-200 w-20 text-center">Data Pedido</th>
                      <th className="p-1.5 text-right w-24">Dias em Espera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200">
                    {pendentesOrdenadosEspera.slice(0, 20).map((p) => (
                      <tr key={p.protocolo} className="print:break-inside-avoid even:bg-amber-50/60">
                        <td className="p-1.5 font-mono font-bold text-slate-900 border-r border-amber-200">
                          {p.protocolo}
                        </td>
                        <td className="p-1.5 text-slate-800 border-r border-amber-200">{p.solicitante}</td>
                        <td className="p-1.5 font-medium text-slate-900 border-r border-amber-200 break-words">
                          {p.material}
                        </td>
                        <td className="p-1.5 text-slate-700 border-r border-amber-200">
                          {p.responsavelCompra || 'Não definido'}
                        </td>
                        <td className="p-1.5 text-slate-700 border-r border-amber-200">
                          {p.statusCompra || 'Aguardando entrega'}
                        </td>
                        <td className="p-1.5 text-center text-slate-700 border-r border-amber-200">
                          {formatarDataBr(p.dataPedido)}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-amber-900">
                          {p.diasCalculados} {p.diasCalculados === 1 ? 'dia' : 'dias'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendentesOrdenadosEspera.length > 20 && (
                  <p className="text-[9px] text-slate-500 mt-1 italic">
                    * Exibindo os 20 pedidos com maior tempo de espera. Para a relação completa de todas as pendências, verifique a Seção 5 abaixo.
                  </p>
                )}
              </div>
            )}

            {/* 7. RELAÇÃO INTEGRAL DE PEDIDOS DO PERÍODO (TODOS OS PEDIDOS SEM TRUNCAMENTO) */}
            <div className="mt-4">
              <div className="flex justify-between items-baseline mb-1 border-b border-slate-200 pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  5. Relação Integral de Pedidos do Período ({dadosFiltrados.length} solicitações listadas)
                </h3>
                <span className="text-[10px] text-slate-500">
                  Listagem completa sem cortes ou omissões
                </span>
              </div>
              <table className="w-full text-[9.5px] text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[8.5px] border-b border-slate-300">
                  <tr>
                    <th className="p-1.5 border-r border-slate-300 w-20">Protocolo</th>
                    <th className="p-1.5 border-r border-slate-300 w-28">Solicitante</th>
                    <th className="p-1.5 border-r border-slate-300">Material / Equipamento</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-10">Qtd</th>
                    <th className="p-1.5 border-r border-slate-300 w-20 text-center">Data Pedido</th>
                    <th className="p-1.5 border-r border-slate-300 w-20 text-center">Data Entrega</th>
                    <th className="p-1.5 border-r border-slate-300 w-24">Situação</th>
                    <th className="p-1.5 text-right w-20">Dias Corridos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                        Nenhum pedido encontrado no período ou com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    dadosFiltrados.map((p, idx) => (
                      <tr key={p.protocolo || idx} className="print:break-inside-avoid even:bg-slate-50/60">
                        <td className="p-1.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {p.protocolo}
                        </td>
                        <td className="p-1.5 text-slate-800 border-r border-slate-200">{p.solicitante}</td>
                        <td className="p-1.5 font-medium text-slate-900 border-r border-slate-200 break-words">
                          {p.material}
                        </td>
                        <td className="p-1.5 text-center font-mono border-r border-slate-200">
                          {p.quantidade ?? 1}
                        </td>
                        <td className="p-1.5 text-center text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {formatarDataBr(p.dataPedido)}
                        </td>
                        <td className="p-1.5 text-center text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {formatarDataBr(p.dataEntrega)}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-slate-800">
                          {p.situacao || p.statusCompra || '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.diasCalculados !== null ? `${p.diasCalculados} d` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>Total listado: {dadosFiltrados.length} pedidos</span>
                <span>Documento oficial para auditoria de atendimento e prazos</span>
              </div>
            </div>

            {/* 8. RODAPÉ DE ASSINATURA E AUTENTICIDADE */}
            <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-700 print:break-inside-avoid">
              <div>
                <div className="border-t border-slate-400 w-56 mb-1 pt-1"></div>
                <div className="font-bold text-slate-900">Responsável pelo Controle de Pedidos</div>
                <div className="text-[10px] text-slate-500">Gestão de Suprimentos &amp; Almoxarifado</div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="border-t border-slate-400 w-56 mb-1 pt-1"></div>
                <div className="font-bold text-slate-900">Diretoria / Gestão Operacional</div>
                <div className="text-[10px] text-slate-500">Homologação e Acompanhamento Gerencial</div>
              </div>
              <div className="col-span-2 pt-2 text-[10px] text-slate-500 text-center border-t border-slate-200 mt-2">
                Documento gerado eletronicamente pelo Sistema de Controle de Pedidos &amp; Suprimentos em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Dados autênticos sincronizados da base oficial.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
