import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { api } from '../services/api';
import { Solicitacao } from '../types/solicitacao';
import { AlertCircle, CheckCircle2, Clock, FileText, Flame, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listarSolicitacoes();
      if (response.success) {
        setData(response.data || []);
      } else {
        setError(response.error || 'Não foi possível carregar os dados reais.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Erro ao carregar dados</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={fetchData} 
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const total = data.length;
  const pendentes = data.filter(s => s.situacao === 'PENDENTE').length;
  const entregues = data.filter(s => s.situacao === 'ENTREGUE').length;
  const urgentes = data.filter(s => s.prioridade === 'URGENTE').length;
  const alta = data.filter(s => s.prioridade === 'ALTA').length;
  const liberacaoShe = data.filter(s => s.precisaLiberacaoShe === 'SIM' && s.situacao === 'PENDENTE').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm">Visão geral do controle de solicitações</p>
        </div>
        <button 
          onClick={fetchData} 
          className="text-sm bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-slate-600 transition-colors"
        >
          Atualizar dados
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total de Solicitações</div>
            <div className="text-2xl font-bold text-slate-800">{total}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Pendentes</div>
            <div className="text-2xl font-bold text-amber-600">{pendentes}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Entregues</div>
            <div className="text-2xl font-bold text-emerald-600">{entregues}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Urgentes</div>
            <div className="text-2xl font-bold text-red-600">{urgentes}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Alta Prioridade</div>
            <div className="text-2xl font-bold text-orange-600">{alta}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Liberação SHE Pendente</div>
            <div className="text-2xl font-bold text-purple-600">{liberacaoShe}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

