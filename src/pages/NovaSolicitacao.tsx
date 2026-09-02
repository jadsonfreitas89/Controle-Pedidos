import { useEffect, useState, FormEvent } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Item, Usuario } from '../types/solicitacao';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

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

  // New Item Modal/Inline state
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTipo, setNewItemTipo] = useState<'MATERIAL' | 'FERRAMENTA' | 'EQUIPAMENTO' | 'OUTROS'>('MATERIAL');
  const [newItemUnidade, setNewItemUnidade] = useState<'UN' | 'M' | 'KG' | 'L' | 'CX' | 'PC' | 'KIT'>('UN');
  const [savingItem, setSavingItem] = useState(false);

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
        whatsappEnviado: 'NÃO'
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Material / Ferramenta *</label>
                <button
                  type="button"
                  onClick={() => setShowNewItem(!showNewItem)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus size={14} /> Cadastrar novo item
                </button>
              </div>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">Selecione o material...</option>
                {itens.map((i, idx) => (
                  <option key={idx} value={i.item}>{i.item} ({i.tipo} - {i.unidade})</option>
                ))}
              </select>
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
    </div>
  );
}

