# Site — Lavagem e Borracharia do Leonir

Site institucional e catálogo de pneus da Lavagem e Borracharia do Leonir
(Três de Maio/RS). Feito em HTML, CSS e JavaScript puro, sem dependências.

## Como abrir
Dê dois cliques em `index.html`. Para publicar, envie a pasta inteira para
qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Hostinger).

## Estrutura
```
index.html        → a página
css/styles.css    → cores e layout (tema claro com as cores da logo)
js/dados.js       → catálogo de pneus e configurações
js/app.js         → filtros, carrinho e envio pelo WhatsApp
img/logo.jpg      → logo da empresa
img/antesedepois/ → fotos do "Antes e Depois"
img/banner/       → imagens grandes do banner de abertura
```

## O que editar
- **WhatsApp**: `js/dados.js`, campo `whatsapp` (55 + DDD + número).
- **Pneus, preços e estoque**: lista `PNEUS_PADRAO` em `js/dados.js`.
- **Fotos do banner**: salve em `img/banner/` como `banner-1.jpg`, `banner-2.jpg`
  e `banner-3.jpg` (largas, ex.: 1920x1080).
- **Fotos do antes/depois**: salve em `img/antesedepois/` como `antes-1.jpg`,
  `depois-1.jpg`, `antes-2.jpg`, `depois-2.jpg`, `antes-3.jpg`, `depois-3.jpg`.
  Enquanto não existirem, o site mostra imagens de demonstração.

## Como funciona o pedido
O cliente escolhe os pneus, informa nome e veículo e clica em "Enviar pedido
no WhatsApp": o WhatsApp abre com a lista, as quantidades e o total já
escritos, direto na conversa do Leonir.

## Painel de administração
O painel fica em outro repositório (`painel-leonir`). Importante: como o
catálogo editado no painel é guardado no navegador e esse armazenamento é
isolado por endereço, as alterações feitas no painel publicado em outro
domínio **não** aparecem aqui. Para atualizar este site, exporte o backup
pelo painel e cole a lista em `PNEUS_PADRAO` dentro de `js/dados.js`.
