/* ============================================================
   api/diagnostico.js — checagem rapida da instalacao
   ------------------------------------------------------------
   GET /api/diagnostico  → diz, em portugues, o que esta faltando
   para a API funcionar: token do Blob, senha inicial e acesso ao
   arquivo do catalogo.

   NAO devolve o valor de nenhuma senha nem do token — so o nome
   das variaveis e se elas existem.

   Depois que tudo estiver funcionando, este arquivo pode ser
   apagado; nada mais depende dele.
   ============================================================ */

import { cors, nomeDoToken, urlDoArquivo } from './_estado.js';

export default async function handler(req, res){
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const relatorio = {
    tokenDoBlob:   { encontrado:false, variavel:null },
    senhaInicial:  { definida: !!process.env.SENHA_ADMIN },
    origemPainel:  { definida: !!process.env.ORIGEM_PAINEL, valor: process.env.ORIGEM_PAINEL || null },
    arquivo:       { existe:false, leituraOk:false },
    problemas:     []
  };

  // 1. o token do Blob chegou nesta funcao?
  const nome = nomeDoToken();
  relatorio.tokenDoBlob = { encontrado: !!nome, variavel: nome };
  if (!nome){
    relatorio.problemas.push(
      'Nenhuma variavel terminada em _READ_WRITE_TOKEN chegou nesta funcao. ' +
      'Ligue um Blob Store ao projeto em Storage e depois faca um Redeploy: ' +
      'variavel criada depois do deploy so vale no deploy seguinte.'
    );
    return res.status(200).json(relatorio);
  }

  // 2. da para falar com o Blob e achar o arquivo do catalogo?
  try {
    const url = await urlDoArquivo();
    relatorio.arquivo.existe = !!url;

    if (!url){
      relatorio.problemas.push(
        'O Blob respondeu, mas o arquivo leonir/catalogo.json ainda nao existe. ' +
        'Isso e normal antes do primeiro acesso: abra /api/catalogo uma vez que ele e criado.'
      );
    } else {
      const r = await fetch(`${url}?t=${Date.now()}`, { cache:'no-store' });
      relatorio.arquivo.leituraOk = r.ok;
      if (!r.ok){
        relatorio.problemas.push(`O arquivo existe mas nao pode ser lido (HTTP ${r.status}).`);
      }
    }
  } catch (e){
    relatorio.problemas.push('Erro ao falar com o Blob: ' + String(e?.message || e));
    return res.status(200).json(relatorio);
  }

  // 3. avisos que nao impedem o site, mas quebram o painel
  if (!relatorio.senhaInicial.definida){
    relatorio.problemas.push(
      'SENHA_ADMIN nao esta definida. Se o catalogo for criado agora, a senha do painel sera 123456.'
    );
  }
  if (!relatorio.origemPainel.definida){
    relatorio.problemas.push(
      'ORIGEM_PAINEL nao esta definida. O site funciona, mas o navegador vai bloquear o painel por CORS.'
    );
  }

  if (!relatorio.problemas.length) relatorio.problemas.push('Nada pendente: esta tudo no lugar.');

  return res.status(200).json(relatorio);
}
