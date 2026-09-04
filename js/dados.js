/* ============================================================
   dados.js — configuracoes e leitura do catalogo (site publico)
   ------------------------------------------------------------
   O catalogo NAO mora mais neste arquivo. Ele fica no servidor e
   e lido pela rota /api/catalogo, alimentada pelo painel do
   administrador. Assim, o que o dono altera no painel aparece
   para todo mundo que abrir o site.
   ============================================================ */

const CONFIG = {
  // Número do WhatsApp com DDI 55 + DDD, somente dígitos.
  whatsapp: '5555999450632',
  nomeLoja: 'Lavagem e Borracharia do Leonir',
  // Legendas das comparações "Antes e Depois" da página inicial.
  galeriaFotos: [
    { titulo: 'Lavagem completa',        legenda: 'Externa + interna' },
    { titulo: 'Polimento e cristalização', legenda: 'Brilho recuperado' },
    { titulo: 'Higienização interna',    legenda: 'Bancos e carpetes' }
  ]
};

/* Garante que todo pneu tenha os campos esperados. */
function normalizarPneu(p){
  return {
    id:      String(p.id || ''),
    marca:   String(p.marca || '').trim(),
    modelo:  String(p.modelo || '').trim(),
    medida:  String(p.medida || '').trim(),
    aro:     Number(p.aro) || 0,
    preco:   Number(p.preco) || 0,
    precoDe: p.precoDe === null || p.precoDe === '' || isNaN(Number(p.precoDe)) ? null : Number(p.precoDe),
    estoque: Number.isFinite(Number(p.estoque)) ? Number(p.estoque) : 0,
    tag:     ['promo','novo'].includes(p.tag) ? p.tag : null,
    specs:   Array.isArray(p.specs) ? p.specs.filter(Boolean).map(String) : [],
    foto:    fotoValida(p.foto)
  };
}

/* Foto do pneu: endereco https ou imagem embutida (data:image/...).
   Qualquer outra coisa vira string vazia. */
function fotoValida(v){
  const s = String(v || '').trim();
  if (!s || s.length > 400000) return '';
  if (/^https:\/\//i.test(s)) return s.slice(0, 600);
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s)) return s;
  return '';
}

/* Onde buscar o catalogo. No site publicado a rota e do proprio
   dominio; aberto pelo Live Server (localhost) nao existe API
   local, entao busca direto no site publicado. */
const ROTA_CATALOGO =
  ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'https://site-leonir.vercel.app/api/catalogo'
    : '/api/catalogo';

/* Busca o catalogo no servidor. Se a API estiver fora do ar,
   devolve lista vazia — o site mostra o aviso de catalogo vazio
   em vez de quebrar. */
async function carregarPneus(){
  try {
    const r = await fetch(ROTA_CATALOGO, { cache: 'no-store' });
    if (!r.ok) throw new Error('resposta ' + r.status);
    const dados = await r.json();
    return Array.isArray(dados.pneus) ? dados.pneus.map(normalizarPneu) : [];
  } catch (e){
    console.error('Nao foi possivel carregar o catalogo:', e);
    return [];
  }
}
