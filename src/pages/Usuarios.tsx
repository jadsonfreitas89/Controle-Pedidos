import { useEffect, useState, FormEvent } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Usuario, PerfilUsuario } from '../types/solicitacao';
import { Users, Plus, AlertTriangle, CheckCircle2, Shield, Lock, Edit2, Power, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { currentUser, isAdmin, refreshUsersList } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [usuario, setUsuario] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('USUARIO');
  const [ativo, setAtivo] = useState<'SIM' | 'NÃO'>('SIM');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete modal states
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const resetForm = () => {
    setEditingUser(null);
    setUsuario('');
    setNome('');
    setEmail('');
    setSenha('');
    setPerfil('USUARIO');
    setAtivo('SIM');
  };

  const handleStartEdit = (u: Usuario) => {
    setEditingUser(u);
    setUsuario(u.usuario || '');
    setNome(u.nome || '');
    setEmail(u.email || '');
    setSenha('');
    setPerfil(u.perfil || 'USUARIO');
    setAtivo(u.ativo === 'NÃO' || u.ativo === false ? 'NÃO' : 'SIM');
    setSubmitError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setSubmitError('Apenas administradores podem cadastrar/editar usuários.');
      return;
    }

    if (!usuario || !nome) {
      setSubmitError('Login e Nome são obrigatórios.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      if (editingUser) {
        // Atualizar
        const res = await api.atualizarUsuario(editingUser.usuario, {
          usuario,
          nome,
          email,
          senha: senha || undefined,
          perfil,
          ativo
        });
        if (res.success) {
          setSuccessMsg('Usuário atualizado com sucesso!');
          resetForm();
          await fetchUsuarios();
          await refreshUsersList();
        } else {
          setSubmitError(res.error || 'Erro ao atualizar usuário.');
        }
      } else {
        // Cadastrar
        const res = await api.cadastrarUsuario({
          usuario,
          nome,
          email,
          senha: senha || '',
          perfil,
          ativo
        });
        if (res.success) {
          setSuccessMsg('Usuário cadastrado com sucesso!');
          resetForm();
          await fetchUsuarios();
          await refreshUsersList();
        } else {
          setSubmitError(res.error || 'Erro ao cadastrar usuário.');
        }
      }
    } catch (err) {
      setSubmitError('Erro de conexão ao salvar usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (u: Usuario) => {
    if (!isAdmin) return;
    const novoStatus = (u.ativo === 'SIM' || u.ativo === true) ? 'NÃO' : 'SIM';
    try {
      const res = await api.alterarStatusUsuario(u.usuario, novoStatus);
      if (res.success) {
        await fetchUsuarios();
        await refreshUsersList();
      } else {
        alert(res.error || 'Erro ao alterar status do usuário.');
      }
    } catch (e) {
      alert('Erro ao alterar status do usuário.');
    }
  };

  const handleOpenDeleteModal = (u: Usuario) => {
    if (!isAdmin) return;
    setUsuarioParaExcluir(u);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setUsuarioParaExcluir(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioParaExcluir) return;

    const targetId = usuarioParaExcluir.idUsuario || usuarioParaExcluir.usuario;
    if (!targetId) {
      setDeleteError('ID do usuário não encontrado.');
      return;
    }

    console.log({
      usuarioLogado: currentUser?.idUsuario || currentUser?.usuario,
      usuarioParaExcluir: usuarioParaExcluir?.idUsuario || usuarioParaExcluir?.usuario
    });

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await api.excluirUsuario(targetId);
      if (res.success) {
        setSuccessMsg('Usuário excluído com sucesso.');
        setTimeout(() => setSuccessMsg(null), 4000);
        setUsuarioParaExcluir(null);
        await fetchUsuarios();
        await refreshUsersList();
      } else {
        setDeleteError(res.error || res.message || 'Não foi possível excluir o usuário.');
      }
    } catch (e: any) {
      console.error('Erro de conexão ao excluir usuário:', e);
      setDeleteError('Erro de conexão ao tentar excluir o usuário.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center shadow-sm">
        <Lock className="mx-auto h-12 w-12 text-amber-600 mb-3" />
        <h3 className="text-xl font-bold text-amber-900 mb-2">Acesso Restrito a Administradores</h3>
        <p className="text-amber-800 text-sm mb-4">
          Seu perfil atual é <strong>USUARIO</strong>. Apenas administradores (ADM) possuem permissão para cadastrar, editar e gerenciar perfis e acessos de usuários no sistema.
        </p>
        <p className="text-xs text-amber-700">
          Utilize o menu lateral para alternar para o perfil ADM se precisar realizar alterações.
        </p>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-blue-600" size={24} /> Gerenciamento de Usuários
          </h2>
          <p className="text-slate-500 text-sm">Cadastre e gerencie os perfis de acesso do sistema (ADM / USUARIO)</p>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Plus size={18} className="text-blue-600" /> {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              {editingUser && (
                <button 
                  onClick={resetForm} 
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancelar
                </button>
              )}
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário / Login *</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  placeholder="Ex: joao.silva"
                  required
                  disabled={!!editingUser}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="joao.silva@empresa.com"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Acesso *</label>
                <select
                  value={perfil}
                  onChange={e => setPerfil(e.target.value as PerfilUsuario)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="USUARIO">USUARIO (Comum)</option>
                  <option value="ADM">ADM (Administrador)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status do Usuário *</label>
                <select
                  value={ativo}
                  onChange={e => setAtivo(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="SIM">ATIVO</option>
                  <option value="NÃO">INATIVO</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50 mt-2"
              >
                {submitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
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
                {usuarios.map((u, idx) => {
                  const isUserActive = u.ativo === 'SIM' || u.ativo === true || u.ativo === undefined;
                  return (
                    <div key={idx} className="py-3.5 flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{u.nome}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.perfil === 'ADM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.perfil || 'USUARIO'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUserActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isUserActive ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Login: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{u.usuario}</code> {u.email ? `• ${u.email}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(u)}
                          title="Editar perfil do usuário"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleAtivo(u)}
                          title={isUserActive ? "Desativar usuário" : "Ativar usuário"}
                          className={`p-1.5 rounded-lg transition-colors ${isUserActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(u)}
                          title="Excluir usuário permanentemente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {usuarioParaExcluir && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCloseDeleteModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-100/80 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Confirmar exclusão</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o usuário abaixo?
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 text-base">
                  {usuarioParaExcluir.nome}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Usuário:</span>
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium text-slate-800">
                    {usuarioParaExcluir.usuario}
                  </code>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Perfil:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    usuarioParaExcluir.perfil === 'ADM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {usuarioParaExcluir.perfil || 'USUARIO'}
                  </span>
                </div>
              </div>

              {/* Error Alert inside Modal */}
              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Não foi possível excluir o usuário:</strong>
                    <span>{deleteError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>EXCLUINDO...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>EXCLUIR USUÁRIO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

