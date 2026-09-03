/* ============================================================
   api/diagnostico.js — checagem rapida da instalacao
   ------------------------------------------------------------
   GET /api/diagnostico  → diz, em portugues, o que esta faltando
   para a API funcionar: acesso ao Blob, senha inicial, origem do
   painel e o arquivo do catalogo.

   NAO devolve o valor de nenhuma senha nem do token — so o nome
   das variaveis e se elas existem.

   Depois que tudo estiver funcionando, este arquivo pode ser
   apagado; nada mais depende dele.
   ============================================================ */

import { cors, nomeDoToken, checarArquivo } from './_estado.js';

export default async function handler(req, res){
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  /* Ha dois jeitos de a funcao ter permissao no Blob:
     - OIDC: o projeto e conectado ao store no painel da Vercel e
       recebe BLOB_STORE_ID. E o padrao novo, e nao existe token
       nenhum nas variaveis — isso e o certo, nao um problema.
     - token estatico: uma variavel *_READ_WRITE_TOKEN, usada fora
       da Vercel ou em conexoes antigas. */
  const token   = nomeDoToken();
  const storeId = !!process.env.BLOB_STORE_ID;

  const relatorio = {
    acessoAoBlob: {
      modo: token ? 'token na variavel ' + token
          : storeId ? 'OIDC (projeto conectado ao store)'
          : 'nenhum',
      storeId
    },
    senhaInicial: { definida: !!process.env.SENHA_ADMIN },
    origemPainel: { definida: !!process.env.ORIGEM_PAINEL, valor: process.env.ORIGEM_PAINEL || null },
    arquivo:      { existe:false, leituraOk:false },
    problemas:    []
  };

  if (!token && !storeId){
    // so os NOMES das variaveis, nunca os valores
    relatorio.variaveisParecidas = Object.keys(process.env)
      .filter(k => /BLOB|TOKEN|STORE/i.test(k)).sort();
    relatorio.problemas.push(
      'Esta funcao nao tem como provar quem e para o Blob: nao chegou nem ' +
      'BLOB_STORE_ID (conexao do projeto) nem um token. Conecte o Blob Store ' +
      'ao projeto em Storage > Projects > Connect to Project e faca um Redeploy.'
    );
    return res.status(200).json(relatorio);
  }

  // O teste que vale: falar com o Blob de verdade.
  try {
    relatorio.arquivo = await checarArquivo();

    if (!relatorio.arquivo.existe){
      relatorio.problemas.push(
        'O Blob respondeu certo, mas o arquivo leonir/catalogo.json ainda nao existe. ' +
        'Isso e normal antes do primeiro uso: abra /api/catalogo uma vez que ele e criado.'
      );
    } else if (!relatorio.arquivo.leituraOk){
      relatorio.problemas.push('O arquivo existe mas nao pode ser lido.');
    }
  } catch (e){
    relatorio.problemas.push('Erro ao falar com o Blob: ' + String(e?.message || e));
    return res.status(200).json(relatorio);
  }

  // Avisos que nao impedem o site, mas quebram o painel.
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
