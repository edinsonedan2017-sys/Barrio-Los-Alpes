// ═══════════════════════════════════════════════════════════════
// services/app.js — Lógica principal del frontend
// Reemplaza index.html inline <script> + script.html de Apps Script
// ═══════════════════════════════════════════════════════════════
import CONFIG from './config.js';
import {
  getConfiguracion, getNoticias, getEventos, getServicios,
  getGaleria, guardarNoticia, actualizarNoticia, eliminarNoticia,
  guardarEvento, actualizarEvento, eliminarEvento,
  guardarEnGaleria, eliminarImagen, subirImagen,
  guardarContacto, getContactosAdmin, getEstadisticas,
} from './services-supabase.js';

// ── ESTADO GLOBAL ────────────────────────────────────────────
export const APP = {
  config:       {},
  noticias:     [],
  eventos:      [],
  servicios:    [],
  galeria:      [],
  adminMode:    false,
  serviceKey:   null,   // se setea tras login admin
  uploadFiles:  [],
};

// ════════════════════════════════════════════════════════════════
// INICIO — un único punto de entrada
// ════════════════════════════════════════════════════════════════
export function iniciarApp() {
  cargarConfiguracion();
  cargarNoticias();
  cargarEventos();
  cargarServicios();
  cargarGaleria();
  initNavbar();
  initHamburger();
  initModal();
  initObserver();
  setTimeout(ocultarLoader, 1600);
}

function ocultarLoader() {
  const l = document.getElementById('loader');
  if (l) { l.classList.add('hide'); setTimeout(() => l.style.display = 'none', 600); }
}

// ════════════════════════════════════════════════════════════════
// CARGA DE DATOS
// ════════════════════════════════════════════════════════════════
async function cargarConfiguracion() {
  try {
    APP.config = await getConfiguracion();
    const c = APP.config;
    // WhatsApp
    const waUrl = CONFIG.WA_BASE + (c.whatsapp_numero || CONFIG.WA_NUMBER);
    document.querySelectorAll('.wa-link').forEach(el => el.href = waUrl);
    // Facebook / Instagram
    document.querySelectorAll('.fb-link').forEach(el => el.href = c.facebook_url || '#');
    document.querySelectorAll('.ig-link').forEach(el => el.href = c.instagram_url || '#');
    // Textos dinámicos
    setText('lema-footer',    `"${c.barrio_lema || 'Un barrio, una comunidad, unidos siempre'}"`);
    setText('jac-presidente', [c.jac_presidente, c.jac_secretario].filter(Boolean).join(' · '));
    setText('jac-email',   c.jac_email   || 'jac.losalpes@gmail.com');
    setText('jac-horario', c.jac_horario || 'Lunes a Sábado 8am - 12pm');
  } catch (e) { console.error('Config:', e); }
}

export async function cargarNoticias() {
  try {
    APP.noticias = await getNoticias();
    renderizarNoticias(APP.noticias);
  } catch (e) { errSec('noticias-container', e.message); }
}

export async function cargarEventos() {
  try {
    APP.eventos = await getEventos();
    renderizarEventos(APP.eventos);
  } catch (e) { errSec('eventos-container', e.message); }
}

export async function cargarServicios() {
  try {
    APP.servicios = await getServicios();
    renderizarServicios(APP.servicios);
  } catch (e) { errSec('servicios-container', e.message); }
}

export async function cargarGaleria() {
  try {
    APP.galeria = await getGaleria();
    renderizarGaleria(APP.galeria);
  } catch (e) { errSec('galeria-container', e.message); }
}

export async function cargarEstadisticas() {
  try {
    const d = await getEstadisticas();
    setValue('stat-noticias',  d.noticias);
    setValue('stat-eventos',   d.eventos);
    setValue('stat-servicios', d.servicios);
    setValue('stat-galeria',   d.galeria);
    // contactos requiere serviceKey
    if (APP.serviceKey) {
      const contactos = await getContactosAdmin(APP.serviceKey);
      setValue('stat-contactos', contactos.length);
    }
  } catch (e) { console.error('Stats:', e); }
}

