import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Solicitacao, Usuario, StatusCompra } from '../types/solicitacao';
import { Search, Filter, CheckCircle2, Trash2, Edit3, X, AlertTriangle, Calendar, User, MapPin, PlusCircle, ShoppingBag, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordenarSolicitacoes } from '../utils/solicitacaoUtils';

export default function Solicitacoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<Solicitacao[]>([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTES' | 'ENTREGUES' | 'URGENTES' | 'ALTA' | 'COMPRA_VENCIDA'>('TODAS');

  // Selected item for details/edit modal
  const [selected, setSelected] = useState<Solicitacao | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Solicitacao>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSolicitacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resSol, resUsers] = await Promise.all([
        api.listarSolicitacoes(),
        api.listarUsuarios()
      ]);

      if (resSol.success) {
        const sorted = ordenarSolicitacoes(resSol.data || []);
        setData(sorted);
      } else {
        setError(resSol.error || 'Não foi possível carregar as solicitações.');
      }

      if (resUsers.success && Array.isArray(resUsers.data)) {
        // Filtrar apenas usuários com ATIVO !== 'NÃO'
        const ativos = resUsers.data.filter((u: Usuario) => u.ativo === 'SIM' || u.ativo === true || u.ativo === undefined);
        setUsuariosAtivos(ativos);
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  // Selecionar solicitação caso o protocolo tenha sido passado por navegação (Dashboard ou URL)
  useEffect(() => {
    const targetProtocolo = location.state?.protocolo || searchParams.get('protocolo') || searchParams.get('id');
    const targetFilter = location.state?.filter || searchParams.get('filter');

    if (targetFilter) {
      setFilter(targetFilter as any);
    }

    if (targetProtocolo) {
      const protUpper = String(targetProtocolo).trim().toUpperCase();
      if (data.length > 0) {
        const item = data.find(s => String(s.protocolo || '').trim().toUpperCase() === protUpper);
        if (item) {
          handleSelectSolicitacao(item);
        } else {
          api.buscarSolicitacao(protUpper).then(res => {
            const dataObj = (res.data || res) as Solicitacao;
            if (dataObj && dataObj.protocolo) {
              handleSelectSolicitacao(dataObj);
            }
          }).catch(() => {});
        }
      } else {
        api.buscarSolicitacao(protUpper).then(res => {
          const dataObj = (res.data || res) as Solicitacao;
          if (dataObj && dataObj.protocolo) {
            handleSelectSolicitacao(dataObj);
          }
        }).catch(() => {});
      }
    }
  }, [location.state, searchParams, data.length]);

  const isPrevisaoVencida = (sol: Solicitacao) => {
    if (!sol.previsaoChegada) return false;
    const status = sol.statusCompra || 'AGUARDANDO COMPRA';
    if (status === 'ENTREGUE' || status === 'CANCELADA' || sol.situacao === 'ENTREGUE') return false;

    // Comparar data de previsão com hoje (yyyy-mm-dd)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Tenta interpretar a data da previsão
    const prevDate = new Date(sol.previsaoChegada);
    if (isNaN(prevDate.getTime())) return false;
    prevDate.setHours(0, 0, 0, 0);

    return prevDate < hoje;
  };

  const formatDateForInput = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const parts = str.split(' ')[0].split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  const handleSelectSolicitacao = async (s: Solicitacao) => {
    setIsEditing(false);
    setSelected(s);
    setEditForm(s);
    try {
      const res = await api.buscarSolicitacao(s.protocolo);
      const dataObj = (res.data || res) as Solicitacao;
      if (res.success || res.sucesso || dataObj.protocolo) {
        const fullItem: Solicitacao = {
          ...s,
          ...dataObj,
          precisaLiberacaoShe: dataObj.precisaLiberacaoShe || (dataObj as any).precisaLiberacao || s.precisaLiberacaoShe || 'NÃO',
          dataPedido: dataObj.dataHora || dataObj.dataPedido || s.dataPedido,
          statusCompra: dataObj.statusCompra || s.statusCompra || 'AGUARDANDO COMPRA',
          responsavelCompra: dataObj.responsavelCompra !== undefined ? dataObj.responsavelCompra : s.responsavelCompra,
          dataCompra: dataObj.dataCompra !== undefined ? dataObj.dataCompra : s.dataCompra,
          previsaoChegada: dataObj.previsaoChegada !== undefined ? dataObj.previsaoChegada : s.previsaoChegada
        };
        setSelected(fullItem);
        setEditForm(fullItem);
      }
    } catch (e) {
      // Keep summary item if fetch fails
    }
  };

  const handleMarcarWhatsAppEnviado = async (protocolo: string, enviado: 'SIM' | 'NÃO') => {
    if (enviado === 'SIM') {
      const currentSolicitacao = data.find(s => s.protocolo === protocolo);
      const isAlreadySent = String(currentSolicitacao?.whatsappEnviado || '').trim().toUpperCase() === 'SIM';
      
      if (isAlreadySent) {
        console.warn('WhatsApp já foi enviado para esta solicitação.');
        return;
      }
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.marcarWhatsAppEnviado(protocolo, enviado);
      if (res.success || res.sucesso) {
        const resDetail = await api.buscarSolicitacao(protocolo);
        if (resDetail.success || resDetail.sucesso) {
            setSelected({ ...selected!, ...resDetail });
            setEditForm({ ...selected!, ...resDetail });
        }
        await fetchSolicitacoes();
      } else {
        setActionError(res.error || res.mensagem || 'Não foi possível marcar como enviado.');
      }
    } catch (err) {
      setActionError('Não foi possível marcar como enviado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarcarEntregue = async (protocolo: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.marcarComoEntregue(protocolo);
      if (res.success || res.sucesso) {
        await api.atualizarControleCompra(protocolo, { statusCompra: 'ENTREGUE' });
        await fetchSolicitacoes();
        setSelected(null);
      } else {
        setActionError(res.error || res.mensagem || 'Erro ao marcar como entregue.');
      }
    } catch (err) {
      setActionError('Erro de conexão ao marcar como entregue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarcarPendente = async (protocolo: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.atualizarSolicitacao(protocolo, { situacao: 'PENDENTE' });
      if (res.success || res.sucesso) {
        const nextStatus = selected?.dataCompra ? 'COMPRA REALIZADA' : 'AGUARDANDO COMPRA';
        await api.atualizarControleCompra(protocolo, { statusCompra: nextStatus });
        await fetchSolicitacoes();
        setSelected(null);
      } else {
        setActionError(res.error || res.mensagem || 'Erro ao marcar como pendente.');
      }
    } catch (err) {
      setActionError('Erro de conexão ao marcar como pendente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExcluir = async (protocolo: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.excluirSolicitacao(protocolo);
      if (res.success || res.sucesso) {
        await fetchSolicitacoes();
        setSelected(null);
      } else {
        setActionError(res.error || res.mensagem || 'Erro ao excluir solicitação.');
      }
    } catch (err) {
      setActionError('Erro de conexão ao excluir.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDataCompraChange = (val: string) => {
    let nextStatus = editForm.statusCompra || 'AGUARDANDO COMPRA';
    if (val && nextStatus === 'AGUARDANDO COMPRA') {
      nextStatus = 'COMPRA REALIZADA';
    }
    if (val && editForm.previsaoChegada) {
      nextStatus = 'AGUARDANDO ENTREGA';
    }
    setEditForm({
      ...editForm,
      dataCompra: val,
      statusCompra: nextStatus
    });
  };

  const handlePrevisaoChegadaChange = (val: string) => {
    let nextStatus = editForm.statusCompra || 'AGUARDANDO COMPRA';
    if (val && editForm.dataCompra) {
      nextStatus = 'AGUARDANDO ENTREGA';
    }
    setEditForm({
      ...editForm,
      previsaoChegada: val,
      statusCompra: nextStatus
    });
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      // 1. Atualizar dados gerais da solicitação (Colunas A:P)
      const resGeneral = await api.atualizarSolicitacao(selected.protocolo, editForm);
      if (!resGeneral.success && !resGeneral.sucesso) {
        setActionError(resGeneral.error || resGeneral.mensagem || 'Erro ao atualizar solicitação.');
        return;
      }

      // 2. Atualizar controle de compra (Colunas Q:T)
      const resControle = await api.atualizarControleCompra(selected.protocolo, {
        responsavelCompra: editForm.responsavelCompra !== undefined ? editForm.responsavelCompra : '',
        dataCompra: editForm.dataCompra !== undefined ? editForm.dataCompra : '',
        previsaoChegada: editForm.previsaoChegada !== undefined ? editForm.previsaoChegada : '',
        statusCompra: editForm.statusCompra || 'AGUARDANDO COMPRA'
      });

      if (!resControle.success && !resControle.sucesso) {
        setActionError(resControle.error || resControle.mensagem || 'Erro ao atualizar controle de compra.');
        return;
      }

      // 3. Buscar dados atualizados do backend para persistência visual
      const resFresh = await api.buscarSolicitacao(selected.protocolo);
      const dataObj = (resFresh.data || resFresh) as Solicitacao;
      if (resFresh.success || resFresh.sucesso || dataObj.protocolo) {
        const fullItem: Solicitacao = {
          ...selected,
          ...dataObj,
          precisaLiberacaoShe: dataObj.precisaLiberacaoShe || (dataObj as any).precisaLiberacao || selected.precisaLiberacaoShe || 'NÃO',
          dataPedido: dataObj.dataHora || dataObj.dataPedido || selected.dataPedido,
          statusCompra: dataObj.statusCompra || selected.statusCompra || 'AGUARDANDO COMPRA',
          responsavelCompra: dataObj.responsavelCompra !== undefined ? dataObj.responsavelCompra : '',
          dataCompra: dataObj.dataCompra !== undefined ? dataObj.dataCompra : '',
          previsaoChegada: dataObj.previsaoChegada !== undefined ? dataObj.previsaoChegada : ''
        };
        setSelected(fullItem);
        setEditForm(fullItem);
      }

      // 4. Recarregar lista do grid
      await fetchSolicitacoes();
      setIsEditing(false);
    } catch (err: any) {
      setActionError('Erro de conexão ao atualizar: ' + (err.message || ''));
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering & Sorting
  const filteredUnsorted = data.filter(s => {
    const matchSearch = 
      s.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
      s.material?.toLowerCase().includes(search.toLowerCase()) ||
      s.solicitante?.toLowerCase().includes(search.toLowerCase()) ||
      s.responsavelCompra?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filter === 'PENDENTES') return s.situacao === 'PENDENTE';
    if (filter === 'ENTREGUES') return s.situacao === 'ENTREGUE';
    if (filter === 'URGENTES') return s.prioridade === 'URGENTE';
    if (filter === 'ALTA') return s.prioridade === 'ALTA';
    if (filter === 'COMPRA_VENCIDA') return isPrevisaoVencida(s);
    return true;
  });

  const filtered = ordenarSolicitacoes(filteredUnsorted);

  const getBadgeStatusCompra = (status?: StatusCompra) => {
    switch (status) {
      case 'COMPRA REALIZADA':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Compra Realizada</span>;
      case 'AGUARDANDO ENTREGA':
        return <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Aguardando Entrega</span>;
      case 'ENTREGUE':
        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Entregue</span>;
      case 'CANCELADA':
        return <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Cancelada</span>;
      case 'AGUARDANDO COMPRA':
      default:
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Aguardando Compra</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Carregando solicitações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Erro ao carregar dados</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={fetchSolicitacoes} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Consultar Solicitações</h2>
          <p className="text-slate-500 text-sm">Gerencie o andamento dos pedidos e controle de compras</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/nova')} 
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 font-medium shadow-sm"
          >
            <PlusCircle size={16} /> Nova Solicitação
          </button>
          <button 
            onClick={fetchSolicitacoes} 
            className="text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-slate-600 transition-colors"
          >
            Atualizar lista
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por protocolo, material, solicitante ou comprador..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={16} className="text-slate-400 shrink-0 ml-1" />
          {(['TODAS', 'PENDENTES', 'ENTREGUES', 'URGENTES', 'ALTA', 'COMPRA_VENCIDA'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f === 'COMPRA_VENCIDA' ? '⚠️ Previsão Vencida' : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500">Nenhuma solicitação encontrada.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const vencida = isPrevisaoVencida(s);
            const statusComp = s.statusCompra || 'AGUARDANDO COMPRA';

            return (
              <div key={s.protocolo}>
                <Card 
                  className={`hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between h-full relative ${vencida ? 'border-red-300 bg-red-50/20' : ''}`}
                  onClick={() => handleSelectSolicitacao(s)}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-blue-600 text-sm">{s.protocolo}</span>
                      <div className="flex gap-1.5 items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.situacao}
                        </span>
                        {getBadgeStatusCompra(statusComp)}
                      </div>
                    </div>

                    {vencida && (
                      <div className="mb-2 p-1.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-red-600 shrink-0" /> ⚠️ Previsão de Chegada Vencida!
                      </div>
                    )}
                    
                    <h3 className="font-bold text-slate-800 text-base mb-2">{s.material}</h3>
                    
                    <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Solicitante:</span>
                        <span className="font-medium text-slate-800">{s.solicitante}</span>
                      </div>
                      {s.quantidade && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Quantidade:</span>
                          <span className="font-medium text-slate-800">{s.quantidade}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Responsável Compra:</span>
                        <span className="font-semibold text-blue-700">{s.responsavelCompra || 'Pendente'}</span>
                      </div>
                      {s.dataCompra && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Data Compra:</span>
                          <span className="font-medium text-slate-800">{s.dataCompra}</span>
                        </div>
                      )}
                      {s.previsaoChegada && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Previsão Chegada:</span>
                          <span className={`font-semibold ${vencida ? 'text-red-600' : 'text-slate-800'}`}>{s.previsaoChegada}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end items-center text-xs text-slate-500 mt-3">
                    <span className="text-blue-600 font-medium hover:underline">Ver detalhes e controle →</span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Details / Edit Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono font-bold text-blue-600 text-lg">{selected.protocolo}</span>
                <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${selected.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selected.situacao}
                </span>
                <span className="ml-2">
                  {getBadgeStatusCompra(selected.statusCompra || 'AGUARDANDO COMPRA')}
                </span>
              </div>
              <button 
                onClick={() => { setSelected(null); setIsEditing(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {isPrevisaoVencida(selected) && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle size={18} className="text-red-600" />
                ⚠️ ATENÇÃO: A PREVISÃO DE CHEGADA DESTE PEDIDO ESTÁ VENCIDA!
              </div>
            )}

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {actionError}
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Material</span>
                    <span className="font-bold text-slate-800">{selected.material}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Quantidade</span>
                    <span className="font-medium text-slate-800">{selected.quantidade}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Solicitante</span>
                    <span className="font-medium text-slate-800">{selected.solicitante} ({selected.email || 'Sem e-mail'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Prioridade</span>
                    <span className="font-medium text-slate-800">{selected.prioridade}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Onde será utilizado</span>
                    <span className="font-medium text-slate-800">{selected.onde}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Precisa Liberação SHE?</span>
                    <span className="font-medium text-slate-800">{selected.precisaLiberacaoShe}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs">Para que será utilizado</span>
                    <span className="font-medium text-slate-800">{selected.paraQue}</span>
                  </div>
                  {selected.observacoes && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-xs">Observações</span>
                      <span className="font-medium text-slate-800">{selected.observacoes}</span>
                    </div>
                  )}
                </div>

                {/* Bloco Destaque: CONTROLE DA COMPRA */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 text-blue-800">
                    <ShoppingBag size={16} /> CONTROLE DA COMPRA
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Responsável pela Compra:</span>
                      <span className="font-bold text-slate-800">{selected.responsavelCompra || 'Não definido'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status da Compra:</span>
                      <span className="font-bold text-slate-800">{selected.statusCompra || 'AGUARDANDO COMPRA'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Data da Compra:</span>
                      <span className="font-medium text-slate-800">{selected.dataCompra || 'Não realizada'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Previsão de Chegada:</span>
                      <span className="font-medium text-slate-800">{selected.previsaoChegada || 'Não definida'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex gap-2 flex-col w-full">
                    <div className="flex flex-wrap gap-2">
                      {selected.situacao === 'PENDENTE' ? (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleMarcarEntregue(selected.protocolo)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} /> ✓ MARCAR COMO ENTREGUE
                        </button>
                      ) : (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleMarcarPendente(selected.protocolo)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={16} /> ↩ MARCAR COMO PENDENTE
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 size={16} /> Editar Solicitação & Controle de Compra
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                      {String(selected.whatsappEnviado || '').trim().toUpperCase() === 'SIM' ? (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleMarcarWhatsAppEnviado(selected.protocolo, 'NÃO')}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          🟢 WhatsApp enviado ↩ Desmarcar enviado
                        </button>
                      ) : (
                        <button
                          disabled={actionLoading || String(selected.whatsappEnviado || '').trim().toUpperCase() === 'SIM'}
                          onClick={() => handleMarcarWhatsAppEnviado(selected.protocolo, 'SIM')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          ⚪ WhatsApp não enviado ✓ Marcar como enviado
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleExcluir(selected.protocolo)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors mt-2"
                  >
                    <Trash2 size={16} /> 🗑️ Excluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Dados da Solicitação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Solicitante</label>
                    <input
                      type="text"
                      value={editForm.solicitante || ''}
                      onChange={e => setEditForm({ ...editForm, solicitante: e.target.value })}
                      className="w-full p-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={editForm.material || ''}
                      onChange={e => setEditForm({ ...editForm, material: e.target.value })}
                      className="w-full p-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade</label>
                    <input
                      type="number"
                      value={editForm.quantidade || 1}
                      onChange={e => setEditForm({ ...editForm, quantidade: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Prioridade</label>
                    <select
                      value={editForm.prioridade || 'NORMAL'}
                      onChange={e => setEditForm({ ...editForm, prioridade: e.target.value as any })}
                      className="w-full p-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="BAIXA">BAIXA</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="ALTA">ALTA</option>
                      <option value="URGENTE">URGENTE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Situação do Pedido</label>
                    <select
                      value={editForm.situacao || 'PENDENTE'}
                      onChange={e => {
                        const sit = e.target.value as any;
                        let newStatus = editForm.statusCompra;
                        if (sit === 'ENTREGUE') {
                          newStatus = 'ENTREGUE';
                        } else if (sit === 'PENDENTE' && editForm.statusCompra === 'ENTREGUE') {
                          newStatus = editForm.dataCompra ? 'COMPRA REALIZADA' : 'AGUARDANDO COMPRA';
                        }
                        setEditForm({ ...editForm, situacao: sit, statusCompra: newStatus });
                      }}
                      className="w-full p-2 border rounded-lg text-sm bg-white font-medium"
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="ENTREGUE">ENTREGUE</option>
                    </select>
                  </div>
                </div>

                {/* SEÇÃO CONTROLE DA COMPRA NO FORMULÁRIO */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 text-blue-800">
                    <ShoppingBag size={16} /> CONTROLE DA COMPRA
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Responsável pela Compra *
                      </label>
                      <select
                        value={editForm.responsavelCompra || ''}
                        onChange={e => setEditForm({ ...editForm, responsavelCompra: e.target.value })}
                        disabled={!isAdmin}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium disabled:bg-slate-100"
                      >
                        <option value="">Selecione um responsável ativo...</option>
                        {usuariosAtivos.map((u, idx) => (
                          <option key={idx} value={u.nome}>{u.nome} ({u.usuario})</option>
                        ))}
                      </select>
                      {!isAdmin && (
                        <span className="text-[10px] text-slate-500">Apenas perfis ADM podem alterar o responsável.</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Compra</label>
                      <select
                        value={editForm.statusCompra || 'AGUARDANDO COMPRA'}
                        onChange={e => setEditForm({ ...editForm, statusCompra: e.target.value as StatusCompra })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-800"
                      >
                        <option value="AGUARDANDO COMPRA">AGUARDANDO COMPRA</option>
                        <option value="COMPRA REALIZADA">COMPRA REALIZADA</option>
                        <option value="AGUARDANDO ENTREGA">AGUARDANDO ENTREGA</option>
                        <option value="ENTREGUE">ENTREGUE</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Compra</label>
                      <input
                        type="date"
                        value={formatDateForInput(editForm.dataCompra)}
                        onChange={e => handleDataCompraChange(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Previsão de Chegada</label>
                      <input
                        type="date"
                        value={formatDateForInput(editForm.previsaoChegada)}
                        onChange={e => handlePrevisaoChegadaChange(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

