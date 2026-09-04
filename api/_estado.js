/* ============================================================
   api/_estado.js — funcoes compartilhadas pelas rotas da API
   ------------------------------------------------------------
   O catalogo inteiro mora num unico arquivo JSON guardado no
   Vercel Blob. Esse arquivo tambem guarda o hash da senha do
   painel, para que a senha nunca fique escrita no codigo que o
   navegador baixa.

   Arquivos que comecam com "_" nao viram rota na Vercel.
   ============================================================ */

import { put, get } from '@vercel/blob';
import crypto from 'node:crypto';

const ARQUIVO = 'leonir/catalogo.json';

/* O store e privado: nada nele tem URL publica, e toda leitura passa
   por esta funcao autenticada. E o certo aqui, porque o arquivo
   guarda tambem o hash da senha do painel. */
const ACESSO = 'private';

/* ---------- CORS ----------
   O painel roda em outro dominio, entao precisa de permissao
   explicita. A origem do painel vem da variavel ORIGEM_PAINEL;
   os enderecos locais ficam liberados para desenvolvimento
   (5501 = painel pelo serve-painel.js, 5500 = site pelo Live
   Server do VS Code). */
export function cors(req, res){
  const permitidas = [
    process.env.ORIGEM_PAINEL,
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ].filter(Boolean);

  const origem = req.headers.origin;
  if (origem && permitidas.includes(origem)){
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-senha');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/* ---------- senha ---------- */
export function criarHash(senha){
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(senha), salt, 64).toString('hex');
  return { salt, hash };
}

export function senhaConfere(tentativa, registro){
  if (!registro || !registro.salt || !registro.hash) return false;
  try {
    const h = crypto.scryptSync(String(tentativa ?? ''), registro.salt, 64);
    const alvo = Buffer.from(registro.hash, 'hex');
    return h.length === alvo.length && crypto.timingSafeEqual(h, alvo);
  } catch {
    return false;
  }
}

/* ---------- formato do pneu ----------
   Mesma normalizacao do navegador, repetida aqui porque nunca se
   confia no que chega pela rede. */
export function normalizarPneu(p){
  return {
    id:      String(p?.id || '').slice(0, 40),
    marca:   String(p?.marca || '').trim().slice(0, 60),
    modelo:  String(p?.modelo || '').trim().slice(0, 80),
    medida:  String(p?.medida || '').trim().slice(0, 40),
    aro:     Number(p?.aro) || 0,
    preco:   Number(p?.preco) || 0,
    precoDe: p?.precoDe === null || p?.precoDe === '' || isNaN(Number(p?.precoDe)) ? null : Number(p.precoDe),
    estoque: Number.isFinite(Number(p?.estoque)) ? Math.max(0, Math.round(Number(p.estoque))) : 0,
    tag:     ['promo','novo'].includes(p?.tag) ? p.tag : null,
    specs:   Array.isArray(p?.specs) ? p.specs.filter(Boolean).map(s => String(s).slice(0, 60)).slice(0, 12) : [],
    foto:    fotoValida(p?.foto)
  };
}

/* Foto do pneu: aceita um endereco https ou a imagem embutida
   (data:image/...). Qualquer outra coisa vira string vazia, para
   nao guardar lixo nem script no lugar da imagem. */
export function fotoValida(v){
  const s = String(v || '').trim();
  if (!s || s.length > 400000) return '';
  if (/^https:\/\//i.test(s)) return s.slice(0, 600);
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s)) return s;
  return '';
}

/* ---------- token do Blob ----------
   Normalmente a Vercel cria BLOB_READ_WRITE_TOKEN sozinha ao ligar o
   store no projeto. Mas se o store foi conectado com um prefixo, o
   nome muda (ex: LEONIR_READ_WRITE_TOKEN) e a biblioteca nao acha
   sozinha. Entao procuramos qualquer variavel com esse final. */
export function nomeDoToken(){
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'BLOB_READ_WRITE_TOKEN';
  const chaves = Object.keys(process.env);
  return chaves.find(k => k.endsWith('_READ_WRITE_TOKEN') && process.env[k])
      // ultimo recurso: todo token do Blob comeca com vercel_blob_rw_,
      // entao achamos pelo valor mesmo que a variavel tenha outro nome
      || chaves.find(k => String(process.env[k] || '').startsWith('vercel_blob_rw_'))
      || null;
}

function token(){
  const nome = nomeDoToken();
  return nome ? process.env[nome] : undefined;
}

/* ---------- leitura e gravacao ----------
   useCache:false e obrigatorio aqui: gravamos sempre no mesmo
   caminho, e com o cache da CDN a leitura logo depois de uma
   gravacao poderia devolver a versao anterior por ate 60s. */
async function abrirArquivo(){
  return get(ARQUIVO, { access: ACESSO, useCache: false, token: token() });
}

/* Existe? Da para ler? Usado pelo /api/diagnostico. */
export async function checarArquivo(){
  const r = await abrirArquivo();
  return { existe: !!r, leituraOk: r?.statusCode === 200 };
}

async function lerEstado(){
  const r = await abrirArquivo();          // null quando ainda nao existe
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  try { return await new Response(r.stream).json(); } catch { return null; }
}

export async function gravarEstado(estado){
  await put(ARQUIVO, JSON.stringify(estado), {
    access: ACESSO,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: token()
  });
}

/* Devolve o estado atual. Na primeira vez cria o arquivo com o
   catalogo vazio e a senha inicial vinda da variavel SENHA_ADMIN. */
export async function estadoAtual(){
  const existente = await lerEstado();
  if (existente && Array.isArray(existente.pneus)) return existente;

  const novo = {
    pneus: [],
    senha: criarHash(process.env.SENHA_ADMIN || '123456'),
    atualizadoEm: null
  };
  await gravarEstado(novo);
  return novo;
}