// ════════════════════════════════════════════════════════════════
// RENDERIZADORES
// ════════════════════════════════════════════════════════════════
function renderizarNoticias(noticias) {
  const c = document.getElementById('noticias-container');
  if (!c) return;
  if (!noticias?.length) { c.innerHTML = msgVacio('No hay noticias publicadas aún.'); return; }

  const dest  = noticias.find(n => n.destacada) || noticias[0];
  const resto = noticias.filter(n => n !== dest).slice(0, 4);
  const al    = dest.tipo === 'Alerta';

  let h = '<div class="not-grid">';
  h += `<div class="not-main not-clickable" onclick="window._app.abrirModalNoticia('${dest.id}')">`;
  h += `<span class="not-badge${al ? ' al' : ''}">📌 ${esc(dest.tipo || 'Noticia')}</span>`;
  h += `<h3>${esc(dest.titulo)}</h3><p>${esc(dest.descripcion)}</p>`;
  h += `<div class="not-date">📅 ${esc(dest.created_at?.slice(0,10) || '')} · ${esc(dest.autor || 'JAC Los Alpes')}</div>`;
  if (dest.imagen_url) h += `<img class="not-img" src="${esc(dest.imagen_url)}" alt="" onerror="this.style.display='none'">`;
  h += `<div class="not-leer">${APP.adminMode ? '✏️ Editar noticia' : 'Leer noticia completa →'}</div>`;
  if (APP.adminMode) h += `<button class="btn-del not-del-btn" onclick="event.stopPropagation();window._app.eliminarNt('${dest.id}')">🗑️ Eliminar</button>`;
  h += '</div>';

  h += '<div class="not-list">';
  resto.forEach(n => {
    const a2 = n.tipo === 'Alerta';
    h += `<div class="ni${a2 ? ' al' : ''} not-clickable" onclick="window._app.abrirModalNoticia('${n.id}')">`;
    h += `<div class="ni-tipo">${a2 ? '⚠️' : '🔔'} ${esc(n.tipo || 'Noticia')}</div>`;
    h += `<h4>${esc(n.titulo)}</h4>`;
    h += `<p>${esc((n.descripcion || '').substring(0, 100))}${n.descripcion?.length > 100 ? '...' : ''}</p>`;
    h += `<div class="ni-leer">${APP.adminMode ? '✏️ Editar' : 'Ver más →'}</div>`;
    if (APP.adminMode) h += `<button class="btn-del" style="margin-top:6px;font-size:.69rem" onclick="event.stopPropagation();window._app.eliminarNt('${n.id}')">🗑️</button>`;
    h += '</div>';
  });
  h += '</div></div>';
  c.innerHTML = h;
}

function renderizarEventos(eventos) {
  const c = document.getElementById('eventos-container');
  if (!c) return;
  if (!eventos?.length) { c.innerHTML = msgVacio('No hay eventos próximos.'); return; }
  const COLS  = ['vd','az','do'];
  const TAGS  = ['vd','az','na'];
  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  let h = '<div class="ev-grid">';
  eventos.slice(0, 3).forEach((ev, i) => {
    const f   = String(ev.fecha || '');
    const p   = f.split('-');
    const dia = p[2]?.substring(0, 2) || '--';
    const mes = MESES[p[1] ? parseInt(p[1], 10) - 1 : 0] || 'MES';
    const col = COLS[i % 3]; const tag = TAGS[i % 3];
    h += `<div class="evc fi not-clickable" onclick="window._app.abrirModalEvento('${ev.id}')">`;
    h += `<div class="ev-head ${col}">`;
    if (ev.imagen_url) h += `<img class="ev-bg-img" src="${esc(ev.imagen_url)}" alt="" onerror="this.style.display='none'">`;
    h += `<div class="ev-overlay"><div class="ev-dia">${dia}</div><div class="ev-mes">${mes} ${p[0] || ''}</div></div></div>`;
    h += `<div class="ev-body"><span class="ev-tag ${tag}">${esc(ev.tipo || 'Evento')}</span>`;
    h += `<h3>${esc(ev.nombre)}</h3><p>${esc((ev.descripcion || '').substring(0, 90))}${(ev.descripcion?.length || 0) > 90 ? '...' : ''}</p>`;
    if (ev.lugar) h += `<p style="margin-top:7px;font-size:.76rem;color:var(--gris)">📍 ${esc(ev.lugar)} · ${esc(ev.hora || '')}</p>`;
    h += `<div class="ni-leer" style="margin-top:10px">${APP.adminMode ? '✏️ Editar evento' : 'Ver detalles →'}</div>`;
    if (APP.adminMode) h += `<button class="btn-del" style="margin-top:8px" onclick="event.stopPropagation();window._app.eliminarEv('${ev.id}')">🗑️ Eliminar</button>`;
    h += '</div></div>';
  });
  h += '</div>'; c.innerHTML = h; initObserver();
}

function renderizarServicios(servicios) {
  const c = document.getElementById('servicios-container');
  if (!c) return;
  if (!servicios?.length) { c.innerHTML = msgVacio('Sin servicios registrados.'); return; }
  const IC = { Seguridad:'🚨', Comunidad:'🏛️', Educacion:'🏫', Servicios:'🔧', Emergencias:'⛑️', Salud:'💊', Fe:'⛪' };
  let h = '<div class="sv-grid">';
  servicios.forEach(s => {
    h += '<div class="svc fi">';
    if (s.imagen_url) h += `<img class="sv-img" src="${esc(s.imagen_url)}" alt="" onerror="this.style.display='none'">`;
    h += `<div class="sv-ic">${IC[s.tipo] || s.icono || '🔧'}</div>`;
    h += `<h3>${esc(s.nombre)}</h3><p>${esc(s.descripcion)}</p>`;
    h += `<div class="sv-ct">📞 ${esc(s.contacto)}</div>`;
    if (s.horario) h += `<div class="sv-hr">🕐 ${esc(s.horario)}</div>`;
    h += '</div>';
  });
  h += '</div>'; c.innerHTML = h; initObserver();
}

