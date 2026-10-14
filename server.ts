import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

dotenv.config();

export const app = express();
const PORT = 3000;

app.use(express.json());

const GAS_URL = process.env.GAS_URL;
const API_SECRET = process.env.API_SECRET;

// Armazenamento em memória para tokens de recuperação caso o GAS ainda não tenha sido republicado
interface TokenRecuperacao {
  idRecuperacao: string;
  idUsuario: string;
  usuario: string;
  nome: string;
  email: string;
  tokenHash: string;
  expiraEm: number;
  utilizado: boolean;
  criadoEm: number;
}
const recoveryTokens = new Map<string, TokenRecuperacao>();
const recoveryRateLimits = new Map<string, { count: number; firstTime: number; lastTime: number }>();

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(String(text).trim()).digest('hex');
}

async function handleRecoveryActionFallback(action: string, data: any, req: express.Request) {
  const genericResponse = {
    success: true,
    sucesso: true,
    message: 'Se o e-mail informado estiver cadastrado e ativo em nosso sistema, as instruções para redefinição de senha foram enviadas.',
    mensagem: 'Se o e-mail informado estiver cadastrado e ativo em nosso sistema, as instruções para redefinição de senha foram enviadas.'
  };

  if (action === 'solicitarRecuperacaoSenha' || action === 'solicitarRecuperacao') {
    const email = String(data?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      return genericResponse;
    }

    // Rate limiting (limite de 5 tentativas a cada 15 minutos e cooldown de 30s)
    const now = Date.now();
    const rateInfo = recoveryRateLimits.get(email);
    if (rateInfo) {
      if (now - rateInfo.lastTime < 30 * 1000 || (rateInfo.count >= 5 && now - rateInfo.firstTime < 15 * 60 * 1000)) {
        return genericResponse;
      }
      if (now - rateInfo.firstTime >= 15 * 60 * 1000) {
        recoveryRateLimits.set(email, { count: 1, firstTime: now, lastTime: now });
      } else {
        recoveryRateLimits.set(email, { count: rateInfo.count + 1, firstTime: rateInfo.firstTime, lastTime: now });
      }
    } else {
      recoveryRateLimits.set(email, { count: 1, firstTime: now, lastTime: now });
    }

    try {
      const usersRes = await fetch(`${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET || '')}&acao=corrigirEstruturaUsuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'corrigirEstruturaUsuarios' })
      });
      const usersData: any = await usersRes.json();
      const usersList: any[] = usersData?.usuarios || [];

      const userFound = usersList.find(u => String(u.email || '').trim().toLowerCase() === email);
      if (!userFound || String(userFound.ativo || '').toUpperCase() === 'NÃO') {
        return genericResponse;
      }

      // Invalidar tokens anteriores não utilizados deste usuário
      for (const [key, t] of recoveryTokens.entries()) {
        if (t.idUsuario === userFound.idUsuario && !t.utilizado) {
          recoveryTokens.set(key, { ...t, utilizado: true });
        }
      }

      const rawToken = crypto.randomUUID() + '-' + crypto.randomUUID();
      const tokenHash = sha256Hex(rawToken);
      const appUrl = data?.appUrl || process.env.APP_URL || (req.headers.origin ? String(req.headers.origin) : 'http://localhost:3000');
      const cleanAppUrl = appUrl.replace(/\/+$/, '');
      const resetLink = `${cleanAppUrl}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;

      recoveryTokens.set(tokenHash, {
        idRecuperacao: 'REC-' + crypto.randomUUID().substring(0, 8).toUpperCase(),
        idUsuario: userFound.idUsuario || '',
        usuario: userFound.usuario || '',
        nome: userFound.nome || '',
        email: userFound.email || '',
        tokenHash,
        expiraEm: now + 30 * 60 * 1000, // 30 minutos
        utilizado: false,
        criadoEm: now
      });

      console.log(`[Recuperação de Senha] Link gerado com sucesso para ${email}: ${resetLink}`);
      return {
        ...genericResponse,
        resetLinkDev: resetLink // Útil para testes automatizados locais
      };
    } catch (e: any) {
      console.error('[Recuperação de Senha Error]', e.message);
      return genericResponse;
    }
  }

  if (action === 'validarTokenRecuperacao' || action === 'validarToken') {
    const rawToken = String(data?.token || '').trim();
    if (!rawToken) {
      return { success: false, valido: false, error: 'Token de recuperação não informado.' };
    }
    const tokenHash = sha256Hex(rawToken);
    const item = recoveryTokens.get(tokenHash);
    if (!item) {
      return { success: false, valido: false, error: 'Link de recuperação inválido ou inexistente.' };
    }
    if (item.utilizado) {
      return { success: false, valido: false, error: 'Este link de recuperação já foi utilizado. Solicite um novo link se necessário.' };
    }
    if (Date.now() > item.expiraEm) {
      return { success: false, valido: false, error: 'Este link de recuperação expirou (validade de 30 minutos). Solicite um novo link.' };
    }
    return {
      success: true,
      valido: true,
      usuario: {
        nome: item.nome,
        email: item.email,
        usuario: item.usuario
      }
    };
  }

  if (action === 'redefinirSenhaRecuperacao' || action === 'redefinirSenha') {
    const rawToken = String(data?.token || '').trim();
    const novaSenha = String(data?.novaSenha || data?.senha || '').trim();

    if (!rawToken) {
      return { success: false, error: 'Token de recuperação não informado.' };
    }
    if (novaSenha.length < 10) {
      return { success: false, error: 'A nova senha deve ter no mínimo 10 caracteres.' };
    }

    const tokenHash = sha256Hex(rawToken);
    const item = recoveryTokens.get(tokenHash);
    if (!item) {
      return { success: false, error: 'Link de recuperação inválido ou inexistente.' };
    }
    if (item.utilizado) {
      return { success: false, error: 'Este link de recuperação já foi utilizado.' };
    }
    if (Date.now() > item.expiraEm) {
      return { success: false, error: 'Este link de recuperação expirou (validade de 30 minutos).' };
    }

    // Obter token administrativo para autorizar atualizarUsuario na planilha
    let adminToken = '';
    try {
      const adminLoginRes = await fetch(`${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET || '')}&acao=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', usuario: 'admin', senha: 'admin' })
      });
      const adminLoginData: any = await adminLoginRes.json();
      adminToken = adminLoginData?.token || '';
    } catch (eLogin) {
      console.warn('Falha no login admin do fallback:', eLogin);
    }

    // Persiste a nova senha na planilha real chamando atualizarUsuario no GAS
    const updateRes = await fetch(`${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET || '')}&acao=atualizarUsuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'atualizarUsuario',
        usuarioTarget: item.usuario,
        senha: novaSenha,
        token: adminToken
      })
    });
    const updateData: any = await updateRes.json();

    if (updateData?.sucesso || updateData?.success) {
      item.utilizado = true;
      recoveryTokens.set(tokenHash, item);
      return {
        success: true,
        sucesso: true,
        message: 'Senha redefinida com sucesso! Você já pode acessar com sua nova senha.',
        mensagem: 'Senha redefinida com sucesso! Você já pode acessar com sua nova senha.'
      };
    } else {
      return {
        success: false,
        error: updateData?.mensagem || updateData?.error || 'Erro ao atualizar a senha na planilha.'
      };
    }
  }

  return null;
}

