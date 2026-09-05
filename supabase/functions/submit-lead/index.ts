// Único punto de escritura en la tabla `leads`. El navegador ya no
// inserta directamente con la clave anon (ver main.js, sendLead()) —
// manda los datos del formulario + el token de Turnstile aquí, y esta
// función decide si se escribe o no.
//
// Variables de entorno:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  → inyectadas automáticamente
//     por Supabase en cualquier Edge Function, no hace falta configurarlas.
//   TURNSTILE_SECRET_KEY                     → hay que crearla a mano
//     (`supabase secrets set TURNSTILE_SECRET_KEY=...`). Nunca debe vivir
//     en el repo ni en config.js.
//   CRM_WEBHOOK_URL, CRM_FORM_SECRET         → también a mano. Son el
//     endpoint del CRM grande (/api/webhooks/form) y su FORM_SECRET. El
//     secreto vive aquí, en el servidor, precisamente para que el
//     navegador nunca lo vea. Si faltan, el lead se guarda igual en
//     Supabase y simplemente no se espeja en el CRM.
//
// Deploy con verify_jwt = false (ver supabase/config.toml): el
// formulario es público y no hay usuarios autenticados, así que no
// tiene sentido exigir un JWT de Supabase — la validación real es el
// token de Turnstile, comprobado aquí contra la Secret Key.

const ALLOWED_ORIGIN = 'https://aimanganell.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const nombre = String(body.nombre || '').trim();
  const empresa = String(body.empresa || '').trim();
  const email = String(body.email || '').trim();
  const telefono = String(body.telefono || '').trim();
  const mensaje = String(body.mensaje || '').trim();
  const origen = String(body.origen || 'Landing web').trim();
  const notas = String(body.notas || '').trim();
  const biz = String(body.biz || '').trim();
  const turnstileToken = String(body.turnstileToken || '').trim();

  // Validación básica en servidor — la del navegador se puede saltar
  // llamando a esta función directamente, así que se repite aquí.
  if (!nombre || !empresa || email.indexOf('@') === -1 || !telefono) {
    return json({ error: 'campos obligatorios incompletos' }, 400);
  }
  if (!turnstileToken) {
    return json({ error: 'falta el token de Turnstile' }, 403);
  }

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) {
    // Fallo de configuración nuestro, no del visitante — no revela
    // detalles internos en la respuesta.
    console.error('TURNSTILE_SECRET_KEY no está configurada');
    return json({ error: 'servidor mal configurado' }, 500);
  }

  const verifyBody = new URLSearchParams();
  verifyBody.set('secret', secret);
  verifyBody.set('response', turnstileToken);
  const ip = req.headers.get('cf-connecting-ip');
  if (ip) verifyBody.set('remoteip', ip);

  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: verifyBody },
  );
  const verifyData = await verifyRes.json();

  if (!verifyData.success) {
    return json({ error: 'verificación anti-spam fallida' }, 403);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'servidor mal configurado' }, 500);
  }

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ nombre, empresa, email, telefono, mensaje, origen, notas }),
  });

  if (!insertRes.ok) {
    const detail = await insertRes.text();
    console.error('insert en leads falló:', insertRes.status, detail);
    return json({ error: 'no se pudo guardar' }, 502);
  }

  // Espejo en el CRM grande. Va después del insert y a propósito no
  // corta el envío: el lead ya está guardado en Supabase, así que si el
  // CRM está caído o tarda, el visitante no se entera — queda el error
  // en los logs de la función y `crm: false` en la respuesta.
  const crmUrl = Deno.env.get('CRM_WEBHOOK_URL');
  const crmSecret = Deno.env.get('CRM_FORM_SECRET');
  let crm = false;

  if (crmUrl && crmSecret) {
    try {
      const crmRes = await fetch(crmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-form-secret': crmSecret,
        },
        body: JSON.stringify({
          name: nombre,
          company: empresa,
          email,
          whatsapp: telefono,
          businessType: biz,
          message: mensaje,
          origin: origen,
        }),
        // Sin tope, un CRM lento dejaría al visitante mirando el botón
        // "Enviando…" hasta que main.js se rinde a los 2,5 s.
        signal: AbortSignal.timeout(5000),
      });
      crm = crmRes.ok;
      if (!crmRes.ok) {
        console.error('el CRM rechazó el lead:', crmRes.status, await crmRes.text());
      }
    } catch (err) {
      console.error('no se pudo avisar al CRM:', err);
    }
  }

  return json({ ok: true, crm });
});