function renderizarGaleria(items) {
  const c = document.getElementById('galeria-container');
  if (!c) return;
  if (!items?.length) { c.innerHTML = msgVacio('Sin imágenes en la galería.'); return; }
  const BG = ['linear-gradient(135deg,#0f4f2e,#1a7a4a)','linear-gradient(135deg,#0d2f5a,#2563b0)',
    'linear-gradient(135deg,#7c2d12,#c2410c)','linear-gradient(135deg,#1a4d8a,#27a760)',
    'linear-gradient(135deg,#065f46,#059669)','linear-gradient(135deg,#4a044e,#7e22ce)',
    'linear-gradient(135deg,#1a4d8a,#0f4f2e)','linear-gradient(135deg,#374151,#1f2937)'];
  const IC = ['🏔️','🏘️','⚽','🏛️','🌳','🎉','🏫','🛣️'];
  let h = '<div class="gal-grid">';
  items.forEach((item, i) => {
    const feat = i === 0;
    h += `<div class="gal-item${feat ? ' feat' : ''}" style="background:${BG[i % BG.length]}">`;
    if (item.imagen_url) h += `<img src="${esc(item.imagen_url)}" alt="${esc(item.titulo || '')}" onerror="this.style.display='none'">`;
    h += `<div class="gal-ph">${IC[i % IC.length]}</div>`;
    h += `<div class="gal-ov"><span>${esc(item.titulo || 'Sin título')}</span></div>`;
    h += `<div class="gal-lbl">${esc(item.categoria || 'General')}</div>`;
    if (APP.adminMode) h += `<button class="gal-del" onclick="window._app.eliminarImg('${item.id}',event)">🗑️</button>`;
    h += '</div>';
  });
  h += '</div><p style="text-align:center;margin-top:18px;color:var(--gris);font-size:.84rem;">📸 Comparte tus fotos en el grupo de WhatsApp</p>';
  c.innerHTML = h;
}

// ════════════════════════════════════════════════════════════════
// LOGIN ADMIN
// ════════════════════════════════════════════════════════════════
let _intentosFallidos = 0;
let _bloqueadoHasta   = 0;

export function abrirLogin() {
  if (APP.adminMode) { toggleAdmin(); return; }
  const mo = document.getElementById('login-modal');
  mo.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-pass').type = 'password';
  setTimeout(() => document.getElementById('login-user')?.focus(), 200);
}

export function cerrarLogin() {
  document.getElementById('login-modal').classList.remove('open');
  document.body.style.overflow = '';
}

export function togglePassVis() {
  const inp = document.getElementById('login-pass');
  const btn = document.getElementById('eye-btn');
  if (inp.type === 'password') { inp.type = 'text'; btn.style.opacity = '1'; }
  else { inp.type = 'password'; btn.style.opacity = '.5'; }
}

export function hacerLogin() {
  const ahora = Date.now();
  if (_intentosFallidos >= 5 && ahora < _bloqueadoHasta) {
    const seg = Math.ceil((_bloqueadoHasta - ahora) / 1000);
    mostrarErrorLogin(`Demasiados intentos. Espera ${seg} segundos.`); return;
  }
  if (_intentosFallidos >= 5 && ahora >= _bloqueadoHasta) _intentosFallidos = 0;

  const usuario = document.getElementById('login-user').value.trim();
  const clave   = document.getElementById('login-pass').value;
  if (!usuario || !clave) { mostrarErrorLogin('Completa usuario y contraseña.'); return; }

  const btn = document.getElementById('login-submit');
  btn.disabled = true;
  document.getElementById('login-btn-txt').textContent = 'Verificando...';

  setTimeout(() => {
    btn.disabled = false;
    document.getElementById('login-btn-txt').innerHTML = '🔐 Ingresar al panel';
    if (usuario === CONFIG.ADMIN_USER && clave === CONFIG.ADMIN_PASS) {
      _intentosFallidos = 0;
      cerrarLogin();
      setTimeout(toggleAdmin, 180);
    } else {
      _intentosFallidos++;
      if (_intentosFallidos >= 5) {
        _bloqueadoHasta = Date.now() + 30000;
        mostrarErrorLogin('Demasiados intentos. Bloqueado 30 segundos.');
      } else {
        const r = 5 - _intentosFallidos;
        mostrarErrorLogin(`Credenciales incorrectas. (${r} intento${r === 1 ? '' : 's'} restante${r === 1 ? '' : 's'})`);
      }
      const panel = document.querySelector('.login-panel');
      panel.classList.remove('login-shake');
      void panel.offsetWidth;
      panel.classList.add('login-shake');
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
    }
  }, 500);
}

function mostrarErrorLogin(msg) {
  const err = document.getElementById('login-error');
  err.textContent = '⚠️ ' + msg;
  err.style.display = 'block';
}

