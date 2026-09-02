import { useEffect, useState, FormEvent } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Solicitacao } from '../types/solicitacao';
import { Search, Filter, CheckCircle2, Trash2, Edit3, X, AlertTriangle, Calendar, User, MapPin } from 'lucide-react';

export default function Solicitacoes() {
  const [data, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTES' | 'ENTREGUES' | 'URGENTES' | 'ALTA'>('TODAS');

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
      const response = await api.listarSolicitacoes();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Não foi possível carregar as solicitações.');
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

  const handleSelectSolicitacao = async (s: Solicitacao) => {
    setIsEditing(false);
    setSelected(s);
    setEditForm(s);
    try {
      const res = await api.buscarSolicitacao(s.protocolo);
      if (res.success || res.sucesso) {
        const fullItem = {
          ...s,
          ...res,
          precisaLiberacaoShe: res.precisaLiberacaoShe || res.precisaLiberacao || s.precisaLiberacaoShe || 'NÃO',
          dataPedido: res.dataHora || res.dataPedido || s.dataPedido
        };
        setSelected(fullItem);
        setEditForm(fullItem);
      }
    } catch (e) {
      // Keep summary item if fetch fails
    }
  };

  const handleMarcarWhatsAppEnviado = async (protocolo: string, enviado: 'SIM' | 'NÃO') => {
    // Robust validation for already sent status
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
        // Reload details to get updated whatsappEnviado
        const resDetail = await api.buscarSolicitacao(protocolo);
        if (resDetail.success || resDetail.sucesso) {
            setSelected({ ...selected!, ...resDetail });
            setEditForm({ ...selected!, ...resDetail });
        }
        await fetchSolicitacoes();
      } else {
        setActionError(res.error || res.mensagem || 'Não foi possível marcar como enviado. Tente novamente.');
      }
    } catch (err) {
      setActionError('Não foi possível marcar como enviado. Tente novamente.');
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

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.atualizarSolicitacao(selected.protocolo, editForm);
      if (res.success) {
        await fetchSolicitacoes();
        setIsEditing(false);
        setSelected(null);
      } else {
        setActionError(res.error || 'Erro ao atualizar solicitação.');
      }
    } catch (err) {
      setActionError('Erro de conexão ao atualizar.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering & Sorting
  const priorityWeight: Record<string, number> = { URGENTE: 4, ALTA: 3, NORMAL: 2, BAIXA: 1 };

  const filtered = data.filter(s => {
    const matchSearch = 
      s.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
      s.material?.toLowerCase().includes(search.toLowerCase()) ||
      s.solicitante?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filter === 'PENDENTES') return s.situacao === 'PENDENTE';
    if (filter === 'ENTREGUES') return s.situacao === 'ENTREGUE';
    if (filter === 'URGENTES') return s.prioridade === 'URGENTE';
    if (filter === 'ALTA') return s.prioridade === 'ALTA';
    return true;
  }).sort((a, b) => {
    const pA = priorityWeight[a.prioridade] || 0;
    const pB = priorityWeight[b.prioridade] || 0;
    if (pA !== pB) return pB - pA; // Higher priority first
    return new Date(a.dataPedido).getTime() - new Date(b.dataPedido).getTime(); // Oldest first
  });

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
          <p className="text-slate-500 text-sm">Gerencie e acompanhe o status dos pedidos</p>
        </div>
        <button 
          onClick={fetchSolicitacoes} 
          className="text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600 transition-colors"
        >
          Atualizar lista
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por protocolo, material ou solicitante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-slate-400 shrink-0 ml-1" />
          {(['TODAS', 'PENDENTES', 'ENTREGUES', 'URGENTES', 'ALTA'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f}
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
            const badgePrioridade = 
              s.prioridade === 'URGENTE' ? 'bg-red-100 text-red-700 border-red-200' :
              s.prioridade === 'ALTA' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              s.prioridade === 'NORMAL' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200';

            const badgeSituacao = s.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';

            return (
              <div key={s.protocolo}>
                <Card 
                  className="hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between h-full"
                  onClick={() => handleSelectSolicitacao(s)}
                >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-blue-600 text-sm">{s.protocolo}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.situacao === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.situacao}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-base mb-3">{s.material}</h3>
                  
                  <div className="text-xs text-slate-600 space-y-1.5">
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
                      <span className="text-slate-500">Data do pedido:</span>
                      <span className="font-medium text-slate-800">{s.dataHora}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end items-center text-xs text-slate-500 mt-3">
                  <span className="text-blue-600 font-medium hover:underline">Ver detalhes →</span>
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
              </div>
              <button 
                onClick={() => { setSelected(null); setIsEditing(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {actionError}
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {Object.entries(selected).map(([key, value]) => {
                    if (['protocolo', 'situacao', 'success', 'sucesso', 'encontrado', 'protocolo'].includes(key) || value === undefined || value === null || value === '') return null;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className={key === 'observacoes' || key === 'paraQue' ? 'sm:col-span-2' : ''}>
                        <span className="text-slate-400 block text-xs capitalize">{label}</span>
                        <span className="font-medium text-slate-800">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex gap-2 flex-col w-full">
                    <div className="flex flex-wrap gap-2">
                        {selected.situacao === 'PENDENTE' && (
                        <button
                            disabled={actionLoading}
                            onClick={() => handleMarcarEntregue(selected.protocolo)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle2 size={16} /> ✓ MARCAR COMO ENTREGUE
                        </button>
                        )}
                        <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                        >
                        <Edit3 size={16} /> Editar
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">Onde será utilizado</label>
                    <input
                      type="text"
                      value={editForm.onde || ''}
                      onChange={e => setEditForm({ ...editForm, onde: e.target.value })}
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Para que será utilizado</label>
                    <textarea
                      rows={2}
                      value={editForm.paraQue || ''}
                      onChange={e => setEditForm({ ...editForm, paraQue: e.target.value })}
                      className="w-full p-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Precisa liberação SHE?</label>
                    <select
                      value={editForm.precisaLiberacaoShe || 'NÃO'}
                      onChange={e => setEditForm({ ...editForm, precisaLiberacaoShe: e.target.value as any })}
                      className="w-full p-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="NÃO">NÃO</option>
                      <option value="SIM">SIM</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
                    <textarea
                      rows={2}
                      value={editForm.observacoes || ''}
                      onChange={e => setEditForm({ ...editForm, observacoes: e.target.value })}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
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

