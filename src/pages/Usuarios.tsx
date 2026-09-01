import { useEffect, useState, FormEvent } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Usuario } from '../types/solicitacao';
import { Users, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listarUsuarios();
      if (res.success) {
        setUsuarios(res.data || []);
      } else {
        setError(res.error || 'Não foi possível listar os usuários.');
      }
    } catch (err) {
      setError('Erro de conexão ao listar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome || !email) return;

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      const res = await api.cadastrarUsuario({ nome, email });
      if (res.success) {
        setSuccessMsg('Usuário cadastrado com sucesso!');
        setNome('');
        setEmail('');
        await fetchUsuarios();
      } else {
        setSubmitError(res.error || 'Erro ao cadastrar usuário.');
      }
    } catch (err) {
      setSubmitError('Erro de conexão ao cadastrar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Erro ao carregar usuários</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={fetchUsuarios} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Usuários</h2>
          <p className="text-slate-500 text-sm">Gerencie os solicitantes autorizados no sistema</p>
        </div>
        <button 
          onClick={fetchUsuarios} 
          className="text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600 transition-colors"
        >
          Atualizar lista
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1">
          <Card>
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Novo Usuário
            </h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="joao.silva@empresa.com"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
              </button>
            </form>
          </Card>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <Card>
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Users size={18} className="text-slate-600" /> Usuários Cadastrados ({usuarios.length})
            </h3>

            {usuarios.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {usuarios.map((u, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{u.nome}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

