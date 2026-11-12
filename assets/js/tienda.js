/* Tienda de yairartz.com
   Misma tienda que la app Nexo de Héroes (tienda-fisica.html) y el mismo Apps Script
   (CHH_CONFIG.tiendaOnline). Aquí se compra como invitado: nombre, correo y teléfono,
   con ID de jugador opcional. El carrito y los pedidos se guardan en este navegador. */
(function () {
'use strict';
const PEDIDOS_URL = 'https://script.google.com/macros/s/AKfycby4_GOCEo7lM-5R5iVBCgvT-5a9gzB27-FkNP589ZzExSXooFtFZnoq7DMCnuCcds1R/exec';
const APP = 'https://yairartz.github.io/CHOQUE-DE-H-ROES-TCG-PWA-APP/';
const RETORNO = location.origin + location.pathname;
const K_CARRO = 'yz_carrito', K_CLAVES = 'yz_pedidos', K_ENVIO = 'yz_envio_tipo', K_DIR = 'yz_envio_datos', K_CLI = 'yz_cliente';
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const $$ = n => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fechaTxt = s => { if (!s) return ''; const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); const d = m ? new Date(+m[1], m[2] - 1, +m[3]) : new Date(s); return isNaN(d) ? String(s) : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); };
const mesTxt = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? new Date(+m[1], m[2] - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : fechaTxt(s); };
const imgUrl = s => { s = s || 'REVERSO_2021.jpg'; return /^(https?:)?\/\//.test(s) || s.startsWith('data:') ? s : APP + s.replace(/^\.?\//, ''); };
const costoTxt = n => Number(n) > 0 ? $$(n) : 'Sin costo';
const esPersonal = p => p && p.envio && p.envio.id === 'personal';
function toast(t, bad) { const el = $('toast'); el.textContent = t; el.classList.toggle('bad', !!bad); el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2800); }
const ESTADOS_MX = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

/* ── API (Apps Script) ── */
async function llamar(params, cuerpo) {
  const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = cuerpo ? await fetch(PEDIDOS_URL, { method: 'POST', body: JSON.stringify(cuerpo), signal: ctrl.signal })
                     : await fetch(PEDIDOS_URL + '?' + new URLSearchParams(params), { signal: ctrl.signal });
    const d = await r.json(); if (!d.ok) throw new Error(d.error || 'Error del servidor'); return d;
  } catch (e) { if (e.name === 'AbortError') throw new Error('El servidor tardó demasiado. Intenta de nuevo.'); if (e instanceof TypeError) throw new Error('Sin conexión. Revisa tu internet.'); throw e; }
  finally { clearTimeout(to); }
}
const API = {
  catalogo: () => llamar({ accion: 'catalogo', origen: 'web' }),
  crear: d => llamar(null, Object.assign({ accion: 'crear' }, d)),
  pedidos: claves => llamar({ accion: 'pedidos', claves: Object.entries(claves).map(([k, v]) => k + ':' + v).join(',') }),
  pedido: (id, clave) => llamar({ accion: 'pedido', id, clave }),
  envio: (id, clave, datos) => llamar(null, { accion: 'envio', id, clave, datos })
};

/* ── Catálogo ── */
let CAT = { productos: [], envios: [], politica: '' }, FILTRO = 'todos', TAB = 'productos';
const prod = sku => CAT.productos.find(p => p.sku === sku);
async function cargarCatalogo() {
  try { CAT = await API.catalogo(); ls.set('yz_cat_cache', CAT); }
  catch (e) { const c = ls.get('yz_cat_cache', null); if (c) { CAT = c; toast('Sin conexión: mostrando el último catálogo', true); } else { $('grid').innerHTML = '<div class="shop-empty"><b>No se pudo cargar la tienda</b>' + esc(e.message) + '</div>'; return; } }
  limpiarCarro(); pintarFiltros(); pintarGrid(); pintarCarroN();
}
function pintarFiltros() {
  const cats = [...new Set(CAT.productos.map(p => p.categoria).filter(Boolean))];
  const hayPre = CAT.productos.some(p => p.tipo === 'preventa');
  const F = [['todos', 'Todo']].concat(hayPre ? [['preventa', 'Preventas'], ['disponible', 'Disponibles']] : []).concat(cats.map(c => ['c:' + c, c]));
  $('filtros').innerHTML = F.map(([k, t]) => `<button type="button" class="${FILTRO === k ? 'on' : ''}" data-f="${esc(k)}" aria-pressed="${FILTRO === k}">${esc(t)}</button>`).join('');
  $('filtros').querySelectorAll('[data-f]').forEach(b => b.onclick = () => { FILTRO = b.dataset.f; pintarFiltros(); pintarGrid(); });
}
const etiqueta = p => p.disponibles <= 0 ? ['ago', 'Agotado'] : p.tipo === 'preventa' ? ['pre', 'Preventa'] : ['disp', 'Disponible'];
function pintarGrid() {
  const L = CAT.productos.filter(p => FILTRO === 'todos' || p.tipo === FILTRO || 'c:' + p.categoria === FILTRO);
  if (!L.length) { $('grid').innerHTML = '<div class="shop-empty"><b>No hay productos aquí por ahora</b>Pronto anunciaremos nuevas preventas.</div>'; return; }
  const C = carro();
  $('grid').innerHTML = L.map(p => { const [c, t] = etiqueta(p), en = (C.find(i => i.sku === p.sku) || {}).cant;
    return `<button type="button" class="shop-card${p.disponibles <= 0 ? ' is-out' : ''}" data-sku="${esc(p.sku)}">
      <span class="shop-card__img"><img src="${esc(imgUrl(p.imagen))}" alt="" loading="lazy"></span>
      <span class="shop-tag ${c}">${t}</span>${en ? `<span class="shop-in" aria-label="${en} en el carrito">${en}</span>` : ''}
      <span class="shop-card__tx"><b>${esc(p.nombre)}</b>${p.tipo === 'preventa' && p.entrega ? `<small>Llega en ${esc(mesTxt(p.entrega))}</small>` : ''}${p.disponibles > 0 && p.disponibles <= 5 ? `<small class="few">Quedan ${p.disponibles}</small>` : ''}
      <span class="shop-price">${$$(p.precio)}</span></span></button>`; }).join('');
  $('grid').querySelectorAll('[data-sku]').forEach(b => b.onclick = () => abrirProducto(b.dataset.sku));
}

