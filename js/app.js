/* ============================================================
   Lavagem e Borracharia do Leonir — app.js (site publico)
   ------------------------------------------------------------
   O catalogo de pneus e as configuracoes ficam em js/dados.js.
   Para editar precos, estoque e produtos use o painel:
   admin.html
   ============================================================ */

let PNEUS = [];


/* ============================================================
   Utilidades
   ============================================================ */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const brl = n => n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('is-show'), 2400);
}

function waLink(texto){
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/* ============================================================
   Catálogo + filtros
   ============================================================ */
const state = { aro:'todos', busca:'', ordem:'rel' };

function montarChips(){
  const aros = [...new Set(PNEUS.map(p => p.aro))].sort((a,b)=>a-b);

  // se o aro filtrado saiu do catálogo, volta para "todos"
  if (state.aro !== 'todos' && !aros.some(a => String(a) === String(state.aro))) state.aro = 'todos';

  $('#chipsAro').innerHTML =
    ['todos', ...aros].map(v =>
      `<button class="chip${String(v)===String(state.aro)?' is-active':''}" data-group="aro" data-val="${v}">${v==='todos'?'Todos os aros':'Aro '+v}</button>`
    ).join('');


  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    const g = chip.dataset.group;
    state[g] = chip.dataset.val;
    $$(`.chip[data-group="${g}"]`).forEach(c => c.classList.toggle('is-active', c === chip));
    render();
  }));
}

function filtrar(){
  const q = state.busca.trim().toLowerCase();
  let lista = PNEUS.filter(p => {
    const okAro = state.aro === 'todos' || String(p.aro) === String(state.aro);
    const alvo = `${p.marca} ${p.modelo} ${p.medida}`.toLowerCase();
    const okQ = !q || q.split(/\s+/).every(t => alvo.includes(t));
    return okAro && okQ;
  });
  if (state.ordem === 'asc')  lista.sort((a,b) => a.preco - b.preco);
  if (state.ordem === 'desc') lista.sort((a,b) => b.preco - a.preco);
  return lista;
}