// ════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════════════════════
export function toggleAdmin() {
  APP.adminMode = !APP.adminMode;
  const panel = document.getElementById('admin-panel');
  const btn   = document.getElementById('admin-toggle-btn');
  if (APP.adminMode) {
    panel.style.display = 'block';
    btn.textContent     = '🔒 Cerrar sesión Admin';
    btn.style.background     = '#dc2626';
    btn.style.color          = '#fff';
    btn.style.borderColor    = '#dc2626';
    cargarEstadisticas();
    setTimeout(initUploadArea, 200);
    cargarTablaContactos();
    toast('Bienvenido, Administrador ✓', 'success');
  } else {
    panel.style.display  = 'none';
    btn.textContent      = '⚙️ Administrar';
    btn.style.background = 'rgba(255,255,255,.1)';
    btn.style.color      = 'rgba(255,255,255,.6)';
    btn.style.borderColor = 'rgba(255,255,255,.2)';
    toast('Sesión cerrada', 'info');
  }
  renderizarNoticias(APP.noticias);
  renderizarEventos(APP.eventos);
  renderizarGaleria(APP.galeria);
}

export function activarTab(nombre) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-c').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${nombre}"]`)?.classList.add('active');
  document.getElementById(`tab-${nombre}`)?.classList.add('active');
  if (nombre === 'contactos') cargarTablaContactos();
  if (nombre === 'imagenes') setTimeout(initUploadArea, 100);
}

async function cargarTablaContactos() {
  const t = document.getElementById('tabla-contactos');
  if (!t) return;
  t.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gris)">Cargando...</td></tr>';
  try {
    const data = await getContactosAdmin(APP.serviceKey || CONFIG.SUPABASE_ANON_KEY);
    if (!data?.length) { t.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gris)">Sin mensajes recibidos.</td></tr>'; return; }
    t.innerHTML = data.map(c =>
      `<tr><td>${esc(c.id?.slice(0,8) || '')}</td><td><strong>${esc(c.nombre)}</strong></td>
       <td>${esc(c.telefono || '-')}</td><td>${esc(c.tipo_mensaje)}</td>
       <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((c.mensaje || '').substring(0, 60))}</td>
       <td>${esc(c.created_at?.slice(0, 16).replace('T', ' ') || '')}</td></tr>`
    ).join('');
  } catch { t.innerHTML = '<tr><td colspan="6">Error al cargar.</td></tr>'; }
}

