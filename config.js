/* ============================================================
   AI MANGANELL · configuración
   Todo lo que cambia al publicar está en este archivo.
   ============================================================ */

window.AM_CONFIG = {

  // Calendario donde se agenda la llamada
  calUrl: 'https://cal.com/aimanganell/llamada-inicial',

  // Vídeos de fondo. Deja '' para desactivar un vídeo.
  heroVideo: 'assets/hero.mp4',
  consultoriaVideo: 'assets/consultoria.mp4',
  consultoriaVideoRate: 0.55,   // cámara lenta del vídeo de consultoría

  // Destino de los leads. Deja supabase.url vacío para desactivarlo
  // y usar solo el webhook (o ninguno de los dos).
  supabase: {
    url: 'https://dbntpdrvnxdhgvdcexrt.supabase.co',
    key: 'sb_publishable_yoJZhGK0iJrHDNmj7uEBLA_42dE-kGf',
    table: 'leads'
  },

  // Webhook opcional (n8n, Zapier, Make…). Recibe el lead en JSON.
  webhookUrl: '',

  // Analítica. Rellena para activarla; se carga solo si el usuario
  // acepta todas las cookies (Consent Mode v2).
  gaId: '',
  metaPixelId: ''
};