function render(){
  const lista = filtrar();
  const grid = $('#tireGrid');
  $('#emptyState').hidden = lista.length > 0;

  grid.innerHTML = lista.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="card__media">
        ${p.tag ? `<span class="tag tag--${p.tag}">${p.tag === 'promo' ? 'Promoção' : 'Novidade'}</span>` : ''}
        ${p.foto
          ? `<img class="card__foto" src="${p.foto}" alt="${p.marca} ${p.modelo}" loading="lazy">`
          : '<span class="card__semfoto">Foto em breve</span>'}
      </div>
      <div class="card__body">
        <span class="card__brand">${p.marca}</span>
        <h3 class="card__name">${p.modelo}</h3>
        <span class="card__size">Aro ${p.aro} · ${p.medida}</span>
        <div class="card__specs">${p.specs.map(s => `<span class="spec">${s}</span>`).join('')}</div>
        <span class="stock ${p.estoque > 3 ? 'stock--ok' : p.estoque > 0 ? 'stock--low' : 'stock--out'}">
          ${p.estoque > 3 ? 'Em estoque' : p.estoque > 0 ? `Últimas ${p.estoque} unidades` : 'Sob encomenda'}
        </span>
        <div class="card__foot">
          <div class="price">
            ${p.precoDe ? `<small>${brl(p.precoDe)}</small>` : ''}
            <strong>${brl(p.preco)}</strong>
            <span>por pneu · montagem inclusa</span>
          </div>
          <button class="add" data-add="${p.id}" aria-label="Adicionar ${p.marca} ${p.modelo} ao orçamento">+</button>
        </div>
      </div>
    </article>`).join('');

  // animação de entrada
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold:.12 });
  $$('.card', grid).forEach(c => io.observe(c));

  $$('[data-add]', grid).forEach(btn => btn.addEventListener('click', () => {
    addItem(btn.dataset.add);
    btn.classList.add('is-added'); btn.textContent = '✓';
    setTimeout(() => { btn.classList.remove('is-added'); btn.textContent = '+'; }, 1000);
  }));
}

/* ============================================================
   Carrinho / orçamento
   ============================================================ */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('leonir_cart') || '[]'); } catch { cart = []; }

const salvar = () => { try { localStorage.setItem('leonir_cart', JSON.stringify(cart)); } catch {} };

function addItem(id){
  const item = cart.find(i => i.id === id);
  if (item) item.qtd++;
  else cart.push({ id, qtd: 1 });
  salvar(); renderCart();
  toast('Pneu adicionado ao orçamento 🛞');
}

function setQtd(id, delta){
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) cart = cart.filter(i => i.id !== id);
  salvar(); renderCart();
}

function removeItem(id){ cart = cart.filter(i => i.id !== id); salvar(); renderCart(); }

const totalCart = () => cart.reduce((s,i) => {
  const p = PNEUS.find(x => x.id === i.id);
  return s + (p ? p.preco * i.qtd : 0);
}, 0);

function renderCart(){
  const box = $('#cartItems');
  const qtdTotal = cart.reduce((s,i) => s + i.qtd, 0);
  $('#cartCount').textContent = qtdTotal;
  $('#cartTotal').textContent = brl(totalCart());

  if (!cart.length){
    box.innerHTML = `<p class="cart-empty">Seu orçamento está vazio.<br>Escolha seus pneus no catálogo 🛞</p>`;
    return;
  }

  box.innerHTML = cart.map(i => {
    const p = PNEUS.find(x => x.id === i.id);
    if (!p) return '';
    return `<div class="ci">
      <div>
        <h4>${p.marca} ${p.modelo}</h4>
        <small>${p.medida}</small>
      </div>
      <div class="ci__price">${brl(p.preco * i.qtd)}</div>
      <div class="ci__qty">
        <button data-minus="${p.id}" aria-label="Diminuir">−</button>
        <span>${i.qtd}</span>
        <button data-plus="${p.id}" aria-label="Aumentar">+</button>
      </div>
      <button class="ci__del" data-del="${p.id}">remover</button>
    </div>`;
  }).join('');

  $$('[data-plus]',  box).forEach(b => b.onclick = () => setQtd(b.dataset.plus, +1));
  $$('[data-minus]', box).forEach(b => b.onclick = () => setQtd(b.dataset.minus, -1));
  $$('[data-del]',   box).forEach(b => b.onclick = () => removeItem(b.dataset.del));
}

/* Mensagem final do WhatsApp */
function montarMensagem(){
  const nome = $('#custName').value.trim();
  const carro = $('#custCar').value.trim();
  const lavagem = $('#wantWash').checked;

  const linhas = [];
  linhas.push(`Olá, ${CONFIG.nomeLoja}! Gostaria de um orçamento pelo site:`);
  linhas.push('');
  cart.forEach(i => {
    const p = PNEUS.find(x => x.id === i.id);
    if (p) linhas.push(`• ${i.qtd}x ${p.marca} ${p.modelo} — ${p.medida} (${brl(p.preco)} cada)`);
  });
  linhas.push('');
  linhas.push(`Total estimado: ${brl(totalCart())}`);
  if (lavagem) linhas.push('Quero incluir também uma LAVAGEM COMPLETA.');
  if (carro)   linhas.push(`Veículo: ${carro}`);
  if (nome)    linhas.push(`Meu nome: ${nome}`);
  linhas.push('');
  linhas.push('Aguardo a confirmação de preço e prazo. Obrigado!');
  return linhas.join('\n');
}

/* ============================================================
   Galeria Antes & Depois (comparador arrastável)
   ============================================================ */
function placeholder(tipo, i){
  // Imagem de demonstração em SVG (data URI) — some quando você
  // colocar as fotos reais em img/antesedepois/.
  const sujo  = ['#b9c3cf','#8f9dab','#d3dae2'];
  const limpo = ['#f2b93c','#e8a02a','#ef7527'];
  const c = tipo === 'antes' ? sujo : limpo;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/>
    </linearGradient></defs>
    <rect width="800" height="600" fill="url(#a)"/>
    <g fill="none" stroke="rgba(30,42,56,.22)" stroke-width="3">
      <path d="M140 380h520M180 300c60-90 380-90 440 0"/>
      <circle cx="255" cy="395" r="52"/><circle cx="565" cy="395" r="52"/>
    </g>
    <text x="400" y="520" fill="rgba(30,42,56,.55)" font-family="sans-serif" font-size="30"
      text-anchor="middle">${tipo === 'antes' ? 'ANTES' : 'DEPOIS'} — foto ${i}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}


/* Galeria: 6 quadros, metade "antes" e metade "depois". Sem animação. */
function montarGaleria(){
  const grid = $('#baGrid');
  grid.innerHTML = CONFIG.galeriaFotos.map((f, idx) => {
    const i = idx + 1;
    return `<figure class="ba">
      <div class="ba__par">
        <div class="ba__lado">
          <img src="img/antesedepois/antes-${i}.jpg" alt="Antes da lavagem — ${f.titulo}" loading="lazy"
               onerror="this.onerror=null;this.src='${placeholder('antes', i)}'">
          <span class="ba__tag">Antes</span>
        </div>
        <div class="ba__lado">
          <img src="img/antesedepois/depois-${i}.jpg" alt="Depois da lavagem — ${f.titulo}" loading="lazy"
               onerror="this.onerror=null;this.src='${placeholder('depois', i)}'">
          <span class="ba__tag ba__tag--depois">Depois</span>
        </div>
      </div>
      <figcaption class="ba__cap"><h3>${f.titulo}</h3><span>${f.legenda}</span></figcaption>
    </figure>`;
  }).join('');
}

/* ============================================================
   Interações gerais
   ============================================================ */
function initUI(){
  // links de WhatsApp fixos
  const msgPadrao = `Olá, ${CONFIG.nomeLoja}! Vim pelo site e gostaria de mais informações.`;
  ['#heroWa', '#contatoWa', '#fabWa'].forEach(sel => { const el = $(sel); if (el) el.href = waLink(msgPadrao); });

  $('#year').textContent = new Date().getFullYear();

  // carrossel do banner
  const slides = $$('.hero__slide'), dots = $$('#heroDots button');
  if (slides.length){
    let atual = 0, timer;
    const ir = i => {
      atual = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === atual));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === atual));
    };
    const reiniciar = () => { clearInterval(timer); timer = setInterval(() => ir(atual + 1), 7000); };
    dots.forEach((d, k) => d.addEventListener('click', () => { ir(k); reiniciar(); }));
    $('#heroNext').addEventListener('click', () => { ir(atual + 1); reiniciar(); });
    reiniciar();
  }

  // sombra no cabecalho ao rolar
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  // menu mobile
  const burger = $('#burger'), nav = $('#nav');
  burger.addEventListener('click', () => {
    nav.classList.toggle('is-open'); burger.classList.toggle('is-open');
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.classList.remove('is-open');
  }));

  // link ativo conforme a seção visível
  const secoes = $$('section[id]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin:'-45% 0px -50% 0px' });
  secoes.forEach(s => spy.observe(s));

  // drawer
  const drawer = $('#cartDrawer'), back = $('#drawerBackdrop');
  const abrir = () => { drawer.classList.add('is-open'); back.classList.add('is-open'); drawer.setAttribute('aria-hidden','false'); };
  const fechar = () => { drawer.classList.remove('is-open'); back.classList.remove('is-open'); drawer.setAttribute('aria-hidden','true'); };
  $('#openCart').addEventListener('click', abrir);
  $('#closeCart').addEventListener('click', fechar);
  back.addEventListener('click', fechar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });

  // busca e ordenação
  let t;
  $('#searchInput').addEventListener('input', e => {
    clearTimeout(t); t = setTimeout(() => { state.busca = e.target.value; render(); }, 160);
  });
  $('#sortSelect').addEventListener('change', e => { state.ordem = e.target.value; render(); });

  // enviar pedido
  $('#sendWa').addEventListener('click', () => {
    if (!cart.length){ toast('Adicione pelo menos um pneu ao orçamento.'); return; }
    window.open(waLink(montarMensagem()), '_blank', 'noopener');
  });
}

/* ============================================================
   Catálogo vindo do painel
   ------------------------------------------------------------
   O que o Leonir muda no painel é gravado no servidor. Aqui a
   página busca essa lista ao abrir e busca de novo quando o
   visitante volta para a aba, para não mostrar preço vencido.
   ============================================================ */
let ultimaBusca = 0;

async function atualizarCatalogo(){
  // pneu sem estoque sai do site até ser reposto pelo painel
  const lista = (await carregarPneus()).filter(p => p.estoque > 0);
  ultimaBusca = Date.now();

  // servidor fora do ar: mantém na tela o catálogo que já estava
  if (!lista.length && PNEUS.length) return;

  PNEUS = lista;

  $('#emptyState').textContent = PNEUS.length
    ? 'Nenhum pneu encontrado com esses filtros. Fale com a gente no WhatsApp que buscamos a medida para você.'
    : 'Estamos atualizando o estoque. Fale com a gente no WhatsApp que buscamos a medida para você.';

  montarChips();
  render();
  renderCart();
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  // o que não depende do catálogo já pode aparecer na hora
  montarGaleria();
  initUI();

  const aviso = $('#emptyState');
  aviso.textContent = 'Carregando os pneus...';
  aviso.hidden = false;

  await atualizarCatalogo();

  // voltou para a aba depois de um tempo? confere se mudou algo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - ultimaBusca < 60000) return;
    atualizarCatalogo();
  });
});