/* ── Carrito ── */
const carro = () => ls.get(K_CARRO, []);
function guardarCarro(C) { ls.set(K_CARRO, C.filter(i => i.cant > 0)); pintarCarroN(); }
const maxPara = p => Math.max(0, Math.min(p.disponibles, p.limite || 99));
function limpiarCarro() { if (!CAT.productos.length) return; guardarCarro(carro().filter(i => prod(i.sku)).map(i => ({ sku: i.sku, cant: Math.min(i.cant, maxPara(prod(i.sku))) }))); }
function pintarCarroN() {
  const n = carro().reduce((s, i) => s + i.cant, 0);
  $('nCarro').textContent = n; $('bCarro').setAttribute('aria-label', 'Carrito, ' + n + ' productos');
  document.querySelectorAll('[data-cart-n]').forEach(e => { e.textContent = n; e.hidden = !n; });
}
function agregar(sku, cant) {
  const p = prod(sku), C = carro(), it = C.find(i => i.sku === sku), ya = it ? it.cant : 0, max = maxPara(p);
  if (ya + cant > max) { toast(p.limite && ya + cant > p.limite ? 'Máximo ' + p.limite + ' por persona' : 'Solo quedan ' + p.disponibles, true); cant = max - ya; if (cant <= 0) return false; }
  if (it) it.cant += cant; else C.push({ sku, cant });
  guardarCarro(C); pintarGrid();
  document.querySelectorAll('.cart-btn,#bCarro').forEach(b => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  return true;
}
function cambiarCant(sku, d) { const C = carro(), it = C.find(i => i.sku === sku); if (!it) return; const p = prod(sku);
  it.cant = Math.max(0, Math.min(maxPara(p), it.cant + d)); if (d > 0 && it.cant === maxPara(p)) toast(p.limite && it.cant >= p.limite ? 'Máximo ' + p.limite + ' por persona' : 'No hay más cupo');
  guardarCarro(C); pintarGrid(); }

/* ── Panel lateral ── */
let _volver = null, _hoja = null, _sondeo = 0;
function abrirHoja(tipo, tit, body, pie) {
  if (!$('hoja').classList.contains('on')) _volver = document.activeElement;
  _hoja = tipo; $('hTit').textContent = tit; $('hBody').innerHTML = body; $('hPie').innerHTML = pie || ''; $('hPie').hidden = !pie; $('hBody').scrollTop = 0;
  $('hoja').classList.add('on'); $('velo').classList.add('on'); $('hoja').setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('shop-locked');
  if (window.__lenis) window.__lenis.stop();
  setTimeout(() => $('hX').focus({ preventScroll: true }), 80);
}
function cerrarHoja() {
  if (!$('hoja').classList.contains('on')) return false;
  $('hoja').classList.remove('on'); $('velo').classList.remove('on'); $('hoja').setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('shop-locked');
  if (window.__lenis) window.__lenis.start();
  _hoja = null; clearInterval(_sondeo);
  if (_volver && document.contains(_volver)) setTimeout(() => _volver.focus({ preventScroll: true }), 60);
  return true;
}
$('hX').onclick = cerrarHoja; $('velo').addEventListener('click', cerrarHoja);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarHoja(); });

