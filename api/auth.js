/* ============================================================
   api/auth.js — entrada no painel e troca de senha
   ------------------------------------------------------------
   POST /api/auth  { acao:'entrar', senha }
   POST /api/auth  { acao:'trocar', atual, nova }

   A senha nunca volta para o navegador: o servidor so responde
   se confere ou nao.
   ============================================================ */

import { cors, estadoAtual, gravarEstado, senhaConfere, criarHash } from './_estado.js';

export default async function handler(req, res){
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ erro: 'Metodo nao permitido.' });
  }

  try {
    const corpo  = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const estado = await estadoAtual();

    if (corpo.acao === 'entrar'){
      if (!senhaConfere(corpo.senha, estado.senha)){
        return res.status(401).json({ erro: 'Senha incorreta.' });
      }
      return res.status(200).json({ ok: true });
    }

    if (corpo.acao === 'trocar'){
      if (!senhaConfere(corpo.atual, estado.senha)){
        return res.status(401).json({ erro: 'A senha atual esta incorreta.' });
      }
      const nova = String(corpo.nova ?? '');
      if (nova.length < 4){
        return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 4 caracteres.' });
      }
      estado.senha = criarHash(nova);
      await gravarEstado(estado);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ erro: 'Acao desconhecida.' });

  } catch (e){
    console.error('erro em /api/auth:', e);
    return res.status(500).json({ erro: 'Falha ao falar com o servidor.' });
  }
}
