// frontend/functions/_middleware.js
// Cloudflare Pages Function — Inyecta variables de entorno en el HTML
// Documentación: https://developers.cloudflare.com/pages/functions/middleware/

export async function onRequest({ request, env, next }) {
  const response = await next();
  const contentType = response.headers.get('content-type') || '';

  // Solo procesar HTML
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();

  // Reemplazar placeholders con variables de entorno de Cloudflare
  const injected = html
    .replace(/%%SUPABASE_URL%%/g,      env.SUPABASE_URL      || '')
    .replace(/%%SUPABASE_ANON_KEY%%/g, env.SUPABASE_ANON_KEY || '');

  return new Response(injected, {
    status:  response.status,
    headers: response.headers,
  });
}
