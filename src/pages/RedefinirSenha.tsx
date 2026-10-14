import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extração robusta do token de query params (searchParams do React Router, window.location.search ou hash)
  const token = (() => {
    let t = searchParams.get('token') || searchParams.get('t');
    if (t && t.trim()) return t.trim();

    if (typeof window !== 'undefined') {
      try {
        const directParams = new URLSearchParams(window.location.search);
        t = directParams.get('token') || directParams.get('t');
        if (t && t.trim()) return t.trim();
      } catch (e) {}

      try {
        const hash = window.location.hash || '';
        if (hash.includes('token=')) {
          const qIdx = hash.indexOf('?');
          const hashQuery = qIdx !== -1 ? hash.substring(qIdx) : '?' + hash.replace(/^#\/?/, '');
          const hashParams = new URLSearchParams(hashQuery);
          t = hashParams.get('token') || hashParams.get('t');
          if (t && t.trim()) return t.trim();
        }
      } catch (e) {}
    }
    return '';
  })();

  const [validating, setValidating] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [usuarioInfo, setUsuarioInfo] = useState<{ nome?: string; email?: string; usuario?: string } | null>(null);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validar() {
      if (!token) {
        if (isMounted) {
          setValidating(false);
          setTokenValido(false);
          setTokenError('Link de recuperação inválido ou token não fornecido.');
        }
        return;
      }

      try {
        const res = await api.validarTokenRecuperacao(token);
        if (isMounted) {
          const isValido = (res.valido === true || (res.valido !== false && (res.success || res.sucesso))) && !res.error && !res.erro;
          if (isValido) {
            setTokenValido(true);
            setUsuarioInfo(res.usuario || null);
          } else {
            setTokenValido(false);
            setTokenError(res.error || res.erro || res.mensagem || res.message || 'Este link de recuperação é inválido ou expirou.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValido(false);
          setTokenError(err.message || 'Erro ao validar o link de recuperação.');
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    }

    validar();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!novaSenha) {
      setFormError('Informe a nova senha.');
      return;
    }

    if (novaSenha.length < 10) {
      setFormError('A nova senha deve ter no mínimo 10 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.redefinirSenhaRecuperacao(token, novaSenha);
      if ((res.success || res.sucesso) && !res.error && !res.erro) {
        setSucesso(true);
      } else {
        setFormError(res.error || res.erro || res.mensagem || res.message || 'Não foi possível redefinir a senha. O link pode ter expirado.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header visual */}
        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Redefinir Senha</h1>
          <p className="text-slate-400 text-xs mt-1">Controle de Pedidos</p>
        </div>

        <div className="p-8">
          {validating ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 size={36} className="animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-slate-700">Validando link de recuperação...</p>
              <p className="text-xs text-slate-400">Aguarde enquanto verificamos a segurança do seu acesso.</p>
            </div>
          ) : sucesso ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800">Senha Redefinida com Sucesso!</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sua nova senha foi gravada com segurança e as sessões anteriores foram encerradas. Agora você já pode fazer login na plataforma.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>IR PARA O LOGIN</span>
                </button>
              </div>
            </div>
          ) : !tokenValido ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800">Link Inválido ou Expirado</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tokenError || 'Este link de recuperação não é mais válido, já foi utilizado ou ultrapassou o limite de 30 minutos.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/recuperar-senha')}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>SOLICITAR NOVO LINK</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {usuarioInfo?.nome && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                  <span>Redefinindo senha para: <strong>{usuarioInfo.nome}</strong></span>
                </div>
              )}

              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle size={20} className="shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

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
                    placeholder="Mínimo de 10 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={novaSenha.length >= 10 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    • Mínimo de 10 caracteres ({novaSenha.length}/10)
                  </span>
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
                    placeholder="Repita a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
                {confirmarSenha && (
                  <div className="mt-1.5 text-xs">
                    {novaSenha === confirmarSenha ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> As senhas coincidem
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">
                        As senhas não coincidem
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || novaSenha.length < 10 || novaSenha !== confirmarSenha}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <span>DEFINIR NOVA SENHA</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => navigate('/login')}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
