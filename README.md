# Site — Lavagem e Borracharia do Leonir

Site institucional e catálogo de pneus da Lavagem e Borracharia do Leonir
(Três de Maio/RS). Página em HTML, CSS e JavaScript puro; o catálogo vem
de uma API própria, hospedada junto com o site.

## Estrutura
```
index.html        → a página
css/styles.css    → cores e layout (tema claro com as cores da logo)
js/dados.js       → configurações e leitura do catálogo pela API
js/app.js         → filtros, carrinho e envio pelo WhatsApp
api/_estado.js    → funções comuns: senha, validação, leitura e gravação
api/catalogo.js   → GET (o site lê) e PUT (o painel grava)
api/auth.js       → entrar no painel e trocar a senha
img/logo.jpg      → logo da empresa
img/antesedepois/ → fotos do "Antes e Depois"
img/banner/       → imagens grandes do banner de abertura
```

## A API

O catálogo inteiro fica em um único arquivo JSON num Blob Store **privado**
(`leonir/catalogo.json`). Esse arquivo guarda também o embaralhado da
senha do painel (scrypt + salt), para que a senha nunca apareça no
código que o navegador baixa.

O store precisa ser privado: nada nele tem URL pública, e toda leitura
passa pelo `get()` autenticado dentro da função — é por isso que o hash
da senha pode morar junto do catálogo. A gravação usa
`access: 'private'`, e a leitura usa `useCache: false`, senão o site
poderia ver por até 60 segundos a versão anterior de um preço que o
painel acabou de mudar.

| Rota | Método | Quem usa | O que faz |
|---|---|---|---|
| `/api/catalogo` | `GET` | o site | devolve `{ pneus, atualizadoEm }` |
| `/api/catalogo` | `PUT` | o painel | grava a lista inteira; exige o cabeçalho `x-senha` |
| `/api/auth` | `POST` | o painel | `{acao:'entrar'}` e `{acao:'trocar'}` |

O `PUT` normaliza tudo o que chega (tipos, limites de tamanho, no máximo
500 pneus) — nunca se confia no que vem pela rede.

### Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | criada sozinha ao ligar um Blob Store no projeto |
| `SENHA_ADMIN` | senha inicial do painel; só é usada na primeira vez, quando o arquivo do catálogo ainda não existe |
| `ORIGEM_PAINEL` | endereço onde o painel está publicado, liberado no CORS (`localhost:5500` e `localhost:5501` já vêm liberados) |

## Como abrir no computador
Clique em **"Go Live"** no VS Code (porta 5500). Não existe API rodando
localmente, então a página busca o catálogo direto no endereço publicado
— por isso o site aberto em `localhost` já mostra os pneus de verdade.

Para publicar, importe o repositório na Vercel: a pasta `api/` vira
funções e o resto é servido como arquivo estático.

## O que editar
- **WhatsApp**: `js/dados.js`, campo `whatsapp` (55 + DDD + número).
- **Pneus, preços e estoque**: no painel do administrador. Não há mais
  lista de pneus dentro do código do site.
- **Fotos do banner**: salve em `img/banner/` como `banner-1.jpg`,
  `banner-2.jpg` e `banner-3.jpg` (largas, ex.: 1920x1080).
- **Fotos do antes/depois**: salve em `img/antesedepois/` como
  `antes-1.jpg`, `depois-1.jpg`, `antes-2.jpg`… Enquanto não existirem,
  o site mostra imagens de demonstração.

## Como funciona o pedido
O cliente escolhe os pneus, informa nome e veículo e clica em "Enviar
pedido no WhatsApp": o WhatsApp abre com a lista, as quantidades e o
total já escritos, direto na conversa do Leonir.

## Painel de administração
O painel fica em outro repositório/endereço e grava por esta API. Toda
alteração feita lá aparece aqui na hora — o site busca o catálogo ao
abrir e de novo quando o visitante volta para a aba. Pneu com estoque
zerado não é exibido até ser reposto.
