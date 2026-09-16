import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Solicitacao } from '../types/solicitacao';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  PlusCircle,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
  Truck,
  UserCheck,
} from 'lucide-react';
import { ordenarSolicitacoes } from '../utils/solicitacaoUtils';

export default function Dashboard() {
  const [data, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.listarSolicitacoes();

      if (response.success) {
        const sorted = ordenarSolicitacoes(response.data || []);
        setData(sorted);
        setLastUpdate(new Date());
      } else {
        setError(
          response.error || 'Não foi possível carregar os dados reais.'
        );
      }
    } catch (err) {
      setError(
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isPrevisaoVencida = (sol: Solicitacao) => {
    if (!sol.previsaoChegada) return false;
    const status = sol.statusCompra || 'AGUARDANDO COMPRA';
    if (status === 'ENTREGUE' || status === 'CANCELADA' || sol.situacao === 'ENTREGUE') return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prevDate = new Date(sol.previsaoChegada);
    if (isNaN(prevDate.getTime())) return false;
    prevDate.setHours(0, 0, 0, 0);

    return prevDate < hoje;
  };

  const parseDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const text = String(value).trim();
    if (!text) return null;

    const brMatch = text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (brMatch) {
      const day = Number(brMatch[1]);
      const month = Number(brMatch[2]) - 1;
      const year = Number(brMatch[3]);
      const hour = Number(brMatch[4] || 0);
      const minute = Number(brMatch[5] || 0);
      const second = Number(brMatch[6] || 0);
      const date = new Date(year, month, day, hour, minute, second);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateTime = (value: unknown) => {
    if (!value) return '-';
    const date = parseDate(value);
    if (!date) return String(value);

    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString(
      'pt-BR',
      { hour: '2-digit', minute: '2-digit' }
    )}`;
  };

  const formatDateParts = (value: unknown) => {
    const date = parseDate(value);
    if (!date) {
      return { dateStr: value ? String(value) : '-', timeStr: '' };
    }
    return {
      dateStr: date.toLocaleDateString('pt-BR'),
      timeStr: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getDateTimestamp = (value: unknown) => {
    const date = parseDate(value);
    return date ? date.getTime() : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-center">Carregando dashboard...</p>
      </div>
    );
  }

  const total = data.length;
  const pendentes = data.filter((s) => s.situacao === 'PENDENTE').length;
  const entregues = data.filter((s) => s.situacao === 'ENTREGUE').length;
  const urgentes = data.filter((s) => s.prioridade === 'URGENTE');
  const alta = data.filter((s) => s.prioridade === 'ALTA');

  // Métricas de Controle de Compra
  const aguardandoCompra = data.filter(s => (s.statusCompra || 'AGUARDANDO COMPRA') === 'AGUARDANDO COMPRA' && s.situacao !== 'ENTREGUE').length;
  const aguardandoEntrega = data.filter(s => ['COMPRA REALIZADA', 'AGUARDANDO ENTREGA'].includes(s.statusCompra || '') && s.situacao !== 'ENTREGUE').length;
  const comprasVencidas = data.filter(isPrevisaoVencida);

  // Agrupar por responsável pela compra
  const responsaveisCount: Record<string, number> = {};
  data.forEach(s => {
    if (s.situacao !== 'ENTREGUE') {
      const resp = s.responsavelCompra || 'Não definido';
      responsaveisCount[resp] = (responsaveisCount[resp] || 0) + 1;
    }
  });

  const recentes = data;

  return (
    <div className="h-full min-h-0 flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 overflow-auto bg-slate-50">

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Dashboard
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Visão geral do controle de solicitações e compras
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/nova')}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[42px]"
          >
            <PlusCircle size={18} />
            <span>Nova solicitação</span>
          </button>

          <button
            onClick={fetchData}
            className="bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[42px]"
          >
            <RefreshCw size={18} />
            <span>Atualizar dados</span>
          </button>
        </div>
      </div>

      {/* INDICADORES GERAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-shrink-0">
        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl mb-1">
            <FileText size={24} />
          </div>
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            Total solicitações
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {total}
          </div>
          <div className="text-slate-500 text-xs">Todas cadastradas</div>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl mb-1">
            <ShoppingBag size={24} />
          </div>
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            Aguardando Compra
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-500">
            {aguardandoCompra}
          </div>
          <div className="text-slate-500 text-xs">Sem compra iniciada</div>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-1">
            <Truck size={24} />
          </div>
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            Aguardando Entrega
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-600">
            {aguardandoEntrega}
          </div>
          <div className="text-slate-500 text-xs">Comprado / Em trânsito</div>
        </Card>

        <Card className="p-4 flex flex-col items-center text-center gap-1">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl mb-1">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
            Entregues / Concluídas
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
            {entregues}
          </div>
          <div className="text-slate-500 text-xs">Pedidos finalizados</div>
        </Card>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 min-h-0">

        {/* SOLICITAÇÕES RECENTES */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          <div className="flex justify-between items-center px-3 sm:px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Solicitações recentes
            </h3>
            <button
              onClick={() => navigate('/solicitacoes')}
              className="text-blue-600 text-xs sm:text-sm font-medium flex items-center gap-1 hover:text-blue-700 active:text-blue-800"
            >
              <span>Ver todas</span>
              <ChevronRight size={17} />
            </button>
          </div>

          {/* MOBILE LIST */}
          <div className="block lg:hidden flex-1 overflow-auto divide-y divide-slate-100">
            {recentes.map((s) => {
              const onde = s.onde || '-';
              const { dateStr, timeStr } = formatDateParts(s.dataHora);
              const vencida = isPrevisaoVencida(s);

              return (
                <button
                  key={s.protocolo}
                  onClick={() => navigate(`/solicitacoes?protocolo=${encodeURIComponent(s.protocolo)}`, { state: { protocolo: s.protocolo } })}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      {s.material || '-'}
                      {vencida && <span className="text-red-600 text-xs font-bold">⚠️ Vencida</span>}
                    </div>
                    <div className="text-slate-500 text-xs truncate">
                      Resp: {s.responsavelCompra || 'Não definido'}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1 flex-shrink-0">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                      {s.statusCompra || 'AGUARDANDO COMPRA'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.situacao || '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex flex-col items-end leading-tight text-xs text-slate-500">
                      <span>{dateStr}</span>
                      {timeStr && <span>{timeStr}</span>}
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </button>
              );
            })}

            {recentes.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">
                Nenhuma solicitação encontrada.
              </div>
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block flex-1 min-h-0 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-3 text-left w-[25%]">Material</th>
                  <th className="px-3 py-3 text-left w-[22%]">Responsável Compra</th>
                  <th className="px-3 py-3 text-left w-[18%]">Status Compra</th>
                  <th className="px-3 py-3 text-left w-[15%]">Situação</th>
                  <th className="px-3 py-3 text-left w-[20%]">Data Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentes.map((s) => (
                  <tr
                    key={s.protocolo}
                    onClick={() => navigate(`/solicitacoes?protocolo=${encodeURIComponent(s.protocolo)}`, { state: { protocolo: s.protocolo } })}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-3 font-medium text-slate-900 truncate">
                      {s.material || '-'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 truncate font-semibold text-blue-700">
                      {s.responsavelCompra || 'Pendente'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {s.statusCompra || 'AGUARDANDO COMPRA'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.situacao || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {formatDateTime(s.dataHora)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA LATERAL */}
        <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-4">

          {/* ALERTAS */}
          <Card className="p-4 sm:p-5 flex-shrink-0">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Alertas & Atenção
            </h3>
            <div className="space-y-2.5">
              {comprasVencidas.length > 0 && (
                <div 
                  onClick={() => navigate('/solicitacoes')}
                  className="p-3 bg-red-100 border border-red-200 rounded-xl flex gap-2.5 items-center cursor-pointer hover:bg-red-200 transition-colors"
                >
                  <AlertCircle className="text-red-600 shrink-0" size={20} />
                  <div>
                    <div className="font-bold text-red-900 text-xs">
                      ⚠️ {comprasVencidas.length} {comprasVencidas.length === 1 ? 'previsão vencida' : 'previsões vencidas'}!
                    </div>
                    <div className="text-red-700 text-[11px]">Clique para verificar pedidos atrasados</div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-red-50 rounded-xl flex gap-2.5 items-center">
                <Flame className="text-red-600 shrink-0" size={19} />
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs">
                    {urgentes.length} urgentes
                  </div>
                  <div className="text-slate-600 text-[11px]">Ação imediata</div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl flex gap-2.5 items-center">
                <AlertCircle className="text-orange-600 shrink-0" size={19} />
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs">
                    {alta.length} alta prioridade
                  </div>
                  <div className="text-slate-600 text-[11px]">Acompanhar prazos</div>
                </div>
              </div>
            </div>
          </Card>

          {/* RESPONSÁVEIS COM PEDIDOS EM ABERTO */}
          <Card className="p-4 sm:p-5 flex-shrink-0">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <UserCheck size={16} className="text-blue-600" /> Responsáveis (Pedidos Abertos)
            </h3>
            <div className="space-y-2 text-xs">
              {Object.keys(responsaveisCount).length === 0 ? (
                <p className="text-slate-400">Nenhum pedido pendente.</p>
              ) : (
                Object.entries(responsaveisCount).map(([resp, count]) => (
                  <div key={resp} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-none">
                    <span className="font-medium text-slate-700 truncate">{resp}</span>
                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {count} {count === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}