function abrirProducto(sku) {
  const p = prod(sku); if (!p) return; const max = maxPara(p), en = (carro().find(i => i.sku === sku) || {}).cant || 0; let n = Math.min(1, max - en);
  const [c, t] = etiqueta(p);
  abrirHoja('prod', p.nombre, `<div class="shop-dimg"><img src="${esc(imgUrl(p.imagen))}" alt="${esc(p.nombre)}"></div>
    <span class="shop-tag ${c} is-static">${t}</span>
    <div class="shop-dprice">${$$(p.precio)}</div>
    ${p.descripcion ? `<p class="shop-dtx">${esc(p.descripcion)}</p>` : ''}
    <dl class="shop-data">${p.tipo === 'preventa' ? `<dt>Entrega estimada</dt><dd>${esc(fechaTxt(p.entrega) || 'Por anunciar')}</dd>${p.cierre ? `<dt>Preventa hasta</dt><dd>${esc(fechaTxt(p.cierre))}</dd>` : ''}` : '<dt>Entrega</dt><dd>Después de pagar</dd>'}
      ${p.limite ? `<dt>Límite</dt><dd>${p.limite} por persona</dd>` : ''}<dt>Disponibles</dt><dd>${p.disponibles > 0 ? p.disponibles : 'Agotado'}</dd>${en ? `<dt>En tu carrito</dt><dd>${en}</dd>` : ''}</dl>
    ${max - en > 0 ? `<div class="shop-row"><div class="shop-qty"><button type="button" id="pMen" aria-label="Menos">−</button><span id="pN">${n}</span><button type="button" id="pMas" aria-label="Más">+</button></div><b id="pSub">${$$(p.precio * n)}</b></div>` : ''}`,
    max - en > 0 ? `<button class="btn" type="button" id="pAdd">Agregar al carrito</button>` : `<button class="btn btn--ghost" type="button" id="pVer">${p.disponibles <= 0 ? 'Agotado · ver carrito' : 'Ya tienes el máximo · ver carrito'}</button>`);
  const upd = () => { $('pN').textContent = n; $('pSub').textContent = $$(p.precio * n); };
  if ($('pMen')) { $('pMen').onclick = () => { n = Math.max(1, n - 1); upd(); }; $('pMas').onclick = () => { if (n < max - en) n++; else toast(p.limite && en + n >= p.limite ? 'Máximo ' + p.limite + ' por persona' : 'No hay más cupo'); upd(); }; }
  if ($('pAdd')) $('pAdd').onclick = () => { if (agregar(sku, n)) { toast('✓ Agregado al carrito'); abrirCarro(); } };
  if ($('pVer')) $('pVer').onclick = abrirCarro;
}