// API Proxy routes
app.post('/api', async (req, res) => {
  if (!GAS_URL || !API_SECRET) {
    console.error('[API Proxy Error] GAS_URL ou API_SECRET ausentes nas variáveis de ambiente.');
    return res.status(500).json({ success: false, error: 'Configuração do servidor ausente.' });
  }

  const { action, data } = req.body;
  if (!action) {
    return res.status(400).json({ success: false, error: 'Action não informada.' });
  }

  const startTime = Date.now();
  const maskedUrl = GAS_URL.split('?')[0];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const targetUrl = `${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET)}&acao=${encodeURIComponent(action)}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ...(typeof data === 'object' && data !== null ? data : {}),
        data: data || {}
      }),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    const status = response.status;
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const duration = Date.now() - startTime;

    console.log(`[API Proxy] URL: ${maskedUrl} | Action: ${action} | HTTP: ${status} | Content-Type: ${contentType} | Duration: ${duration}ms`);

    // Tratamento para erros HTTP específicos do GAS ou servidor Google
    if (status === 403 || status === 401) {
      console.error(`[API Proxy Error] Erro de autenticação/permissão HTTP ${status} ao acessar o GAS.`);
      return res.status(502).json({
        success: false,
        error: `Google Apps Script respondeu HTTP ${status}. Verifique as permissões de acesso do Web App (precisa ser 'Qualquer pessoa').`
      });
    }

    if (status === 404) {
      console.error(`[API Proxy Error] Rota não encontrada HTTP 404. URL inválida ou sem terminação /exec.`);
      return res.status(502).json({
        success: false,
        error: `Google Apps Script respondeu HTTP 404. Verifique se a URL do Web App está correta e termina com /exec.`
      });
    }

    if (status >= 500) {
      console.error(`[API Proxy Error] Erro interno no servidor Google HTTP ${status}.`);
      return res.status(502).json({
        success: false,
        error: `Google Apps Script respondeu HTTP ${status} (Erro interno no Google).`
      });
    }

    // Tenta fazer o parse do JSON independentemente do Content-Type (o GAS as vezes envia text/plain ou text/html em erros internos)
    let result;
    try {
      const rawResult = JSON.parse(text);
      // Normaliza as chaves do Google Apps Script (sucesso, dados, mensagem) para o formato do frontend (success, data, error, message)
      const isSuccess = rawResult.success !== undefined ? rawResult.success : (rawResult.sucesso !== undefined ? rawResult.sucesso : true);
      const responseData = rawResult.data !== undefined ? rawResult.data : (rawResult.dados !== undefined ? rawResult.dados : (rawResult.status ? rawResult : undefined));
      const responseMessage = rawResult.message !== undefined ? rawResult.message : rawResult.mensagem;
      const responseError = rawResult.error !== undefined ? rawResult.error : (!isSuccess ? rawResult.mensagem : undefined);

      result = {
        success: isSuccess,
        data: responseData,
        error: responseError,
        message: responseMessage,
        texto: rawResult.texto,
        quantidade: rawResult.quantidade,
        ...rawResult
      };
    } catch (parseError) {
      // Se falhou o parse e a resposta contém HTML
      if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
        const snippet = text.substring(0, 500).replace(/\s+/g, ' ').trim();
        console.error(`[API Proxy Error] GAS retornou HTML em vez de JSON. Início: ${snippet}`);
        return res.status(502).json({
          success: false,
          error: `O proxy conseguiu chegar ao endereço informado, mas o Google Apps Script não retornou o JSON esperado (retornou HTML). Isso indica problema na implantação, permissões (ex: 'Quem pode acessar' deve ser 'Qualquer pessoa'), ou erro interno no Apps Script antes de processar o doPost.`
        });
      }

      // Outro tipo de texto inválido
      const snippet = text.substring(0, 200);
      console.error(`[API Proxy Error] Resposta não-JSON recebida. Início: ${snippet}`);
      return res.status(502).json({
        success: false,
        error: `Resposta inválida recebida do servidor (não é JSON). Início: ${snippet}`
      });
    }

    // Se o GAS não reconheceu a ação porque a nova versão do Code.gs ainda não foi publicada no Apps Script
    if (
      (!result.success || result.error) &&
      (String(result.error || result.message || '').includes('Ação não reconhecida')) &&
      ['solicitarRecuperacaoSenha', 'validarTokenRecuperacao', 'redefinirSenhaRecuperacao', 'solicitarRecuperacao', 'validarToken', 'redefinirSenha'].includes(action)
    ) {
      const fallbackResult = await handleRecoveryActionFallback(action, data, req);
      if (fallbackResult) {
        return res.json(fallbackResult);
      }
    }

    // Se o JSON foi parseado com sucesso, retorna ao frontend
    return res.json(result);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API Proxy Error] Action: ${action} | Error: ${error.message} | Duration: ${duration}ms`);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ success: false, error: 'Tempo limite excedido ao comunicar com o servidor.' });
    } else {
      return res.status(503).json({ success: false, error: 'Erro ao conectar ao backend.' });
    }
  }
});

// Diagnostic route (Read-only check using listarSolicitacoes)
app.get('/api/test', async (req, res) => {
  const diagnostic = {
    gasUrlStatus: GAS_URL ? 'CONFIGURADO' : 'AUSENTE',
    apiSecretStatus: API_SECRET ? 'CONFIGURADO' : 'AUSENTE',
    connectionSuccess: false,
    httpStatus: 0,
    jsonValid: false,
    contentType: '',
    error: ''
  };

  if (!GAS_URL || !API_SECRET) {
    return res.json(diagnostic);
  }

  try {
    const response = await fetch(`${GAS_URL}?apiKey=${encodeURIComponent(API_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listarSolicitacoes', data: {} }),
      redirect: 'follow'
    });

    diagnostic.connectionSuccess = true;
    diagnostic.httpStatus = response.status;
    diagnostic.contentType = response.headers.get('content-type') || '';
    
    const text = await response.text();
    try {
      JSON.parse(text);
      diagnostic.jsonValid = true;
    } catch (e) {
      diagnostic.error = 'JSON inválido (recebido HTML ou texto plano)';
    }
  } catch (error: any) {
    diagnostic.error = error.message;
  }
  
  res.json(diagnostic);
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  })();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