// ════════════════════════════════════════════════════════════════
// CRUD DESDE PANEL ADMIN
// ════════════════════════════════════════════════════════════════
export async function guardarNoticiaAdmin() {
  const t  = v('adm-not-titulo'), d = v('adm-not-desc');
  const ti = v('adm-not-tipo'),  a  = v('adm-not-autor') || 'JAC Los Alpes';
  const de = v('adm-not-dest'),  im = document.getElementById('adm-not-img')?.value || '';
  if (!t || !d) { toast('Completa título y descripción', 'error'); return; }
  const btn = document.getElementById('btn-not-save'); btn.disabled = true;
  try {
    await guardarNoticia({ titulo: t, descripcion: d, tipo: ti, autor: a, destacada: de, imagenUrl: im }, APP.serviceKey);
    toast('Noticia publicada ✓', 'success');
    clearInputs(['adm-not-titulo', 'adm-not-desc']); quitarImagenPanel('not');
    await cargarNoticias(); await cargarEstadisticas();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  btn.disabled = false;
}

export async function guardarEventoAdmin() {
  const n  = v('adm-ev-nombre'), d = v('adm-ev-desc'), f = v('adm-ev-fecha');
  const h  = v('adm-ev-hora'),   l = v('adm-ev-lugar'), t = v('adm-ev-tipo');
  const im = document.getElementById('adm-ev-img')?.value || '';
  if (!n || !f) { toast('Completa nombre y fecha', 'error'); return; }
  const btn = document.getElementById('btn-ev-save'); btn.disabled = true;
  try {
    await guardarEvento({ nombre: n, descripcion: d, fecha: f, hora: h, lugar: l, tipo: t, imagenUrl: im }, APP.serviceKey);
    toast('Evento guardado ✓', 'success');
    clearInputs(['adm-ev-nombre', 'adm-ev-desc', 'adm-ev-fecha']); quitarImagenPanel('ev');
    await cargarEventos(); await cargarEstadisticas();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  btn.disabled = false;
}

export async function eliminarNt(id) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  try {
    await eliminarNoticia(id, APP.serviceKey);
    toast('Noticia eliminada', 'success'); await cargarNoticias();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

export async function eliminarEv(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  try {
    await eliminarEvento(id, APP.serviceKey);
    toast('Evento eliminado', 'success'); await cargarEventos();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

export async function eliminarImg(id, evt) {
  evt.stopPropagation();
  if (!confirm('¿Eliminar esta imagen permanentemente?')) return;
  try {
    await eliminarImagen(id, APP.serviceKey);
    toast('Imagen eliminada', 'success'); await cargarGaleria();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

// ════════════════════════════════════════════════════════════════
// MODAL DETALLE / EDICIÓN
// ════════════════════════════════════════════════════════════════
export function abrirModalNoticia(id) {
  const n = APP.noticias.find(x => x.id === id); if (!n) return;
  const al = n.tipo === 'Alerta';
  const mo = document.getElementById('detalle-modal');
  const body = document.getElementById('detalle-body');

  if (APP.adminMode) {
    body.innerHTML =
      `<div class="dm-badge${al ? ' al' : ''}">${al ? '⚠️' : '📌'} ${esc(n.tipo)}</div>
      <div class="dm-field"><label>Título</label><input id="dm-titulo" class="dm-input" value="${esc(n.titulo)}"></div>
      <div class="dm-field"><label>Tipo</label>
        <select id="dm-tipo" class="dm-input">
          ${['Infraestructura','Seguridad','Alerta','Educacion','Salud','Reunion JAC','General']
            .map(t => `<option${n.tipo === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="dm-field"><label>Descripción</label><textarea id="dm-desc" class="dm-input dm-ta">${esc(n.descripcion)}</textarea></div>
      <div class="dm-field"><label>Autor</label><input id="dm-autor" class="dm-input" value="${esc(n.autor || '')}"></div>
      <div class="dm-field"><label>Imagen</label>
        <div class="img-up-wrap" id="dm-not-img-wrap">
          <input type="hidden" id="dm-img" value="${esc(n.imagen_url || '')}">
          <div class="img-up-preview" id="dm-not-img-preview" style="${n.imagen_url ? '' : 'display:none'}">
            <img src="${esc(n.imagen_url || '')}" class="img-up-thumb" id="dm-not-img-thumb">
            <button type="button" class="img-up-remove" onclick="window._app.quitarImagenModal('dm-not')">✕</button>
          </div>
          <label class="img-up-btn img-up-btn-sm" id="dm-not-img-label" style="${n.imagen_url ? 'display:none' : ''}">
            <input type="file" accept="image/*" style="display:none" onchange="window._app.subirImagenModal(this,'dm-not','dm-img')">
            📷 ${n.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
          </label>
          <div class="img-up-status" id="dm-not-img-status"></div>
        </div></div>
      <div class="dm-field"><label>Destacada</label>
        <select id="dm-dest" class="dm-input">
          <option value="SI"${n.destacada ? ' selected' : ''}>Sí, destacar</option>
          <option value="NO"${!n.destacada ? ' selected' : ''}>No destacar</option>
        </select></div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="dm-btn-save" onclick="window._app.guardarEdicionNoticia('${n.id}')">💾 Guardar cambios</button>
        <button class="dm-btn-del" onclick="window._app.eliminarNt('${n.id}');cerrarModal()">🗑️ Eliminar</button>
      </div>`;
  } else {
    body.innerHTML =
      `<div class="dm-badge${al ? ' al' : ''}">${al ? '⚠️' : '📌'} ${esc(n.tipo)}</div>
      <h2 class="dm-h2">${esc(n.titulo)}</h2>
      <div class="dm-meta">📅 ${esc(n.created_at?.slice(0,10) || '')} &nbsp;·&nbsp; ✍️ ${esc(n.autor || 'JAC Los Alpes')}</div>
      ${n.imagen_url ? `<img src="${esc(n.imagen_url)}" class="dm-img" onerror="this.style.display='none'">` : ''}
      <p class="dm-text">${esc(n.descripcion)}</p>
      <a href="${CONFIG.WA_BASE}${CONFIG.WA_NUMBER}" target="_blank" class="dm-wa-btn">💬 Compartir en WhatsApp</a>`;
  }
  document.getElementById('detalle-titulo').textContent = APP.adminMode ? '✏️ Editar Noticia' : n.titulo;
  mo.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function abrirModalEvento(id) {
  const ev = APP.eventos.find(x => x.id === id); if (!ev) return;
  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const p   = String(ev.fecha || '').split('-');
  const dia = p[2]?.substring(0,2) || '--';
  const mes = MESES[p[1] ? parseInt(p[1],10)-1 : 0] || 'MES';
  const mo  = document.getElementById('detalle-modal');
  const body = document.getElementById('detalle-body');

  if (APP.adminMode) {
    body.innerHTML =
      `<div class="dm-field"><label>Nombre</label><input id="dm-ev-nombre" class="dm-input" value="${esc(ev.nombre)}"></div>
      <div class="dm-field"><label>Tipo</label>
        <select id="dm-ev-tipo" class="dm-input">
          ${['Reunion Comunal','Deporte','Aniversario','Cultural','Ambiental','Social']
            .map(t => `<option${ev.tipo === t ? ' selected' : ''}>${t}</option>`).join('')}
        </select></div>
      <div class="dm-field"><label>Descripción</label><textarea id="dm-ev-desc" class="dm-input dm-ta">${esc(ev.descripcion)}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="dm-field"><label>Fecha</label><input id="dm-ev-fecha" type="date" class="dm-input" value="${esc(ev.fecha)}"></div>
        <div class="dm-field"><label>Hora</label><input id="dm-ev-hora" type="time" class="dm-input" value="${esc(ev.hora || '')}"></div>
      </div>
      <div class="dm-field"><label>Lugar</label><input id="dm-ev-lugar" class="dm-input" value="${esc(ev.lugar || '')}"></div>
      <div class="dm-field"><label>Imagen</label>
        <div class="img-up-wrap" id="dm-ev-img-wrap">
          <input type="hidden" id="dm-ev-img" value="${esc(ev.imagen_url || '')}">
          <div class="img-up-preview" id="dm-ev-img-preview" style="${ev.imagen_url ? '' : 'display:none'}">
            <img src="${esc(ev.imagen_url || '')}" class="img-up-thumb" id="dm-ev-img-thumb">
            <button type="button" class="img-up-remove" onclick="window._app.quitarImagenModal('dm-ev')">✕</button>
          </div>
          <label class="img-up-btn img-up-btn-sm" id="dm-ev-img-label" style="${ev.imagen_url ? 'display:none' : ''}">
            <input type="file" accept="image/*" style="display:none" onchange="window._app.subirImagenModal(this,'dm-ev','dm-ev-img')">
            📷 Subir imagen
          </label>
          <div class="img-up-status" id="dm-ev-img-status"></div>
        </div></div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="dm-btn-save" onclick="window._app.guardarEdicionEvento('${ev.id}')">💾 Guardar cambios</button>
        <button class="dm-btn-del" onclick="window._app.eliminarEv('${ev.id}');cerrarModal()">🗑️ Eliminar</button>
      </div>`;
  } else {
    body.innerHTML =
      `<div class="dm-fecha-big"><span class="dm-dia">${dia}</span><span class="dm-mes">${mes} ${p[0] || ''}</span></div>
      <h2 class="dm-h2">${esc(ev.nombre)}</h2>
      <div class="dm-meta">🕐 ${esc(ev.hora || '')} &nbsp; 📍 ${esc(ev.lugar || 'Barrio Los Alpes')}</div>
      ${ev.imagen_url ? `<img src="${esc(ev.imagen_url)}" class="dm-img" onerror="this.style.display='none'">` : ''}
      <p class="dm-text">${esc(ev.descripcion)}</p>
      <a href="${CONFIG.WA_BASE}${CONFIG.WA_NUMBER}" target="_blank" class="dm-wa-btn">💬 Agendar en WhatsApp</a>`;
  }
  document.getElementById('detalle-titulo').textContent = APP.adminMode ? '✏️ Editar Evento' : ev.nombre;
  mo.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function cerrarModal() {
  document.getElementById('detalle-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Guardar edición desde modal ───────────────────────────────
export async function guardarEdicionNoticia(id) {
  const titulo = v('dm-titulo'), desc = v('dm-desc'), tipo = v('dm-tipo');
  const autor  = v('dm-autor') || 'JAC Los Alpes';
  const img    = document.getElementById('dm-img')?.value || '';
  const dest   = v('dm-dest');
  if (!titulo || !desc) { toast('Completa título y descripción', 'error'); return; }
  const btn = document.querySelector('.dm-btn-save'); if (btn) btn.disabled = true;
  try {
    await actualizarNoticia(id, { titulo, descripcion: desc, tipo, autor, imagenUrl: img, destacada: dest }, APP.serviceKey);
    toast('Noticia actualizada ✓', 'success');
    cerrarModal(); await cargarNoticias();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  if (btn) btn.disabled = false;
}

export async function guardarEdicionEvento(id) {
  const nombre = v('dm-ev-nombre'), desc = v('dm-ev-desc'), tipo = v('dm-ev-tipo');
  const fecha  = v('dm-ev-fecha'), hora = v('dm-ev-hora'), lugar = v('dm-ev-lugar');
  const img    = document.getElementById('dm-ev-img')?.value || '';
  if (!nombre || !fecha) { toast('Completa nombre y fecha', 'error'); return; }
  const btn = document.querySelector('.dm-btn-save'); if (btn) btn.disabled = true;
  try {
    await actualizarEvento(id, { nombre, descripcion: desc, tipo, fecha, hora, lugar, imagenUrl: img }, APP.serviceKey);
    toast('Evento actualizado ✓', 'success');
    cerrarModal(); await cargarEventos();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  if (btn) btn.disabled = false;
}

// ════════════════════════════════════════════════════════════════
// SUBIDA DE IMÁGENES (Supabase Storage)
// ════════════════════════════════════════════════════════════════
async function _subirArchivo(file, onSuccess, onError) {
  if (!file?.type.startsWith('image/')) { onError('El archivo debe ser una imagen.'); return; }
  if (file.size > 5 * 1024 * 1024) { onError('La imagen no debe superar 5 MB.'); return; }
  try {
    const url = await subirImagen(file, APP.serviceKey);
    onSuccess(url);
  } catch (e) { onError(e.message); }
}

export function subirImagenPanel(input, prefix) {
  const file = input.files[0]; if (!file) return;
  const statusEl  = document.getElementById(`${prefix}-img-status`);
  const labelEl   = document.getElementById(`${prefix}-img-label`);
  const previewEl = document.getElementById(`${prefix}-img-preview`);
  const thumbEl   = document.getElementById(`${prefix}-img-thumb`);
  const hiddenEl  = document.getElementById(`adm-${prefix}-img`);
  statusEl.textContent = '⏳ Subiendo imagen...';
  statusEl.style.color = 'var(--gris)';
  labelEl.style.opacity = '.5'; labelEl.style.pointerEvents = 'none';
  _subirArchivo(file,
    url => { hiddenEl.value = url; thumbEl.src = url; previewEl.style.display = 'flex'; labelEl.style.display = 'none'; statusEl.textContent = '✅ Imagen subida correctamente'; statusEl.style.color = 'var(--verde)'; input.value = ''; },
    err => { statusEl.textContent = '❌ ' + err; statusEl.style.color = '#dc2626'; labelEl.style.opacity = '1'; labelEl.style.pointerEvents = ''; }
  );
}

export function quitarImagenPanel(prefix) {
  const hiddenEl = document.getElementById(`adm-${prefix}-img`);
  if (hiddenEl) hiddenEl.value = '';
  const p = document.getElementById(`${prefix}-img-preview`); if (p) p.style.display = 'none';
  const l = document.getElementById(`${prefix}-img-label`); if (l) { l.style.display = ''; l.style.opacity = '1'; l.style.pointerEvents = ''; }
  const s = document.getElementById(`${prefix}-img-status`); if (s) s.textContent = '';
}

export function subirImagenModal(input, prefix, hiddenId) {
  const file = input.files[0]; if (!file) return;
  const statusEl  = document.getElementById(`${prefix}-img-status`);
  const labelEl   = document.getElementById(`${prefix}-img-label`);
  const previewEl = document.getElementById(`${prefix}-img-preview`);
  const thumbEl   = document.getElementById(`${prefix}-img-thumb`);
  const hiddenEl  = document.getElementById(hiddenId);
  statusEl.textContent = '⏳ Subiendo imagen...';
  statusEl.style.color = 'var(--gris)';
  labelEl.style.opacity = '.5'; labelEl.style.pointerEvents = 'none';
  _subirArchivo(file,
    url => { hiddenEl.value = url; thumbEl.src = url; previewEl.style.display = 'flex'; labelEl.style.display = 'none'; statusEl.textContent = '✅ Imagen subida correctamente'; statusEl.style.color = 'var(--verde)'; input.value = ''; },
    err => { statusEl.textContent = '❌ ' + err; statusEl.style.color = '#dc2626'; labelEl.style.opacity = '1'; labelEl.style.pointerEvents = ''; }
  );
}

export function quitarImagenModal(prefix) {
  const hiddenId = prefix === 'dm-not' ? 'dm-img' : 'dm-ev-img';
  const h = document.getElementById(hiddenId); if (h) h.value = '';
  const p = document.getElementById(`${prefix}-img-preview`); if (p) p.style.display = 'none';
  const l = document.getElementById(`${prefix}-img-label`); if (l) { l.style.display = ''; l.style.opacity = '1'; l.style.pointerEvents = ''; }
  const s = document.getElementById(`${prefix}-img-status`); if (s) s.textContent = '';
}

// Galería: subida múltiple
export function initUploadArea() {
  const area = document.getElementById('upload-area');
  const input = document.getElementById('upload-input');
  if (!area || !input || area._initDone) return; area._initDone = true;
  area.addEventListener('click',     () => input.click());
  area.addEventListener('dragover',  e => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop',      e => { e.preventDefault(); area.classList.remove('drag-over'); procesarFiles(e.dataTransfer.files); });
  input.addEventListener('change',   () => procesarFiles(input.files));
}

function procesarFiles(files) {
  const prev = document.getElementById('upload-preview'); APP.uploadFiles = [];
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = e => {
      APP.uploadFiles.push({ file, dataUrl: e.target.result });
      const d = document.createElement('div'); d.className = 'prev-it';
      d.innerHTML = `<img src="${e.target.result}" alt="preview"><button class="prev-rm" onclick="this.parentElement.remove()">✕</button>`;
      prev.appendChild(d);
    };
    r.readAsDataURL(file);
  });
}

export async function subirImagenesGaleria() {
  if (!APP.uploadFiles.length) { toast('Selecciona al menos una imagen', 'error'); return; }
  const titulo = v('img-titulo'), desc = v('img-desc'), cat = v('img-cat'), por = v('img-autor') || 'Admin';
  if (!titulo) { toast('Ingresa un título', 'error'); return; }
  const btn = document.getElementById('btn-upload'); btn.disabled = true; btn.textContent = 'Subiendo...';
  let errores = 0;
  for (const item of APP.uploadFiles) {
    try {
      const url = await subirImagen(item.file, APP.serviceKey);
      await guardarEnGaleria({ titulo, descripcion: desc, imagenUrl: url, categoria: cat, subidoPor: por }, APP.serviceKey);
    } catch { errores++; }
  }
  btn.disabled = false; btn.textContent = '📤 Subir Imágenes';
  if (!errores) {
    toast(`${APP.uploadFiles.length} imagen(es) subida(s) ✓`, 'success');
    document.getElementById('upload-preview').innerHTML = '';
    document.getElementById('img-titulo').value = '';
    APP.uploadFiles = [];
    await cargarGaleria(); await cargarEstadisticas();
  } else toast(`Algunas imágenes fallaron (${errores})`, 'error');
}

// ════════════════════════════════════════════════════════════════
// CONTACTO
// ════════════════════════════════════════════════════════════════
export async function enviarContacto() {
  const nombre = v('inp-nombre'), tel = v('inp-tel'), email = v('inp-email');
  const tipo = v('inp-tipo'), msg = v('inp-mensaje');
  if (!nombre || !tipo || !msg) { toast('Completa los campos obligatorios (*)', 'error'); return; }
  const btn = document.getElementById('btn-contacto'); btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    await guardarContacto({ nombre, telefono: tel, email, tipo, mensaje: msg });
    btn.disabled = false; btn.textContent = 'Enviar Mensaje 📨';
    document.getElementById('contact-form').style.display = 'none';
    document.getElementById('contact-success').style.display = 'block';
    toast('Mensaje enviado ✓', 'success');
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Enviar Mensaje 📨';
    toast('Error: ' + e.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN (guardar desde panel admin)
// ════════════════════════════════════════════════════════════════
export async function guardarConfigAdmin() {
  const campos = { whatsapp_numero: v('cfg-wa'), facebook_url: v('cfg-fb'), instagram_url: v('cfg-ig'), jac_email: v('cfg-email'), jac_presidente: v('cfg-pres'), jac_horario: v('cfg-hora') };
  const hayDatos = Object.values(campos).some(Boolean);
  if (!hayDatos) { toast('Ingresa al menos un valor', 'error'); return; }
  // Actualizar en Supabase usando patch por clave
  try {
    const url = `${CONFIG.SUPABASE_URL}/rest/v1/configuracion`;
    const headers = { 'Content-Type': 'application/json', 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${APP.serviceKey || CONFIG.SUPABASE_ANON_KEY}`, 'Prefer': 'return=minimal' };
    for (const [clave, valor] of Object.entries(campos)) {
      if (!valor) continue;
      await fetch(`${url}?clave=eq.${clave}`, { method: 'PATCH', headers, body: JSON.stringify({ valor }) });
    }
    toast('Configuración guardada ✓', 'success'); await cargarConfiguracion();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

// ════════════════════════════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════════════════════════════
function initNavbar() {
  window.addEventListener('scroll', () => {
    const n = document.getElementById('navbar');
    if (n) n.style.boxShadow = window.scrollY > 60 ? '0 4px 28px rgba(0,0,0,.12)' : '0 2px 16px rgba(0,0,0,.07)';
  });
}

function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
  document.addEventListener('click', e => { if (!menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('open'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

export function initModal() {
  document.addEventListener('click', e => {
    const item = e.target.closest('.gal-item'); if (!item) return;
    const img = item.querySelector('img'); if (!img?.src || img.src === window.location.href) return;
    const mo = document.getElementById('img-modal');
    const mi = document.getElementById('img-modal-img');
    if (mo && mi) { mi.src = img.src; mo.classList.add('open'); document.body.style.overflow = 'hidden'; }
  });
  const ov = document.getElementById('img-modal');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) { ov.classList.remove('open'); document.body.style.overflow = ''; } });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrarLogin(); cerrarModal(); document.getElementById('img-modal')?.classList.remove('open'); document.body.style.overflow = ''; }
  });
  // Smooth scroll
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.querySelector(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' });
  });
}

export function initObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => { if (en.isIntersecting) { setTimeout(() => en.target.classList.add('vis'), i * 60); obs.unobserve(en.target); } });
  }, { threshold: 0.07, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.fi').forEach(el => obs.observe(el));
}

// Utils
function v(id)      { return document.getElementById(id)?.value.trim() || ''; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setValue(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }
function clearInputs(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function msgVacio(txt)    { return `<p style="color:var(--gris);text-align:center;padding:40px;">${txt}</p>`; }
function errSec(id, msg)  {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div style="padding:36px;text-align:center;background:#fff5f5;border-radius:12px;margin:16px 0;border:2px solid #fed7d7"><div style="font-size:2rem;margin-bottom:8px">⚠️</div><p style="color:#dc2626;font-weight:700;margin-bottom:5px">Error al cargar datos</p><p style="color:#6b7280;font-size:.84rem">Detalle: ${esc(String(msg || ''))}</p></div>`;
}
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export function toast(msg, tipo) {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className = `toast ${tipo || ''}`; t.textContent = msg; wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.parentNode?.removeChild(t), 350); }, 4000);
}
