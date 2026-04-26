// ═══════════════════════════════════════════════════════════════
// services-supabase.js ACTUALIZADO — Barrio Los Alpes
// Usa anon key para TODO (lectura y escritura)
// Los permisos se manejan via RLS en fix_permisos.sql
// ═══════════════════════════════════════════════════════════════
import CONFIG from './config.js';

// ── Cliente HTTP base ─────────────────────────────────────────
class SupabaseClient {
  constructor(url, key) {
    this.url  = url.replace(/\/$/, '');
    this.key  = key;
    this.hdrs = {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
    };
  }

  async get(table, params = {}) {
    const qs  = new URLSearchParams(params).toString();
    const url = `${this.url}/rest/v1/${table}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: this.hdrs });
    if (!res.ok) { const e = await res.text(); throw new Error(`GET ${table}: ${e}`); }
    return res.json();
  }

  async post(table, body) {
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method:  'POST',
      headers: { ...this.hdrs, 'Prefer': 'return=representation' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`POST ${table}: ${e}`); }
    return res.json();
  }

  async patch(table, id, body) {
    const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method:  'PATCH',
      headers: { ...this.hdrs, 'Prefer': 'return=representation' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`PATCH ${table}: ${e}`); }
    return res.json();
  }

  async patchByKey(table, key, val, body) {
    const res = await fetch(`${this.url}/rest/v1/${table}?${key}=eq.${encodeURIComponent(val)}`, {
      method:  'PATCH',
      headers: { ...this.hdrs, 'Prefer': 'return=representation' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`PATCH ${table} by ${key}: ${e}`); }
    return res.json();
  }

  async softDelete(table, id) {
    return this.patch(table, id, { activo: false });
  }
}

// Instancia única usando anon key (con permisos amplios tras fix_permisos.sql)
const db = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════
export async function getConfiguracion() {
  const rows = await db.get('configuracion', { select: 'clave,valor' });
  return rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
}

export async function actualizarConfiguracion(datos) {
  for (const [clave, valor] of Object.entries(datos)) {
    if (!valor) continue;
    try {
      await db.patchByKey('configuracion', 'clave', clave, { valor });
    } catch (e) {
      console.warn(`Config ${clave}:`, e.message);
    }
  }
}

// ════════════════════════════════════════════════════════════════
// NOTICIAS
// ════════════════════════════════════════════════════════════════
export async function getNoticias() {
  return db.get('noticias', {
    select:  '*',
    activo:  'eq.true',
    order:   'created_at.desc',
  });
}

export async function guardarNoticia(datos) {
  return db.post('noticias', {
    titulo:      datos.titulo,
    descripcion: datos.descripcion,
    tipo:        datos.tipo       || 'General',
    autor:       datos.autor      || 'JAC Los Alpes',
    imagen_url:  datos.imagenUrl  || '',
    destacada:   datos.destacada  === 'SI' || datos.destacada === true,
    activo:      true,
  });
}

export async function actualizarNoticia(id, datos) {
  return db.patch('noticias', id, {
    titulo:      datos.titulo,
    descripcion: datos.descripcion,
    tipo:        datos.tipo,
    autor:       datos.autor      || 'JAC Los Alpes',
    imagen_url:  datos.imagenUrl  || '',
    destacada:   datos.destacada  === 'SI' || datos.destacada === true,
  });
}

export async function eliminarNoticia(id) {
  return db.softDelete('noticias', id);
}

// ════════════════════════════════════════════════════════════════
// EVENTOS
// ════════════════════════════════════════════════════════════════
export async function getEventos() {
  return db.get('eventos', {
    select: '*',
    activo: 'eq.true',
    fecha:  `gte.${new Date().toISOString().slice(0,10)}`,
    order:  'fecha.asc',
  });
}

export async function guardarEvento(datos) {
  return db.post('eventos', {
    nombre:      datos.nombre,
    descripcion: datos.descripcion || '',
    fecha:       datos.fecha,
    hora:        datos.hora        || '',
    lugar:       datos.lugar       || '',
    tipo:        datos.tipo        || 'General',
    imagen_url:  datos.imagenUrl   || '',
    activo:      true,
  });
}

export async function actualizarEvento(id, datos) {
  return db.patch('eventos', id, {
    nombre:      datos.nombre,
    descripcion: datos.descripcion || '',
    fecha:       datos.fecha,
    hora:        datos.hora        || '',
    lugar:       datos.lugar       || '',
    tipo:        datos.tipo,
    imagen_url:  datos.imagenUrl   || '',
  });
}

export async function eliminarEvento(id) {
  return db.softDelete('eventos', id);
}

// ════════════════════════════════════════════════════════════════
// SERVICIOS
// ════════════════════════════════════════════════════════════════
export async function getServicios() {
  return db.get('servicios', {
    select: '*',
    activo: 'eq.true',
    order:  'orden.asc',
  });
}

// ════════════════════════════════════════════════════════════════
// GALERÍA
// ════════════════════════════════════════════════════════════════
export async function getGaleria() {
  return db.get('galeria', {
    select: '*',
    activo: 'eq.true',
    order:  'created_at.desc',
  });
}

export async function guardarEnGaleria(datos) {
  return db.post('galeria', {
    titulo:      datos.titulo,
    descripcion: datos.descripcion || '',
    imagen_url:  datos.imagenUrl,
    categoria:   datos.categoria   || 'General',
    subido_por:  datos.subidoPor   || 'Admin',
    activo:      true,
  });
}

export async function eliminarImagen(id) {
  return db.softDelete('galeria', id);
}

// ════════════════════════════════════════════════════════════════
// SUBIDA DE IMAGEN — via Google Apps Script → Drive
// ════════════════════════════════════════════════════════════════
export async function subirImagen(file) {
  const APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('TU_DEPLOYMENT_ID')) {
    throw new Error('Configura APPS_SCRIPT_URL en config.js con la URL de tu Apps Script deploy');
  }

  // Validar
  const TIPOS = ['image/jpeg','image/png','image/webp','image/gif'];
  if (!TIPOS.includes(file.type)) throw new Error('Tipo no permitido. Usa JPG, PNG o WEBP');
  if (file.size > 5 * 1024 * 1024) throw new Error(`Imagen muy grande (${(file.size/1024/1024).toFixed(1)} MB). Máx 5 MB`);

  // Convertir a base64
  const base64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = e => res(e.target.result.split(',')[1]);
    reader.onerror = () => rej(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });

  // Enviar al Apps Script backend
  const response = await fetch(APPS_SCRIPT_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      accion:   'subir',
      base64,
      mimeType: file.type,
      nombre:   file.name,
    }),
  });

  if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'Error desconocido en la subida');

  // Retorna la URL thumbnail de Google Drive
  return result.imagenUrl;
}

// ════════════════════════════════════════════════════════════════
// CONTACTOS
// ════════════════════════════════════════════════════════════════
export async function guardarContacto(datos) {
  return db.post('contactos', {
    nombre:       datos.nombre,
    telefono:     datos.telefono     || '',
    email:        datos.email        || '',
    tipo_mensaje: datos.tipo,
    mensaje:      datos.mensaje,
    respondido:   false,
  });
}

export async function getContactosAdmin() {
  return db.get('contactos', {
    select: '*',
    order:  'created_at.desc',
  });
}

// ════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ════════════════════════════════════════════════════════════════
export async function getEstadisticas() {
  const [n, ev, sv, g, c] = await Promise.all([
    db.get('noticias',  { select: 'id', activo: 'eq.true' }),
    db.get('eventos',   { select: 'id', activo: 'eq.true' }),
    db.get('servicios', { select: 'id', activo: 'eq.true' }),
    db.get('galeria',   { select: 'id', activo: 'eq.true' }),
    db.get('contactos', { select: 'id' }),
  ]);
  return {
    noticias:  n.length,
    eventos:   ev.length,
    servicios: sv.length,
    galeria:   g.length,
    contactos: c.length,
  };
}

export default db;