function abrirCarro() {
  const C = carro().filter(i => prod(i.sku));
  if (!C.length) { abrirHoja('carro', 'Carrito', '<div class="shop-empty"><b>Tu carrito está vacío</b>Agrega productos o preventas para pedirlos.</div>', '<button class="btn btn--ghost" type="button" id="cSeguir">Ver productos</button>'); $('cSeguir').onclick = cerrarHoja; return; }
  let envio = ls.get(K_ENVIO, (CAT.envios[0] || {}).id); if (!CAT.envios.find(e => e.id === envio)) envio = (CAT.envios[0] || {}).id;
  const cli = ls.get(K_CLI, {});
  const grupo = tipo => C.filter(i => prod(i.sku).tipo === tipo).map(i => { const p = prod(i.sku);
    return `<div class="shop-ci"><img src="${esc(imgUrl(p.imagen))}" alt=""><div><b>${esc(p.nombre)}</b><small>${$$(p.precio)} c/u</small>
      <div class="shop-qty sm"><button type="button" data-m="${esc(i.sku)}" aria-label="Menos">−</button><span>${i.cant}</span><button type="button" data-p="${esc(i.sku)}" aria-label="Más">+</button></div></div>
      <div class="shop-ci__r"><b>${$$(p.precio * i.cant)}</b><button type="button" class="shop-link" data-q="${esc(i.sku)}">Quitar</button></div></div>`; }).join('');
  const disp = grupo('disponible'), pre = grupo('preventa');
  const fechas = C.map(i => prod(i.sku)).filter(p => p.tipo === 'preventa' && p.entrega).map(p => p.entrega).sort(), ultima = fechas[fechas.length - 1];
  const sub = C.reduce((t, i) => t + prod(i.sku).precio * i.cant, 0), env = CAT.envios.find(e => e.id === envio) || { costo: 0, domicilio: true };
  const campo = (k, t, extra) => `<label data-c="${k}">${t}<input id="c_${k}" value="${esc(cli[k] || '')}" ${extra || ''}><span class="msg"></span></label>`;
  abrirHoja('carro', 'Carrito', `${disp ? '<h3>Disponible ahora</h3>' + disp : ''}${pre ? '<h3>Preventa</h3>' + pre : ''}
    ${disp && pre ? `<p class="shop-note">Tu pedido mezcla productos disponibles y de preventa: <b>se entrega todo junto</b> cuando llegue la preventa${ultima ? ' (estimado ' + esc(mesTxt(ultima)) + ')' : ''}. Si quieres recibir antes lo disponible, haz dos pedidos por separado.</p>` : pre ? `<p class="shop-note">Se entrega cuando llegue la preventa${ultima ? ' (estimado ' + esc(mesTxt(ultima)) + ')' : ''}.</p>` : ''}
    <h3>Entrega</h3>
    ${CAT.envios.map(e => `<button type="button" class="shop-env${e.id === envio ? ' on' : ''}" data-e="${esc(e.id)}" aria-pressed="${e.id === envio}"><i></i><span><b>${esc(e.nombre)}</b><small>${esc(e.detalle || '')}</small></span><span class="c">${costoTxt(e.costo)}</span></button>`).join('')}
    <p class="shop-small">${env.domicilio === false ? 'Después de pagar nos escribes por Instagram o Facebook con tu folio y acordamos lugar y hora.' : 'Capturas tu dirección después de pagar.'}</p>
    <h3>Tus datos</h3>
    <div class="shop-form">${campo('nombre', 'Nombre y apellido', 'autocomplete="name" maxlength="80"')}${campo('email', 'Correo', 'type="email" autocomplete="email" maxlength="80"')}${campo('telefono', 'Teléfono (10 dígitos)', 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14"')}${campo('jugador', 'ID de jugador (opcional)', 'maxlength="20" placeholder="Si juegas Choque de Héroes"')}</div>
    <p class="shop-small">Te enviaremos al correo la confirmación y el enlace para seguir tu pedido.</p>
    <div class="shop-tot"><span>Subtotal</span><span>${$$(sub)}</span><span>${esc(env.nombre || 'Entrega')}</span><span>${costoTxt(env.costo)}</span><span class="g">Total</span><span class="g">${$$(sub + env.costo)}</span></div>
    ${CAT.politica ? `<details class="shop-pol"><summary>Política de compra y preventas</summary><p>${esc(CAT.politica)}</p></details>` : ''}
    ${env.ciudad ? `<label class="shop-chk"><input type="checkbox" id="cCiudad"> Confirmo que la entrega es dentro de ${esc(env.ciudad)}.</label>` : ''}
    <label class="shop-chk"><input type="checkbox" id="cAcepto"> Acepto la política de compra y preventas.</label>`,
    `<button class="btn shop-mp" type="button" id="cPagar" disabled>Pagar ${$$(sub + env.costo)} con Mercado Pago</button>`);
  const guardarCli = () => { const d = {}; ['nombre', 'email', 'telefono', 'jugador'].forEach(k => d[k] = ($('c_' + k).value || '').trim()); ls.set(K_CLI, d); };
  const rehacer = () => { guardarCli(); const y = $('hBody').scrollTop; abrirCarro(); $('hBody').scrollTop = y; };
  $('hBody').querySelectorAll('[data-m]').forEach(b => b.onclick = () => { cambiarCant(b.dataset.m, -1); rehacer(); });
  $('hBody').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { cambiarCant(b.dataset.p, 1); rehacer(); });
  $('hBody').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { guardarCarro(carro().filter(i => i.sku !== b.dataset.q)); pintarGrid(); rehacer(); });
  $('hBody').querySelectorAll('[data-e]').forEach(b => b.onclick = () => { ls.set(K_ENVIO, b.dataset.e); rehacer(); });
  $('c_telefono').addEventListener('input', e => e.target.value = e.target.value.replace(/[^\d ]/g, ''));
  ['nombre', 'email', 'telefono', 'jugador'].forEach(k => $('c_' + k).addEventListener('change', guardarCli));
  const listo = () => { $('cPagar').disabled = !$('cAcepto').checked || !!($('cCiudad') && !$('cCiudad').checked); };
  $('cAcepto').onchange = listo; if ($('cCiudad')) $('cCiudad').onchange = listo;
  $('cPagar').onclick = () => pagar(envio);
}
function leerCliente() {
  const v = k => ($('c_' + k).value || '').trim(), d = { nombre: v('nombre'), email: v('email'), telefono: v('telefono').replace(/\D/g, ''), jugador: v('jugador') };
  const err = { nombre: d.nombre.length < 5 && 'Escribe nombre y apellido', email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) && 'Revisa el correo', telefono: !/^\d{10}$/.test(d.telefono) && 'Deben ser 10 dígitos' };
  let ok = true;
  document.querySelectorAll('.shop-form [data-c]').forEach(l => { const m = err[l.dataset.c]; l.classList.toggle('err', !!m); const s = l.querySelector('.msg'); if (s) s.textContent = m || ''; if (m) ok = false; });
  if (!ok) { const f = document.querySelector('.shop-form .err input'); f && f.focus(); toast('Revisa tus datos', true); return null; }
  ls.set(K_CLI, d); return d;
}
async function pagar(envio) {
  const cli = leerCliente(); if (!cli) return;
  const b = $('cPagar'); b.disabled = true; b.textContent = 'Preparando el pago…';
  try {
    const r = await API.crear({
      jugadorId: cli.jugador || '', jugadorNombre: cli.nombre,
      invitado: { nombre: cli.nombre, email: cli.email, telefono: cli.telefono },
      origen: 'yairartz.com', retorno: RETORNO,
      items: carro().map(i => ({ sku: i.sku, cant: i.cant })), envio
    });
    const claves = ls.get(K_CLAVES, {}); claves[r.pedido] = r.clave; ls.set(K_CLAVES, claves);
    guardarCarro([]); pintarGrid();
    location.href = r.url;
  } catch (e) { toast(e.message, true); b.disabled = false; b.textContent = 'Reintentar pago'; cargarCatalogo(); }
}

