import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { MessageSquare, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';

export default function WhatsApp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listaTexto, setListaTexto] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchWhatsAppList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.gerarListaWhatsApp();
      if (res.success || res.sucesso) {
        setListaTexto(res.texto || res.mensagem || res.data || 'Nenhuma solicitação pendente para WhatsApp.');
      } else {
        // Fallback or error message from backend
        setError(res.error || res.mensagem || 'Erro ao gerar lista para WhatsApp.');
      }
    } catch (err) {
      // Fallback: Generate locally if API endpoint isn't returning string directly
      try {
        const solicitacoesRes = await api.listarSolicitacoes();
        if (solicitacoesRes.success) {
          const pendentes = (solicitacoesRes.data || []).filter((s: any) => s.situacao === 'PENDENTE');
          if (pendentes.length === 0) {
            setListaTexto('📋 *SOLICITAÇÕES PENDENTES*\n\nNenhuma solicitação pendente no momento.');
          } else {
            let msg = `📋 *SOLICITAÇÕES PENDENTES* (${pendentes.length})\n\n`;
            pendentes.forEach((s: any, i: number) => {
              msg += `${i + 1}. *Prot:* ${s.protocolo}\n`;
              msg += `   👤 *Solicitante:* ${s.solicitante}\n`;
              msg += `   🛠️ *Material:* ${s.material} (Qtd: ${s.quantidade})\n`;
              msg += `   📍 *Local:* ${s.onde}\n`;
              msg += `   🔥 *Prioridade:* ${s.prioridade}\n`;
              msg += `   🛡️ *SHE:* ${s.precisaLiberacaoShe}\n\n`;
            });
            setListaTexto(msg);
          }
        } else {
          setError('Não foi possível carregar as solicitações.');
        }
      } catch (e) {
        setError('Erro de conexão ao gerar lista.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppList();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(listaTexto);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Gerando lista para WhatsApp...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Erro ao gerar lista</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={fetchWhatsAppList} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lista para WhatsApp</h2>
          <p className="text-slate-500 text-sm">Resumo formatado das solicitações pendentes para envio rápido</p>
        </div>
        <button 
          onClick={fetchWhatsAppList} 
          className="text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-600" /> Mensagem Formatada
          </span>
          <button
            onClick={handleCopy}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar Mensagem</>}
          </button>
        </div>

        <textarea
          rows={14}
          value={listaTexto}
          onChange={e => setListaTexto(e.target.value)}
          className="w-full p-4 font-mono text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
        />

        <div className="mt-3 text-xs text-slate-400">
          Você pode editar o texto acima antes de copiar, se necessário.
        </div>
      </Card>
    </div>
  );
}

