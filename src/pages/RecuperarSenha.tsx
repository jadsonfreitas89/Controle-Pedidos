import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Informe o e-mail cadastrado.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Informe um endereço de e-mail válido.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.solicitarRecuperacaoSenha(cleanEmail);
      if (res.success || res.sucesso) {
        setEnviado(true);
      } else {
        // Mensagem genérica mesmo em caso de resposta atípica para não enumerar usuários
        setEnviado(true);
      }
    } catch (err: any) {
      // Proteção de enumeração: mesmo em erro transitório, o usuário visualiza instruções de segurança
      setEnviado(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header visual alinhado ao padrão do sistema */}
        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg mb-3">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Recuperar Senha</h1>
          <p className="text-slate-400 text-xs mt-1">Controle de Pedidos</p>
        </div>

        <div className="p-8">
          {enviado ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-800">Verifique seu e-mail</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Se o endereço informado estiver cadastrado e ativo em nosso sistema, as instruções com o link para redefinir sua senha foram enviadas.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-left space-y-1">
                <p className="font-semibold text-slate-700">Lembretes importantes:</p>
                <p>• O link de redefinição é válido por <strong>30 minutos</strong>.</p>
                <p>• Caso não localize na Caixa de Entrada, confira a pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle size={20} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Digite o e-mail cadastrado na sua conta. Se ele estiver correto, enviaremos um link de uso único para redefinir sua senha com segurança.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      disabled={submitting}
                      placeholder="exemplo@tesla.srv.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Enviando solicitação...</span>
                      </>
                    ) : (
                      <span>ENVIAR INSTRUÇÕES</span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
