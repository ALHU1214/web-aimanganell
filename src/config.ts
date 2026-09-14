/* ============================================================
   AI MANGANELL · configuración
   Configuración de la aplicación cargada mediante variables
   de entorno (build-time) o valores por defecto.
   ============================================================ */

export const config: AMConfig = {

  // WhatsApp de la página de gracias. Con formato internacional y sin
  // signos: 34612345678. Si se deja vacío, el bloque de WhatsApp de
  // /gracias/ no se muestra (main.js lo deja oculto).
  waNumber: process.env.WA_NUMBER || '34650903265',
  waMsg: process.env.WA_MSG || 'Hola, acabo de solicitar el AI & Cyber AMG en la web.',

  // Calendario donde se agenda la llamada
  calUrl: process.env.CAL_URL || 'https://cal.com/aimanganell/llamada-inicial',

  // Vídeo de fondo del hero de la home. Deja '' para desactivarlo.
  heroVideo: process.env.HERO_VIDEO || 'assets/hero.mp4',

  // Destino de los leads: Edge Function submit-lead de Supabase
  supabase: {
    url: process.env.SUPABASE_URL || 'https://dbntpdrvnxdhgvdcexrt.supabase.co',
    key: process.env.SUPABASE_KEY || 'sb_publishable_yoJZhGK0iJrHDNmj7uEBLA_42dE-kGf',
    table: process.env.SUPABASE_TABLE || 'leads'
  },

  // Webhook opcional. Recibe el lead en JSON.
  webhookUrl: process.env.WEBHOOK_URL || '',

  // Cloudflare Turnstile (protección anti-spam). Site Key pública.
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '0x4AAAAAAENeLO4-8PHUoy9x',

  // Analítica. GA y Meta Pixel.
  gaId: process.env.GA_ID || 'G-PLTXXWN26D',
  metaPixelId: process.env.META_PIXEL_ID || ''
};

