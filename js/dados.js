/* ============================================================
   dados.js — catálogo compartilhado entre o site e o painel
   ------------------------------------------------------------
   O catálogo abaixo é o PADRÃO de fábrica. Quando o dono edita
   algo no painel (admin.html), a lista passa a ser guardada no
   navegador e é ela que o site mostra.
   ============================================================ */

const CONFIG = {
  // Número do WhatsApp com DDI 55 + DDD, somente dígitos.
  whatsapp: '5555999450632',
  nomeLoja: 'Lavagem e Borracharia do Leonir',
  // Senha de acesso ao painel de administrador.
  senhaAdmin: '123456',
  // Legendas das comparações "Antes e Depois" da página inicial.
  galeriaFotos: [
    { titulo: 'Lavagem completa',        legenda: 'Externa + interna' },
    { titulo: 'Polimento e cristalização', legenda: 'Brilho recuperado' },
    { titulo: 'Higienização interna',    legenda: 'Bancos e carpetes' }
  ]
};

const CHAVE_CATALOGO = 'leonir_catalogo_v1';

const PNEUS_PADRAO = [
  { id:'p01', marca:'Pirelli',     modelo:'Cinturato P1',       medida:'175/70 R14', aro:14, preco:389,  precoDe:449,  estoque:8,  tag:'promo', specs:['88T','Baixo ruído','Econômico'] },
  { id:'p02', marca:'Goodyear',    modelo:'Assurance',          medida:'185/60 R15', aro:15, preco:449,  precoDe:null, estoque:12, tag:null,    specs:['88H','Aquaplanagem','Conforto'] },
  { id:'p03', marca:'Michelin',    modelo:'Energy XM2+',        medida:'195/55 R15', aro:15, preco:579,  precoDe:639,  estoque:6,  tag:'promo', specs:['85V','Longa vida','Premium'] },
  { id:'p04', marca:'Bridgestone', modelo:'Turanza T005',       medida:'205/55 R16', aro:16, preco:689,  precoDe:null, estoque:4,  tag:'novo',  specs:['91V','Alta performance','Silencioso'] },
  { id:'p05', marca:'Continental', modelo:'PowerContact 2',     medida:'195/65 R15', aro:15, preco:529,  precoDe:589,  estoque:10, tag:'promo', specs:['91H','Frenagem curta','Durável'] },
  { id:'p06', marca:'Firestone',   modelo:'F-700',              medida:'175/65 R14', aro:14, preco:349,  precoDe:null, estoque:14, tag:null,    specs:['82T','Custo-benefício','Macio'] },
  { id:'p07', marca:'Pirelli',     modelo:'Scorpion ATR',       medida:'215/65 R16', aro:16, preco:899,  precoDe:999,  estoque:5,  tag:'promo', specs:['98H','On/Off road','Reforçado'] },
  { id:'p08', marca:'Goodyear',    modelo:'Wrangler AT',        medida:'235/70 R16', aro:16, preco:1090, precoDe:null, estoque:4,  tag:null,    specs:['104T','Barro e areia','Robusto'] },
  { id:'p09', marca:'Michelin',    modelo:'Primacy SUV',        medida:'225/65 R17', aro:17, preco:1290, precoDe:null, estoque:2,  tag:'novo',  specs:['102H','Silencioso','Premium'] },
  { id:'p10', marca:'Bridgestone', modelo:'Dueler H/T',         medida:'265/65 R17', aro:17, preco:1490, precoDe:1650, estoque:4,  tag:'promo', specs:['112T','Carga pesada','Estradeiro'] },
  { id:'p11', marca:'Continental', modelo:'CrossContact LX',    medida:'255/60 R18', aro:18, preco:1690, precoDe:null, estoque:3,  tag:null,    specs:['112H','Alta carga','Conforto'] },
  { id:'p12', marca:'Pirelli',     modelo:'Chrono Carga',       medida:'205/75 R16', aro:16, preco:749,  precoDe:829,  estoque:6,  tag:'promo', specs:['110R','Utilitário','Reforçado'] },
  { id:'p13', marca:'Dunlop',      modelo:'SP Sport',           medida:'225/45 R17', aro:17, preco:989,  precoDe:null, estoque:4,  tag:'novo',  specs:['94W','Aderência','Curvas'] },
  { id:'p14', marca:'Michelin',    modelo:'Pilot Sport 4',      medida:'235/40 R18', aro:18, preco:1590, precoDe:1790, estoque:2,  tag:'promo', specs:['95Y','Alta velocidade','Premium'] },
  { id:'p15', marca:'Firestone',   modelo:'Destination LE2',    medida:'215/60 R17', aro:17, preco:949,  precoDe:null, estoque:7,  tag:null,    specs:['96H','Uso urbano','Durável'] },
  { id:'p16', marca:'Goodyear',    modelo:'Kelly Edge Touring', medida:'185/65 R15', aro:15, preco:419,  precoDe:479,  estoque:9,  tag:'promo', specs:['88H','Econômico','Macio'] }
];

/* ============================================================
   Senha do painel
   ------------------------------------------------------------
   A senha começa como a de CONFIG.senhaAdmin. Se o dono trocar
   a senha dentro do painel, a nova fica guardada no navegador.
   ============================================================ */
const CHAVE_SENHA  = 'leonir_senha_admin';
const CHAVE_SESSAO = 'leonir_admin_ok';

function obterSenha(){
  try { return localStorage.getItem(CHAVE_SENHA) || CONFIG.senhaAdmin; }
  catch { return CONFIG.senhaAdmin; }
}

function definirSenha(nova){
  try { localStorage.setItem(CHAVE_SENHA, nova); return true; }
  catch { return false; }
}

function senhaPersonalizada(){
  try { return !!localStorage.getItem(CHAVE_SENHA); } catch { return false; }
}

function senhaConfere(tentativa){ return tentativa === obterSenha(); }

const estaLogado = () => { try { return sessionStorage.getItem(CHAVE_SESSAO) === '1'; } catch { return false; } };
const marcarLogado = () => { try { sessionStorage.setItem(CHAVE_SESSAO, '1'); } catch {} };
const sairDoPainel = () => { try { sessionStorage.removeItem(CHAVE_SESSAO); } catch {} };

/* Garante que todo pneu tenha os campos esperados, mesmo os
   salvos por versões anteriores do painel. */
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
    specs:   Array.isArray(p.specs) ? p.specs.filter(Boolean).map(String) : []
  };
}

function carregarPneus(){
  try {
    const bruto = localStorage.getItem(CHAVE_CATALOGO);
    if (!bruto) return PNEUS_PADRAO.map(normalizarPneu);
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista) || !lista.length) return PNEUS_PADRAO.map(normalizarPneu);
    return lista.map(normalizarPneu);
  } catch {
    return PNEUS_PADRAO.map(normalizarPneu);
  }
}

function salvarPneus(lista){
  try {
    localStorage.setItem(CHAVE_CATALOGO, JSON.stringify(lista.map(normalizarPneu)));
    return true;
  } catch {
    return false;
  }
}

function restaurarPadrao(){
  try { localStorage.removeItem(CHAVE_CATALOGO); } catch {}
  return PNEUS_PADRAO.map(normalizarPneu);
}

/* Gera um id novo que ainda não existe na lista. */
function novoId(lista){
  let n = lista.length + 1;
  const existe = id => lista.some(p => p.id === id);
  let id = 'p' + String(n).padStart(2, '0');
  while (existe(id)) { n++; id = 'p' + String(n).padStart(2, '0'); }
  return id;
}
