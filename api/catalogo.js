/* ============================================================
   api/catalogo.js — o catalogo de pneus
   ------------------------------------------------------------
   GET  /api/catalogo  → lista publica, usada pelo site
   PUT  /api/catalogo  → grava a lista, usada pelo painel
                         (exige o cabecalho x-senha)
   ============================================================ */

import { cors, estadoAtual, gravarEstado, senhaConfere, normalizarPneu } from './_estado.js';

export default async function handler(req, res){
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const estado = await estadoAtual();

    if (req.method === 'GET'){
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        pneus: estado.pneus,
        atualizadoEm: estado.atualizadoEm
      });
    }

    if (req.method === 'PUT'){
      if (!senhaConfere(req.headers['x-senha'], estado.senha)){
        return res.status(401).json({ erro: 'Senha incorreta ou sessao expirada.' });
      }

      const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!Array.isArray(corpo.pneus)){
        return res.status(400).json({ erro: 'Esperava uma lista de pneus.' });
      }
      if (corpo.pneus.length > 500){
        return res.status(400).json({ erro: 'O catalogo passou de 500 pneus.' });
      }

      estado.pneus = corpo.pneus.map(normalizarPneu);
      estado.atualizadoEm = new Date().toISOString();
      await gravarEstado(estado);

      return res.status(200).json({ ok: true, total: estado.pneus.length, atualizadoEm: estado.atualizadoEm });
    }

    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(405).json({ erro: 'Metodo nao permitido.' });

  } catch (e){
    console.error('erro em /api/catalogo:', e);
    return res.status(500).json({
      erro: 'Falha ao acessar o catalogo no servidor.',
      detalhe: String(e?.message || e)   // diz o motivo real, para nao ficar no escuro
    });
  }
}