/* ── Mis pedidos ── */
let PEDS = [];
const ESTADO = { pendiente: ['e-pend', 'Pago pendiente'], pagado: ['e-falta', 'Falta tu dirección'], por_enviar: ['e-ok', 'Preparando envío'], enviado: ['e-env', 'Enviado'],
  entregado: ['e-fin', 'Entregado'], rechazado: ['e-bad', 'Pago rechazado'], vencido: ['e-fin', 'Venció el pago'], cancelado: ['e-fin', 'Cancelado'], reembolsado: ['e-fin', 'Reembolsado'], revisar: ['e-pend', 'En revisión'] };
const est = (e, p) => esPersonal(p) && e === 'pagado' ? ['e-falta', 'Faltan tus datos'] : esPersonal(p) && e === 'por_enviar' ? ['e-ok', 'Por acordar entrega'] : ESTADO[e] || ['e-fin', e];
const linkIG = () => 'https://ig.me/m/' + encodeURIComponent((CAT.contacto || {}).instagram || 'choquedeheroestcg');
const linkFB = () => 'https://m.me/' + encodeURIComponent((CAT.contacto || {}).facebook || 'choquedheroes');
const botonesContacto = folio => `<div class="shop-chips" data-folio="${esc(folio)}"><a class="shop-chip" href="${linkIG()}" target="_blank" rel="noopener" data-msg>Instagram</a><a class="shop-chip" href="${linkFB()}" target="_blank" rel="noopener" data-msg>Facebook</a></div>`;
function activarContacto() {
  document.querySelectorAll('[data-folio] [data-msg]').forEach(a => a.addEventListener('click', () => {
    const txt = 'Hola, mi pedido de la Tienda Online es ' + a.closest('[data-folio]').dataset.folio + '.';
    try { navigator.clipboard.writeText(txt).then(() => toast('Mensaje copiado: pégalo en el chat')).catch(() => {}); } catch (e) {}
  }));
}
async function cargarPedidos() {
  const claves = ls.get(K_CLAVES, {});
  if (!Object.keys(claves).length) { PEDS = []; pintarPedidos(); return; }
  if (TAB === 'pedidos' && !PEDS.length) $('peds').innerHTML = '<div class="shop-skel" style="height:80px"></div><div class="shop-skel" style="height:80px"></div>';
  try { PEDS = (await API.pedidos(claves)).pedidos || []; PEDS.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))); ls.set('yz_peds', PEDS); }
  catch (e) { PEDS = ls.get('yz_peds', []); if (TAB === 'pedidos') toast(e.message, true); }
  pintarPedidos();
}
function pintarPedidos() {
  const falta = PEDS.filter(p => p.estado === 'pagado').length; $('bPend').hidden = !falta; $('bPend').textContent = falta;
  if (!PEDS.length) { $('peds').innerHTML = '<div class="shop-empty"><b>Aún no tienes pedidos</b>Tus compras aparecerán aquí con su estado de entrega.</div>'; return; }
  $('peds').innerHTML = PEDS.map(p => { const [c, t] = est(p.estado, p);
    return `<button type="button" class="shop-order" data-id="${esc(p.id)}"><b>${esc(p.id)}</b><span class="tt">${$$(p.total)}</span>
      <small>${esc(p.items.map(i => i.cant + '× ' + i.nombre).join(', '))}</small><span class="shop-st ${c}">${t}</span></button>`; }).join('') +
    '<p class="shop-small">Tus pedidos se guardan en este navegador. Al capturar tus datos de entrega te llega un correo con el enlace de seguimiento.</p>';
  $('peds').querySelectorAll('[data-id]').forEach(b => b.onclick = () => abrirPedido(b.dataset.id));
}
function abrirPedido(id, recien) {
  const p = PEDS.find(x => x.id === id); if (!p) return; const clave = ls.get(K_CLAVES, {})[id];
  const per = esPersonal(p), [c, t] = est(p.estado, p);
  const paso = per ? { pendiente: 0, pagado: 1, por_enviar: 2, enviado: 2, entregado: 3 }[p.estado] : { pendiente: 0, pagado: 1, por_enviar: 2, enviado: 3, entregado: 4 }[p.estado];
  const pasos = (per ? ['Pago', 'Tus datos', 'Entrega'] : ['Pago', 'Dirección', 'Envío', 'Entrega']).map((n, i) => `<li class="${paso == null ? '' : i < paso ? 'ok' : i === paso ? 'now' : ''}">${n}</li>`).join('');
  const fechas = p.items.filter(i => i.tipo === 'preventa' && i.entrega).map(i => i.entrega).sort(), ultima = fechas[fechas.length - 1];
  let cuerpo = `<p><span class="shop-st ${c}">${t}</span> <span class="shop-small">${esc(fechaTxt(p.fecha))}</span></p>${paso != null ? `<ol class="shop-steps">${pasos}</ol>` : ''}`;
  if (p.estado === 'pendiente') cuerpo += `<p class="shop-note">${recien ? 'Estamos esperando la confirmación de Mercado Pago. Si pagaste en OXXO o por transferencia, puede tardar hasta 1 día hábil.' : 'Aún no recibimos tu pago. Si elegiste OXXO o transferencia, completa el pago antes de que venza (72 horas).'}</p>`;
  if (p.estado === 'rechazado') cuerpo += `<p class="shop-note bad">Mercado Pago rechazó el pago. No se hizo ningún cargo. Puedes intentarlo de nuevo desde el carrito con otra forma de pago.</p>`;
  if (p.estado === 'vencido') cuerpo += `<p class="shop-note bad">El tiempo para pagar terminó y el cupo se liberó.</p>`;
  if (p.estado === 'pagado') cuerpo += (per ? `<p class="shop-note ok">✓ Pago recibido. Déjanos tus datos de contacto y después escríbenos para acordar lugar y hora.</p>` : `<p class="shop-note ok">✓ Pago recibido. Ahora captura la dirección a donde ${p.envio.id === 'repartidor' ? 'llevará el repartidor' : 'enviaremos'} tu pedido.</p>`) + formEnvio(p);
  if (p.estado === 'revisar') cuerpo += `<p class="shop-note">Estamos revisando tu pago. Te escribiremos si necesitamos algo.</p>`;
  if (['por_enviar', 'enviado', 'entregado'].includes(p.estado) && p.datos) {
    const d = p.datos;
    if (per) {
      cuerpo += `<h3>Entrega personal</h3><div class="shop-addr">${esc(d.nombre)} · ${esc(d.telefono)}${d.referencias ? '<br>' + esc(d.referencias) : ''}</div>`;
      if (p.estado !== 'entregado') cuerpo += `<p class="shop-note">${ultima ? 'Incluye preventa: la entregamos cuando llegue (estimado ' + esc(mesTxt(ultima)) + '). ' : ''}Escríbenos con tu folio <b>${esc(p.id)}</b> para acordar lugar y hora. Al tocar un botón se copia un mensaje listo para pegar.</p>${botonesContacto(p.id)}<button type="button" class="shop-link" id="oEdit">Corregir mis datos</button>`;
    } else {
      cuerpo += `<h3>${p.envio.id === 'repartidor' ? 'Dirección para el repartidor' : 'Dirección de envío'}</h3><div class="shop-addr">${esc(d.nombre)} · ${esc(d.telefono)}<br>${esc(d.calle)}${d.interior ? ', int. ' + esc(d.interior) : ''}<br>Col. ${esc(d.colonia)}, C.P. ${esc(d.cp)}<br>${esc(d.municipio)}, ${esc(d.estado)}${d.referencias ? '<br>' + esc(d.referencias) : ''}</div>`;
      if (p.estado === 'por_enviar') cuerpo += `<p class="shop-small">${ultima ? 'Incluye preventa: se envía cuando llegue (estimado ' + esc(mesTxt(ultima)) + ').' : 'Te avisaremos cuando salga tu paquete.'}</p><button type="button" class="shop-link" id="oEdit">Corregir dirección</button>`;
    }
    if (p.guia) cuerpo += `<h3>Rastreo</h3><div class="shop-chips"><span>${esc(p.paqueteria || p.envio.nombre)}</span><code>${esc(p.guia)}</code><button type="button" class="shop-chip" id="oCopia">Copiar</button>${/^https:\/\//.test(p.rastreo || '') ? `<a class="shop-chip" href="${esc(p.rastreo)}" target="_blank" rel="noopener">Rastrear</a>` : ''}</div>`;
  }
  cuerpo += `<h3>Productos</h3>${p.items.map(i => `<div class="shop-line"><span><b>${i.cant}× ${esc(i.nombre)}</b>${i.tipo === 'preventa' ? `<small>Preventa${i.entrega ? ' · ' + esc(mesTxt(i.entrega)) : ''}</small>` : ''}</span><b>${$$(i.precio * i.cant)}</b></div>`).join('')}
    <div class="shop-tot"><span>Subtotal</span><span>${$$(p.subtotal)}</span><span>${esc(p.envio.nombre)}</span><span>${costoTxt(p.envio.costo)}</span><span class="g">Total</span><span class="g">${$$(p.total)}</span></div>
    ${per && p.datos && p.estado !== 'entregado' ? '' : `<h3>¿Dudas con tu pedido?</h3><p class="shop-small">Escríbenos y menciona el folio <b>${esc(p.id)}</b>.</p>${botonesContacto(p.id)}`}`;
  const guardarTxt = per ? 'Guardar mis datos' : 'Guardar dirección';
  const pie = p.estado === 'pagado' ? `<button class="btn" type="button" id="oGuardar">${guardarTxt}</button>` : p.estado === 'pendiente' && p.pagoUrl ? `<a class="btn shop-mp" href="${esc(p.pagoUrl)}">Terminar pago en Mercado Pago</a>` : '';
  abrirHoja('ped', 'Pedido ' + p.id, cuerpo, pie); activarContacto();
  if ($('oGuardar')) { prepararForm(); $('oGuardar').onclick = () => guardarEnvio(p, clave); }
  if ($('oEdit')) $('oEdit').onclick = () => { $('hBody').innerHTML = '<h3>' + (per ? 'Corregir mis datos' : 'Corregir dirección') + '</h3>' + formEnvio(p); $('hPie').hidden = false; $('hPie').innerHTML = '<button class="btn" type="button" id="oGuardar">' + guardarTxt + '</button><button class="btn btn--ghost" type="button" id="oCanc">Cancelar</button>'; prepararForm(); $('oGuardar').onclick = () => guardarEnvio(p, clave); $('oCanc').onclick = () => abrirPedido(id); };
  if ($('oCopia')) $('oCopia').onclick = () => navigator.clipboard.writeText(p.guia).then(() => toast('✓ Guía copiada')).catch(() => toast(p.guia));
  clearInterval(_sondeo);
  if (p.estado === 'pendiente' && recien) { let n = 0; _sondeo = setInterval(async () => { if (++n > 15 || _hoja !== 'ped') { clearInterval(_sondeo); return; }
    try { const r = await API.pedido(id, clave); if (r.pedido.estado !== 'pendiente') { clearInterval(_sondeo); actualizarPed(r.pedido); abrirPedido(id); } } catch (e) {} }, 4000); }
}
function actualizarPed(p) { const i = PEDS.findIndex(x => x.id === p.id); if (i >= 0) PEDS[i] = p; else PEDS.unshift(p); ls.set('yz_peds', PEDS); pintarPedidos(); }
function formEnvio(p) {
  const cli = ls.get(K_CLI, {}), d = p.datos || Object.assign({ nombre: cli.nombre, telefono: cli.telefono, email: cli.email }, ls.get(K_DIR, {}));
  const campo = (k, t, extra, w) => `<label class="${w ? 'w' : ''}" data-c="${k}">${t}<input id="f_${k}" value="${esc(d[k] || '')}" ${extra || ''}><span class="msg"></span></label>`;
  if (esPersonal(p)) return `<div class="shop-form">${campo('nombre', 'Nombre de quien recoge', 'autocomplete="name" maxlength="80"', 1)}
    ${campo('telefono', 'Teléfono (10 dígitos)', 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14"')}${campo('email', 'Correo', 'type="email" autocomplete="email" maxlength="80"')}
    <label class="w" data-c="referencias">¿Dónde y cuándo te queda bien? (opcional)<textarea id="f_referencias" maxlength="200" placeholder="Zona, punto de encuentro, días y horarios…">${esc(p.datos ? p.datos.referencias || '' : '')}</textarea></label></div>`;
  return `<div class="shop-form">${campo('nombre', 'Nombre de quien recibe', 'autocomplete="name" maxlength="80"', 1)}
    ${campo('telefono', 'Teléfono (10 dígitos)', 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="14"')}${campo('email', 'Correo', 'type="email" autocomplete="email" maxlength="80"')}
    ${campo('calle', 'Calle y número exterior', 'autocomplete="address-line1" maxlength="120"', 1)}
    ${campo('interior', 'Núm. interior (opcional)', 'maxlength="20"')}${campo('cp', 'Código postal', 'inputmode="numeric" autocomplete="postal-code" maxlength="5"')}
    ${campo('colonia', 'Colonia', 'maxlength="80"', 1)}${campo('municipio', 'Municipio o alcaldía', 'autocomplete="address-level2" maxlength="80"')}
    <label data-c="estado">Estado<select id="f_estado" autocomplete="address-level1"><option value="">Elige…</option>${ESTADOS_MX.map(e => `<option${d.estado === e ? ' selected' : ''}>${e}</option>`).join('')}</select><span class="msg"></span></label>
    <label class="w" data-c="referencias">Referencias (opcional)<textarea id="f_referencias" maxlength="200" placeholder="Entre calles, color de fachada…">${esc(d.referencias || '')}</textarea></label>
    <label class="shop-chk w"><input type="checkbox" id="f_recordar" checked> Recordar esta dirección en este navegador</label></div>`;
}
function prepararForm() { $('f_telefono').addEventListener('input', e => e.target.value = e.target.value.replace(/[^\d ]/g, '')); if ($('f_cp')) $('f_cp').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '')); }
function leerForm() {
  const v = k => $('f_' + k) ? ($('f_' + k).value || '').trim() : '', d = {}, per = !$('f_calle'); let ok = true;
  ['nombre', 'telefono', 'email', 'calle', 'interior', 'cp', 'colonia', 'municipio', 'estado', 'referencias'].forEach(k => d[k] = v(k));
  d.telefono = d.telefono.replace(/\D/g, '');
  const err = { nombre: d.nombre.length < 5 && 'Escribe nombre y apellido', telefono: !/^\d{10}$/.test(d.telefono) && 'Deben ser 10 dígitos', email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) && 'Revisa el correo',
    calle: !per && d.calle.length < 4 && 'Escribe calle y número', cp: !per && !/^\d{5}$/.test(d.cp) && 'Deben ser 5 dígitos', colonia: !per && !d.colonia && 'Escribe la colonia', municipio: !per && !d.municipio && 'Escribe el municipio', estado: !per && !d.estado && 'Elige el estado' };
  document.querySelectorAll('#hBody .shop-form [data-c]').forEach(l => { const m = err[l.dataset.c]; l.classList.toggle('err', !!m); const s = l.querySelector('.msg'); if (s) s.textContent = m || ''; if (m) ok = false; });
  if (!ok) { const f = document.querySelector('.shop-form .err input,.shop-form .err select'); f && f.focus(); toast('Revisa los campos marcados', true); return null; }
  return d;
}
async function guardarEnvio(p, clave) {
  const d = leerForm(); if (!d) return; const b = $('oGuardar'); b.disabled = true; b.textContent = 'Guardando…';
  const per = esPersonal(p);
  try { if ($('f_recordar')) { if ($('f_recordar').checked) ls.set(K_DIR, Object.assign({}, d)); else localStorage.removeItem(K_DIR); }
    const r = await API.envio(p.id, clave, d); actualizarPed(r.pedido); toast(per ? '✓ Datos guardados. Ahora escríbenos para acordar la entrega.' : '✓ Dirección guardada. Te avisaremos cuando salga tu pedido.'); abrirPedido(p.id); }
  catch (e) { toast(e.message, true); b.disabled = false; b.textContent = per ? 'Guardar mis datos' : 'Guardar dirección'; }
}

