import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const GAS_URL = process.env.GAS_URL;
  const API_SECRET = process.env.API_SECRET;
  
  const url = new URL(req.url || '', `https://${req.headers.host}`);
  const pathname = url.pathname;

  // Rota GET /api
  if (req.method === 'GET' && pathname === '/api') {
    return res.status(200).json({ success: true, message: "API Controle-Pedidos funcionando" });
  }

  // Rota GET /api/test
  if (req.method === 'GET' && pathname === '/api/test') {
    const diagnostic = {
      gasUrlStatus: GAS_URL ? 'CONFIGURADO' : 'AUSENTE',
      apiSecretStatus: API_SECRET ? 'CONFIGURADO' : 'AUSENTE',
      connectionSuccess: false,
      httpStatus: 0,
      jsonValid: false,
      error: ''
    };

    if (!GAS_URL || !API_SECRET) return res.status(200).json(diagnostic);

    try {
      const response = await fetch(`${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listarSolicitacoes', data: {} })
      });

      diagnostic.connectionSuccess = true;
      diagnostic.httpStatus = response.status;
      const text = await response.text();
      try {
        JSON.parse(text);
        diagnostic.jsonValid = true;
      } catch (e) {
        diagnostic.error = 'JSON inválido';
      }
    } catch (error: any) {
      diagnostic.error = error.message;
    }
    return res.status(200).json(diagnostic);
  }

  // Rota POST /api
  if (req.method === 'POST' && pathname === '/api') {
    if (!GAS_URL || !API_SECRET) {
      return res.status(500).json({ success: false, error: 'Configuração ausente.' });
    }

    const { action, data } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'Action não informada.' });

    try {
      const targetUrl = `${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET)}&acao=${encodeURIComponent(action)}`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(typeof data === 'object' && data !== null ? data : {}),
          data: data || {}
        })
      });

      const result = await response.json();
      return res.status(response.status).json(result);
    } catch (error: any) {
      return res.status(503).json({ success: false, error: 'Erro ao conectar ao backend.' });
    }
  }

  return res.status(404).json({ success: false, error: 'Rota não encontrada.' });
}
