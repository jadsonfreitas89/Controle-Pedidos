import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Package, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, definirSenhaPrimeiroAcesso } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para primeiro acesso/cadastro de senha
  const [precisaCadastrar, setPrecisaCadastrar] = useState(false);
  const [usuarioDados, setUsuarioDados] = useState<any>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) {
      setErrorMessage('Informe o usuário.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await login(usuario.trim(), senha);
      if (res.precisaCadastrarSenha) {
        setPrecisaCadastrar(true);
        setUsuarioDados(res.usuario);
      } else if (!res.success) {
        setErrorMessage(res.error || res.message || 'Usuário ou senha inválidos.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCadastrarSenha = async (e: FormEvent) => {
    e.preventDefault();
    if (!novaSenha) {
      setErrorMessage('Informe a nova senha.');
      return;
    }
    if (novaSenha.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await definirSenhaPrimeiroAcesso(usuarioDados.usuario, novaSenha);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao cadastrar senha. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (precisaCadastrar) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header visual */}
          <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-lg mb-3">
              <Lock size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Cadastrar Senha</h1>
            <p className="text-slate-400 text-xs mt-1">Olá, <strong className="text-white">{usuarioDados?.nome || usuarioDados?.usuario}</strong>!</p>
            <p className="text-slate-400 text-xs mt-0.5">Identificamos que este é o seu primeiro acesso. Defina sua senha abaixo.</p>
          </div>

          {/* Formulário */}
          <div className="p-8">
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle size={20} className="shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCadastrarSenha} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={submitting}
                    placeholder="Mínimo de 6 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={submitting}
                    placeholder="Repita a senha digitada"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Salvando e Entrando...</span>
                    </>
                  ) : (
                    <span>CADASTRAR SENHA E ACESSAR</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setPrecisaCadastrar(false);
                    setUsuarioDados(null);
                    setNovaSenha('');
                    setConfirmarNovaSenha('');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header visual */}
        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
            <Package size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Controle de Pedidos</h1>
          <p className="text-slate-400 text-xs mt-1">Acesse a plataforma com suas credenciais</p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle size={20} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="Digite seu usuário"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  disabled={submitting}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>ENTRAR</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
