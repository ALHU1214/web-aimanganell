/* ============================================================
   AI MANGANELL · configuración
   Todo lo que cambia al publicar está en este archivo.
   ============================================================ */

window.AM_CONFIG = {

  // Calendario donde se agenda la llamada
  calUrl: 'https://cal.com/aimanganell/llamada-inicial',

  // Vídeos de fondo. Deja '' para desactivar un vídeo.
  // Ojo: son rutas relativas al documento que los usa, no a este archivo.
  // heroVideo lo consume index.html (raíz); consultoriaVideo lo consume
  // consultoria/index.html (un nivel más abajo) — si alguna vez se usan
  // desde otra profundidad, esta ruta también hay que ajustarla.
  heroVideo: 'assets/hero.mp4',
  consultoriaVideo: '../assets/consultoria.mp4',
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

  // Analítica. El script de GA solo se inyecta si el usuario acepta
  // todas las cookies en el banner (o ya lo aceptó en una visita
  // anterior); con "solo esenciales" no se carga en absoluto.
  gaId: 'G-PLTXXWN26D',
  metaPixelId: ''
};