/* ── Regreso desde Mercado Pago (?pedido=…&clave=…&status=…) ── */
async function alRegresar() {
  const u = new URLSearchParams(location.search), id = u.get('pedido'), clave = u.get('clave');
  if (!id || !clave) return;
  const claves = ls.get(K_CLAVES, {}); claves[id] = clave; ls.set(K_CLAVES, claves);
  history.replaceState(null, '', location.pathname); verTab('pedidos');
  try { const r = await API.pedido(id, clave); actualizarPed(r.pedido); abrirPedido(id, true);
    if (r.pedido.estado === 'pagado') toast('✓ ¡Pago recibido! Captura tu dirección de envío'); }
  catch (e) { toast(e.message, true); }
}

function verTab(t) {
  TAB = t; document.querySelectorAll('.shop-tabs [data-tab]').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
  $('vProd').hidden = t !== 'productos'; $('vPed').hidden = t !== 'pedidos'; if (t === 'pedidos') cargarPedidos();
}
document.querySelectorAll('.shop-tabs [data-tab]').forEach(b => b.onclick = () => verTab(b.dataset.tab));
$('bCarro').onclick = abrirCarro;
/* El carrito del encabezado abre el panel en esta página */
document.querySelectorAll('.cart-btn').forEach(a => a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); abrirCarro(); }, true));

cargarCatalogo().then(() => {
  cargarPedidos(); alRegresar();
  const q = new URLSearchParams(location.search);
  if (q.get('carrito') != null) { history.replaceState(null, '', location.pathname); abrirCarro(); }
  else if (q.get('tab') === 'pedidos') verTab('pedidos');
});
})();
