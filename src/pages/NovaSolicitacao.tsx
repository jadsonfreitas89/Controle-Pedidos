import { useEffect, useState, FormEvent } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Item, Usuario } from '../types/solicitacao';
import { CheckCircle2, AlertCircle, Plus, Search, BookOpen, X } from 'lucide-react';

export default function NovaSolicitacao() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [errorMetadata, setErrorMetadata] = useState<string | null>(null);

  const [solicitante, setSolicitante] = useState('');
  const [email, setEmail] = useState('');
  const [material, setMaterial] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [onde, setOnde] = useState('');
  const [paraQue, setParaQue] = useState('');
  const [prioridade, setPrioridade] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [precisaLiberacaoShe, setPrecisaLiberacaoShe] = useState<'SIM' | 'NÃO'>('NÃO');
  const [observacoes, setObservacoes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successProtocolo, setSuccessProtocolo] = useState<string | null>(null);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

  // States for material search & suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTipoFilter, setCatalogTipoFilter] = useState<string>('TODOS');

  // New Item Modal/Inline state
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTipo, setNewItemTipo] = useState<'MATERIAL' | 'FERRAMENTA' | 'EQUIPAMENTO' | 'OUTROS'>('MATERIAL');
  const [newItemUnidade, setNewItemUnidade] = useState<'UN' | 'M' | 'KG' | 'L' | 'CX' | 'PC' | 'KIT'>('UN');
  const [savingItem, setSavingItem] = useState(false);

  const normalizeText = (str: string) =>
    str
      ? str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      : '';

  const materialSearchTerm = normalizeText(material);

  const matchingSuggestions = materialSearchTerm.length > 0
    ? itens.filter(i => {
        const nameNorm = normalizeText(i.item);
        const tipoNorm = normalizeText(i.tipo || '');
        return nameNorm.includes(materialSearchTerm) || tipoNorm.includes(materialSearchTerm);
      }).slice(0, 8)
    : [];

  const filteredCatalogItems = itens.filter(i => {
    const matchTipo = catalogTipoFilter === 'TODOS' || i.tipo === catalogTipoFilter;
    const matchSearch = !catalogSearch || 
      normalizeText(i.item).includes(normalizeText(catalogSearch)) ||
      normalizeText(i.tipo || '').includes(normalizeText(catalogSearch));
    return matchTipo && matchSearch;
  });

  const loadMetadata = async () => {
    setLoadingMetadata(true);
    setErrorMetadata(null);
    try {
      const [resUsuarios, resItens] = await Promise.all([
        api.listarUsuarios(),
        api.listarItens()
      ]);

      if (resUsuarios.success) {
        setUsuarios(resUsuarios.data || []);
      }
      if (resItens.success) {
        setItens(resItens.data || []);
      }
    } catch (err) {
      setErrorMetadata('Erro ao carregar dados de usuários e itens.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  const handleSolicitanteChange = (nome: string) => {
    setSolicitante(nome);
    const user = usuarios.find(u => u.nome === nome);
    if (user) {
      setEmail(user.email || '');
    } else {
      setEmail('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!solicitante || !material || !quantidade || !onde || !paraQue) {
      setErrorSubmit('Preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setErrorSubmit(null);
    setSuccessProtocolo(null);

    try {
      const response = await api.criarSolicitacao({
        solicitante,
        email,
        material,
        quantidade: Number(quantidade),
        onde,
        paraQue,
        prioridade,
        precisaLiberacaoShe,
        observacoes,
        situacao: 'PENDENTE',
        dataEntrega: null,
        whatsappEnviado: 'NÃO',
        statusCompra: 'AGUARDANDO COMPRA',
        responsavelCompra: '',
        dataCompra: '',
        previsaoChegada: ''
      });

      if (response.success) {
        setSuccessProtocolo(response.protocolo || 'Registrado com sucesso!');
        // Reset form
        setSolicitante('');
        setEmail('');
        setMaterial('');
        setQuantidade(1);
        setOnde('');
        setParaQue('');
        setPrioridade('NORMAL');
        setPrecisaLiberacaoShe('NÃO');
        setObservacoes('');
      } else {
        setErrorSubmit(response.error || 'Erro ao registrar solicitação.');
      }
    } catch (err) {
      setErrorSubmit('Não foi possível conectar ao servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    setSavingItem(true);
    try {
      const res = await api.cadastrarItem({
        item: newItemName,
        tipo: newItemTipo,
        unidade: newItemUnidade
      });
      if (res.success) {
        setItens([...itens, { item: newItemName, tipo: newItemTipo, unidade: newItemUnidade }]);
        setMaterial(newItemName);
        setShowNewItem(false);
        setNewItemName('');
      } else {
        alert(res.error || 'Erro ao cadastrar item.');
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor.');
    } finally {
      setSavingItem(false);
    }
  };

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Carregando formulário...</p>
      </div>
    );
  }

  if (errorMetadata) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Erro ao carregar dados</h3>
        <p className="text-red-600 text-sm mb-4">{errorMetadata}</p>
        <button onClick={loadMetadata} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Nova Solicitação</h2>

      {successProtocolo && (
        <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-emerald-800">Solicitação Registrada com Sucesso!</h3>
            <p className="text-emerald-700 text-sm mt-1">
              O protocolo gerado é: <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">{successProtocolo}</strong>
            </p>
            <button
              onClick={() => setSuccessProtocolo(null)}
              className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Criar outra solicitação
            </button>
          </div>
        </div>
      )}

      {errorSubmit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errorSubmit}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Solicitante *</label>
              <select
                value={solicitante}
                onChange={e => handleSolicitanteChange(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Selecione o solicitante...</option>
                {usuarios.map((u, idx) => (
                  <option key={idx} value={u.nome}>{u.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                readOnly
                placeholder="Preenchimento automático"
                className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <div className="flex flex-wrap justify-between items-center mb-1 gap-2">
                <label className="block text-sm font-medium text-slate-700">
                  Item / Material / Ferramenta / Equipamento *
                </label>
                <div className="flex items-center gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogTipoFilter('TODOS');
                      setShowCatalogModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    <BookOpen size={14} /> Selecionar do catálogo
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setShowNewItem(!showNewItem)}
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus size={14} /> Cadastrar novo item
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={material}
                    onChange={e => {
                      setMaterial(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Digite o nome do item / material / ferramenta..."
                    required
                    className="w-full p-2.5 pl-9 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 placeholder:text-slate-400 text-sm"
                  />
                  <Search size={18} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  {material && (
                    <button
                      type="button"
                      onClick={() => {
                        setMaterial('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      title="Limpar texto"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Dropdown de Sugestões */}
                {showSuggestions && material.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Sugestões ({matchingSuggestions.length})</span>
                      <span className="normal-case text-slate-400 font-normal">Clique para selecionar</span>
                    </div>

                    {matchingSuggestions.length > 0 ? (
                      matchingSuggestions.map((itemObj, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setMaterial(itemObj.item);
                            setShowSuggestions(false);
                          }}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <span className="font-medium text-slate-800 text-sm group-hover:text-blue-700 block">
                              {itemObj.item}
                            </span>
                            <span className="text-xs text-slate-400">
                              Unidade: {itemObj.unidade || 'UN'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            itemObj.tipo === 'FERRAMENTA'
                              ? 'bg-purple-100 text-purple-700'
                              : itemObj.tipo === 'EQUIPAMENTO'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {itemObj.tipo || 'MATERIAL'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        Nenhum item cadastrado com "<strong className="text-slate-700">{material}</strong>".
                        <br />
                        <span className="text-slate-400 text-[11px]">Você pode continuar digitando este texto normalmente.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(Number(e.target.value))}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {showNewItem && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">Cadastrar Novo Item Rapidamente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nome do Item"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="p-2 border rounded-lg text-sm bg-white"
                />
                <select
                  value={newItemTipo}
                  onChange={e => setNewItemTipo(e.target.value as any)}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="FERRAMENTA">FERRAMENTA</option>
                  <option value="EQUIPAMENTO">EQUIPAMENTO</option>
                  <option value="OUTROS">OUTROS</option>
                </select>
                <select
                  value={newItemUnidade}
                  onChange={e => setNewItemUnidade(e.target.value as any)}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="UN">UN</option>
                  <option value="M">M</option>
                  <option value="KG">KG</option>
                  <option value="L">L</option>
                  <option value="CX">CX</option>
                  <option value="PC">PC</option>
                  <option value="KIT">KIT</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewItem(false)}
                  className="px-3 py-1.5 text-xs border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingItem}
                  onClick={handleCreateItem}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingItem ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Onde será utilizado *</label>
              <input
                type="text"
                value={onde}
                onChange={e => setOnde(e.target.value)}
                placeholder="Ex: Obra Setor B"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precisa de liberação SHE? *</label>
              <select
                value={precisaLiberacaoShe}
                onChange={e => setPrecisaLiberacaoShe(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="NÃO">NÃO</option>
                <option value="SIM">SIM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Para que será utilizado *</label>
            <textarea
              rows={2}
              value={paraQue}
              onChange={e => setParaQue(e.target.value)}
              placeholder="Descreva a finalidade..."
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade *</label>
            <select
              value={prioridade}
              onChange={e => setPrioridade(e.target.value as any)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="BAIXA">BAIXA</option>
              <option value="NORMAL">NORMAL</option>
              <option value="ALTA">ALTA</option>
              <option value="URGENTE">URGENTE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Observações adicionais (opcional)..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Registrando solicitação...' : 'REGISTRAR SOLICITAÇÃO'}
            </button>
          </div>
        </form>
      </Card>

      {/* Modal de Catálogo Completo */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Catálogo de Itens Cadastrados</h3>
                <p className="text-xs text-slate-500">Selecione um item cadastrado para preencher a solicitação</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Buscar no catálogo..."
                  className="w-full p-2.5 pl-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <Search size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {['TODOS', 'MATERIAL', 'FERRAMENTA', 'EQUIPAMENTO', 'OUTROS'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setCatalogTipoFilter(tipo)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      catalogTipoFilter === tipo
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredCatalogItems.length > 0 ? (
                filteredCatalogItems.map((itemObj, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{itemObj.item}</h4>
                      <div className="flex gap-2 items-center text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">Tipo: {itemObj.tipo || 'MATERIAL'}</span>
                        <span>•</span>
                        <span>Unidade: {itemObj.unidade || 'UN'}</span>
                        {itemObj.observacoes && <span>• {itemObj.observacoes}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMaterial(itemObj.item);
                        setShowCatalogModal(false);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-medium text-xs rounded-lg transition-colors shrink-0"
                    >
                      Selecionar
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Nenhum item encontrado no catálogo com esses filtros.
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 text-sm hover:bg-slate-100 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

