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
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const navigate = useNavigate();

  /**
   * Carrega as solicitações
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.listarSolicitacoes();

      if (response.success) {
        setData(response.data || []);
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

  /**
   * Converte diferentes formatos de data para Date.
   *
   * Aceita:
   * - ISO: 2026-09-02T13:30:00
   * - ISO com timezone
   * - Brasileiro: 02/09/2026 13:30
   * - Brasileiro com segundos
   * - Date
   */
  const parseDate = (value: unknown): Date | null => {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const text = String(value).trim();

    if (!text) return null;

    // Formato brasileiro
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

      const date = new Date(
        year,
        month,
        day,
        hour,
        minute,
        second
      );

      return Number.isNaN(date.getTime()) ? null : date;
    }

    // ISO ou formato reconhecido pelo navegador
    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  /**
   * Formata data/hora (linha única).
   */
  const formatDateTime = (value: unknown) => {
    if (!value) return '-';

    const date = parseDate(value);

    if (!date) {
      return String(value);
    }

    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`;
  };

  /**
   * Formata data e hora separadamente (usado na lista mobile, em duas linhas).
   */
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

  /**
   * Timestamp para ordenação.
   */
  const getDateTimestamp = (value: unknown) => {
    const date = parseDate(value);
    return date ? date.getTime() : 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-center">
          Carregando dashboard...
        </p>
      </div>
    );
  }

  const total = data.length;

  const pendentes = data.filter(
    (s) => s.situacao === 'PENDENTE'
  ).length;

  const entregues = data.filter(
    (s) => s.situacao === 'ENTREGUE'
  ).length;

  const urgentes = data.filter(
    (s) => s.prioridade === 'URGENTE'
  );

  const alta = data.filter(
    (s) => s.prioridade === 'ALTA'
  );

  /**
   * Solicitações mais recentes.
   */
  const recentes = [...data]
    .sort(
      (a, b) =>
        getDateTimestamp(b.dataHora) -
        getDateTimestamp(a.dataHora)
    )
    .slice(0, 5);

  return (
    <div className="h-full min-h-0 flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 overflow-auto bg-slate-50">

      {/* =========================================================
          CABEÇALHO
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-shrink-0">

        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Dashboard
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm">
            Visão geral do controle de solicitações
          </p>
        </div>

        {/* BOTÕES */}
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

      {/* =========================================================
          INDICADORES
          Layout centralizado (ícone > label > número colorido > descrição)
          para bater com o mockup.
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-shrink-0">

        {/* TOTAL */}
        <Card className="p-5 sm:p-6 flex flex-col items-center text-center gap-1">

          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-1">
            <FileText size={26} />
          </div>

          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
            Total de solicitações
          </div>

          <div className="text-3xl sm:text-4xl font-bold text-blue-600">
            {total}
          </div>

          <div className="text-slate-500 text-xs sm:text-sm">
            Todas as solicitações
          </div>

        </Card>

        {/* PENDENTES */}
        <Card className="p-5 sm:p-6 flex flex-col items-center text-center gap-1">

          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl mb-1">
            <Clock size={26} />
          </div>

          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
            Pendentes
          </div>

          <div className="text-3xl sm:text-4xl font-bold text-amber-500">
            {pendentes}
          </div>

          <div className="text-slate-500 text-xs sm:text-sm">
            Aguardando atendimento
          </div>

        </Card>

        {/* ENTREGUES */}
        <Card className="p-5 sm:p-6 flex flex-col items-center text-center gap-1">

          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-1">
            <CheckCircle2 size={26} />
          </div>

          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
            Entregues
          </div>

          <div className="text-3xl sm:text-4xl font-bold text-emerald-600">
            {entregues}
          </div>

          <div className="text-slate-500 text-xs sm:text-sm">
            Concluídas
          </div>

        </Card>

      </div>

      {/* =========================================================
          CONTEÚDO PRINCIPAL
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 min-h-0">

        {/* =======================================================
            SOLICITAÇÕES RECENTES
        ======================================================= */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">

          {/* CABEÇALHO */}
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

          {/* =====================================================
              VERSÃO MOBILE — linha compacta (título/local à esquerda,
              badges no meio, data/hora + chevron à direita), igual mockup
          ===================================================== */}
          <div className="block lg:hidden flex-1 overflow-auto divide-y divide-slate-100">

            {recentes.map((s) => {

              const solicitacao = s as Solicitacao & {
                onde?: string;
              };

              const onde = solicitacao.onde || '-';
              const { dateStr, timeStr } = formatDateParts(s.dataHora);

              return (
                <button
                  key={s.protocolo}
                  onClick={() => navigate(`/solicitacoes/${s.protocolo}`)}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >

                  {/* MATERIAL / ONDE */}
                  <div className="min-w-0 flex-1">

                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {s.material || '-'}
                    </div>

                    <div className="text-slate-500 text-xs truncate">
                      {onde}
                    </div>

                  </div>

                  {/* BADGES */}
                  <div className="flex flex-col items-start gap-1.5 flex-shrink-0">

                    <span
                      className={`
                        inline-flex
                        px-2.5
                        py-0.5
                        rounded-full
                        text-[10px]
                        font-semibold
                        whitespace-nowrap
                        ${
                          s.prioridade === 'URGENTE'
                            ? 'bg-red-100 text-red-700'
                            : s.prioridade === 'ALTA'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }
                      `}
                    >
                      {s.prioridade || '-'}
                    </span>

                    <span
                      className={`
                        inline-flex
                        px-2.5
                        py-0.5
                        rounded-full
                        text-[10px]
                        font-semibold
                        whitespace-nowrap
                        ${
                          s.situacao === 'ENTREGUE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      `}
                    >
                      {s.situacao || '-'}
                    </span>

                  </div>

                  {/* DATA / HORA + CHEVRON */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">

                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </span>
                      {timeStr && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {timeStr}
                        </span>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />

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

          {/* =====================================================
              VERSÃO DESKTOP
          ===================================================== */}
          <div className="hidden lg:block flex-1 min-h-0 overflow-hidden">

            <table className="w-full text-sm table-fixed">

              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">

                <tr>

                  <th className="px-3 py-3 text-left w-[31%]">
                    Material / ferramenta
                  </th>

                  <th className="px-3 py-3 text-left w-[25%]">
                    Onde será utilizado
                  </th>

                  <th className="px-3 py-3 text-left w-[13%]">
                    Prioridade
                  </th>

                  <th className="px-3 py-3 text-left w-[13%]">
                    Situação
                  </th>

                  <th className="px-3 py-3 text-left w-[18%]">
                    Data/hora do pedido
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {recentes.map((s) => {

                  const solicitacao = s as Solicitacao & {
                    onde?: string;
                  };

                  const onde = solicitacao.onde || '-';

                  return (
                    <tr
                      key={s.protocolo}
                      onClick={() => navigate(`/solicitacoes/${s.protocolo}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >

                      {/* MATERIAL */}
                      <td className="px-3 py-3 font-medium text-slate-900">

                        <div
                          className="truncate"
                          title={s.material || ''}
                        >
                          {s.material || '-'}
                        </div>

                      </td>

                      {/* ONDE */}
                      <td className="px-3 py-3 text-slate-600">

                        <div
                          className="truncate"
                          title={onde}
                        >
                          {onde}
                        </div>

                      </td>

                      {/* PRIORIDADE */}
                      <td className="px-3 py-3">

                        <span
                          className={`
                            inline-flex
                            px-2
                            py-1
                            rounded-full
                            text-[10px]
                            font-medium
                            whitespace-nowrap
                            ${
                              s.prioridade === 'URGENTE'
                                ? 'bg-red-100 text-red-700'
                                : s.prioridade === 'ALTA'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }
                          `}
                        >
                          {s.prioridade || '-'}
                        </span>

                      </td>

                      {/* SITUAÇÃO */}
                      <td className="px-3 py-3">

                        <span
                          className={`
                            inline-flex
                            px-2
                            py-1
                            rounded-full
                            text-[10px]
                            font-medium
                            whitespace-nowrap
                            ${
                              s.situacao === 'ENTREGUE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          `}
                        >
                          {s.situacao || '-'}
                        </span>

                      </td>

                      {/* DATA / HORA */}
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">
                        {formatDateTime(s.dataHora)}
                      </td>

                    </tr>
                  );
                })}

                {recentes.length === 0 && (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Nenhuma solicitação encontrada.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          {/* Link extra abaixo da tabela, só no desktop (igual mockup) */}
          {recentes.length > 0 && (
            <div className="hidden lg:flex justify-center py-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => navigate('/solicitacoes')}
                className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700"
              >
                <span>Ver todas as solicitações</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>

        {/* =======================================================
            COLUNA LATERAL
        ======================================================= */}
        <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-4">

          {/* =====================================================
              ATENÇÃO
          ===================================================== */}
          <Card className="p-4 sm:p-5 flex-shrink-0">

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              Atenção
            </h3>

            <div className="space-y-3">

              {/* URGENTES */}
              <div className="p-3 bg-red-50 rounded-xl flex gap-3 items-center">

                <Flame
                  className="text-red-600 flex-shrink-0"
                  size={21}
                />

                <div className="min-w-0">

                  <div className="font-bold text-slate-900 text-sm">
                    {urgentes.length}{' '}
                    {urgentes.length === 1
                      ? 'solicitação urgente'
                      : 'solicitações urgentes'}
                  </div>

                  <div className="text-slate-600 text-xs">
                    Requer ação imediata
                  </div>

                </div>

              </div>

              {/* ALTA PRIORIDADE */}
              <div className="p-3 bg-orange-50 rounded-xl flex gap-3 items-center">

                <AlertCircle
                  className="text-orange-600 flex-shrink-0"
                  size={21}
                />

                <div className="min-w-0">

                  <div className="font-bold text-slate-900 text-sm">
                    {alta.length}{' '}
                    {alta.length === 1
                      ? 'solicitação de alta prioridade'
                      : 'solicitações de alta prioridade'}
                  </div>

                  <div className="text-slate-600 text-xs">
                    Acompanhe para evitar atrasos
                  </div>

                </div>

              </div>

            </div>

          </Card>

          {/* =====================================================
              ÚLTIMA ATUALIZAÇÃO
          ===================================================== */}
          <Card className="p-4 sm:p-5 flex-shrink-0">

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
              Última atualização
            </h3>

            <div className="flex gap-3 items-center">

              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                <RefreshCw size={19} />
              </div>

              <div className="min-w-0">

                <div className="font-bold text-slate-900 text-sm">
                  Hoje,{' '}
                  {lastUpdate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                <div className="text-slate-600 text-xs">
                  Dados atualizados
                </div>

              </div>

            </div>

          </Card>

        </div>
      </div>

      {/* =========================================================
          MENSAGEM DE ERRO
      ========================================================= */}
      {error && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}

    </div>
  );
}