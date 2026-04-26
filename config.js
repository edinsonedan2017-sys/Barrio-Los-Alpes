// ═══════════════════════════════════════════════════════════════
// config.js — Barrio Los Alpes · Configuración global ACTUALIZADA
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── Supabase ─────────────────────────────────────────────────
  SUPABASE_URL:      window.__ENV__?.SUPABASE_URL      || 'https://twosvyekextzkeltawid.supabase.co',
  SUPABASE_ANON_KEY: window.__ENV__?.SUPABASE_ANON_KEY || 'sb_publishable_2-zwZNTtcIE6iOEC59TWuA_Pa7dNF_N',

  // ── Google Apps Script (backend para subida de imágenes) ─────
  // Después de desplegar ImagenBackend.gs, pega aquí la URL
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxMzijO_smbialraAtNT0czRIekQjddorB0xmNYeGRKkkxYTWRhQhR-A6mi5MvYWV0m/exec',

  // ── WhatsApp ─────────────────────────────────────────────────
  WA_NUMBER: '573118474986',
  WA_BASE:   'https://wa.me/',

  // ── Credenciales admin (ofuscadas en Base64) ─────────────────
  ADMIN_USER: atob('YWRtaW4='),     // admin
  ADMIN_PASS: atob('TnVlczE5NjIu'), // Nues1962.

  // ── Imágenes Drive ───────────────────────────────────────────
  DRIVE_ESCUDO:  'https://drive.google.com/thumbnail?sz=w1000&id=199b38zQtlkOz1aZ_Pc1AuHmvRJg2ISh8',
  DRIVE_BANDERA: 'https://drive.google.com/thumbnail?sz=w1000&id=1Eez-QV_NcvrB7sFHP0-4MrK8jvHycumx',
  DRIVE_LOGO:    'https://drive.google.com/thumbnail?sz=w1000&id=1XtThHuX-2cAb2z39Ew9msOiZlsGICgxE',
};

export default CONFIG;
