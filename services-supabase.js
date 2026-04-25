// ═══════════════════════════════════════════════════════════════
// services/supabase.js — Capa de datos · Reemplaza Code.gs
// Usa Supabase REST API directamente (sin SDK, cero dependencias)
// ═══════════════════════════════════════════════════════════════
import CONFIG from './config.js';

// ── Cliente HTTP base ─────────────────────────────────────────
class SupabaseClient {
  constructor(url, anonKey) {
    this.url     = url.replace(/\/$/, '');
    this.headers = {
      'Content-Type':  'application/json',
      'apikey':        anonKey,
      'Authorization': `Bearer ${anonKey}`,
    };
  }

  // GET con filtros opcionales
  async get(table, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.url}/rest/v1/${table}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
    return res.json();
  }

  // POST (insertar)
  async post(table, body, serviceKey = null) {
    const headers = { ...this.headers };
    if (serviceKey) headers['Authorization'] = `Bearer ${serviceKey}`;
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${table} failed: ${res.status}`);
    return res.json();
  }

  // PATCH (actualizar)
  async patch(table, id, body, serviceKey = null) {
    const headers = { ...this.headers };
    if (serviceKey) headers['Authorization'] = `Bearer ${serviceKey}`;
    const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status}`);
    return res.json();
  }

  // DELETE (soft delete via PATCH activo=false)
  async softDelete(table, id, serviceKey = null) {
    return this.patch(table, id, { activo: false }, serviceKey);
  }

  // Upload a Supabase Storage
  async uploadImage(bucket, path, file) {
    const res = await fetch(
      `${this.url}/storage/v1/object/${bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          'apikey':        this.headers.apikey,
          'Authorization': this.headers.Authorization,
          'Content-Type':  file.type,
        },
        body: file,
      }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return `${this.url}/storage/v1/object/public/${bucket}/${path}`;
  }
}

// ── Instancia global ──────────────────────────────────────────
const db = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ════════════════════════════════════════════════════════════════
// API PÚBLICA — equivalentes exactos a las funciones de Code.gs
// ════════════════════════════════════════════════════════════════

// ── Configuración ─────────────────────────────────────────────
export async function getConfiguracion() {
  const rows = await db.get('configuracion', { select: 'clave,valor' });
  return rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
}

// ── Noticias ──────────────────────────────────────────────────
export async function getNoticias() {
  return db.get('noticias', {
    select:  '*',
    activo:  'eq.true',
    order:   'created_at.desc',
  });
}

export async function guardarNoticia(datos, serviceKey) {
  const row = {
    titulo:     datos.titulo,
    descripcion:datos.descripcion,
    tipo:       datos.tipo       || 'General',
    autor:      datos.autor      || 'JAC Los Alpes',
    imagen_url: datos.imagenUrl  || '',
    destacada:  datos.destacada  === 'SI',
    activo:     true,
  };
  return db.post('noticias', row, serviceKey);
}

export async function actualizarNoticia(id, datos, serviceKey) {
  const row = {
    titulo:     datos.titulo,
    descripcion:datos.descripcion,
    tipo:       datos.tipo,
    autor:      datos.autor      || 'JAC Los Alpes',
    imagen_url: datos.imagenUrl  || '',
    destacada:  datos.destacada  === 'SI',
  };
  return db.patch('noticias', id, row, serviceKey);
}

export async function eliminarNoticia(id, serviceKey) {
  return db.softDelete('noticias', id, serviceKey);
}

// ── Eventos ───────────────────────────────────────────────────
export async function getEventos() {
  return db.get('eventos', {
    select: '*',
    activo: 'eq.true',
    fecha:  `gte.${new Date().toISOString().slice(0,10)}`,
    order:  'fecha.asc',
  });
}

export async function guardarEvento(datos, serviceKey) {
  const row = {
    nombre:     datos.nombre,
    descripcion:datos.descripcion || '',
    fecha:      datos.fecha,
    hora:       datos.hora        || '',
    lugar:      datos.lugar       || '',
    tipo:       datos.tipo        || 'General',
    imagen_url: datos.imagenUrl   || '',
    activo:     true,
  };
  return db.post('eventos', row, serviceKey);
}

export async function actualizarEvento(id, datos, serviceKey) {
  const row = {
    nombre:     datos.nombre,
    descripcion:datos.descripcion || '',
    fecha:      datos.fecha,
    hora:       datos.hora        || '',
    lugar:      datos.lugar       || '',
    tipo:       datos.tipo,
    imagen_url: datos.imagenUrl   || '',
  };
  return db.patch('eventos', id, row, serviceKey);
}

export async function eliminarEvento(id, serviceKey) {
  return db.softDelete('eventos', id, serviceKey);
}

// ── Servicios ─────────────────────────────────────────────────
export async function getServicios() {
  return db.get('servicios', {
    select: '*',
    activo: 'eq.true',
    order:  'orden.asc',
  });
}

// ── Galería ───────────────────────────────────────────────────
export async function getGaleria() {
  return db.get('galeria', {
    select: '*',
    activo: 'eq.true',
    order:  'created_at.desc',
  });
}

export async function guardarEnGaleria(datos, serviceKey) {
  const row = {
    titulo:     datos.titulo,
    descripcion:datos.descripcion || '',
    imagen_url: datos.imagenUrl,
    categoria:  datos.categoria   || 'General',
    subido_por: datos.subidoPor   || 'Admin',
    activo:     true,
  };
  return db.post('galeria', row, serviceKey);
}

export async function eliminarImagen(id, serviceKey) {
  return db.softDelete('galeria', id, serviceKey);
}

// ── Subida de imagen a Supabase Storage ───────────────────────
export async function subirImagen(file, serviceKey) {
  const ext      = file.name.split('.').pop();
  const path     = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const bucket   = CONFIG.STORAGE_BUCKET;

  // Para subir necesitamos el serviceKey (operación admin)
  const headers  = {
    'apikey':        CONFIG.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${serviceKey || CONFIG.SUPABASE_ANON_KEY}`,
    'Content-Type':  file.type,
  };

  const res = await fetch(
    `${CONFIG.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    { method: 'POST', headers, body: file }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Upload error: ' + err);
  }

  // URL pública del archivo
  return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ── Contactos ─────────────────────────────────────────────────
export async function guardarContacto(datos) {
  const row = {
    nombre:       datos.nombre,
    telefono:     datos.telefono     || '',
    email:        datos.email        || '',
    tipo_mensaje: datos.tipo,
    mensaje:      datos.mensaje,
    respondido:   false,
  };
  return db.post('contactos', row); // anon puede insertar
}

export async function getContactosAdmin(serviceKey) {
  const headers = {
    ...db.headers,
    'Authorization': `Bearer ${serviceKey}`,
    'apikey':        serviceKey,
  };
  const res = await fetch(
    `${db.url}/rest/v1/contactos?select=*&order=created_at.desc`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET contactos failed: ${res.status}`);
  return res.json();
}

// ── Estadísticas ──────────────────────────────────────────────
export async function getEstadisticas() {
  const [noticias, eventos, servicios, galeria] = await Promise.all([
    db.get('noticias',  { select: 'id', activo: 'eq.true' }),
    db.get('eventos',   { select: 'id', activo: 'eq.true' }),
    db.get('servicios', { select: 'id', activo: 'eq.true' }),
    db.get('galeria',   { select: 'id', activo: 'eq.true' }),
  ]);
  return {
    noticias:  noticias.length,
    eventos:   eventos.length,
    servicios: servicios.length,
    galeria:   galeria.length,
    contactos: 0, // requiere serviceKey, se carga por separado
  };
}

export default db;
