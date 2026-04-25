// ═══════════════════════════════════════════════════════════════
// config/config.js — Barrio Los Alpes · Configuración global
// Las claves se inyectan desde variables de entorno de Cloudflare Pages
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── Supabase ─────────────────────────────────────────────────
  // En Cloudflare Pages: Settings → Environment Variables
  SUPABASE_URL:      window.__ENV__?.SUPABASE_URL      || 'https://twosvyekextzkeltawid.supabase.co',
  SUPABASE_ANON_KEY: window.__ENV__?.SUPABASE_ANON_KEY || 'sb_publishable_2-zwZNTtcIE6iOEC59TWuA_Pa7dNF_N',

  // ── App ───────────────────────────────────────────────────────
  WA_NUMBER:    '573118474986',
  WA_BASE:      'https://wa.me/',

  // ── Admin credentials (obfuscadas — NO usar en producción sin Cloudflare Access) ──
  ADMIN_USER: atob('YWRtaW4='),    // admin
  ADMIN_PASS: atob('TnVlczE5NjIu'), // Nues1962.

  // ── Identidad visual ─────────────────────────────────────────
  DRIVE_ESCUDO:  'https://drive.google.com/thumbnail?sz=w1000&id=199b38zQtlkOz1aZ_Pc1AuHmvRJg2ISh8',
  DRIVE_BANDERA: 'https://drive.google.com/thumbnail?sz=w1000&id=1Eez-QV_NcvrB7sFHP0-4MrK8jvHycumx',
  DRIVE_LOGO:    'https://drive.google.com/thumbnail?sz=w1000&id=1XtThHuX-2cAb2z39Ew9msOiZlsGICgxE',

  // ── Supabase Storage bucket para imágenes ────────────────────
  // Crear bucket "losalpes-imagenes" en Supabase → Storage (público)
  STORAGE_BUCKET: 'losalpes-imagenes',
  STORAGE_URL:    '', // se calcula en runtime: SUPABASE_URL + /storage/v1/object/public/
};

export default CONFIG;
