/* ============================================================
   AI MANGANELL · configuración
   Todo lo que cambia al publicar está en este archivo.
   ============================================================ */

window.AM_CONFIG = {

  // WhatsApp de la pagina de gracias. Con formato internacional y sin
  // signos: 34612345678. Si se deja vacio, el bloque de WhatsApp de
  // /gracias/ no se muestra (main.js lo deja oculto).
  waNumber: '34650903265',
  waMsg: 'Hola, acabo de solicitar el AI & Cyber AMG en la web.',

  // Calendario donde se agenda la llamada
  calUrl: 'https://cal.com/aimanganell/llamada-inicial',

  // Vídeos de fondo. Deja '' para desactivar un vídeo.
  // Ojo: son rutas relativas al documento que los usa, no a este archivo.
  // heroVideo lo consume index.html (raíz); consultoriaVideo lo consume
  // consultoria/index.html (un nivel más abajo) — si alguna vez se usan
  // desde otra profundidad, esta ruta también hay que ajustarla.
  heroVideo: 'assets/hero.mp4',
  consultoriaVideo: '../assets/consultoria.mp4',
  // Versiones para movil: 800px de ancho en vez de 1920. Pesan unos 120 KB
  // frente a 2,5 MB, y a ese tamano no se distingue la diferencia. Si se
  // dejan vacias, main.js usa la version grande en todas partes.
  heroVideoMobile: 'assets/hero-movil.mp4',
  consultoriaVideoMobile: '../assets/consultoria-movil.mp4',
  consultoriaVideoRate: 0.55,   // cámara lenta del vídeo de consultoría

  // Destino de los leads: la Edge Function submit-lead (supabase/functions/),
  // desplegada en el mismo proyecto de supabase.url. Es el único punto que
  // escribe en la tabla leads — el navegador ya no inserta directamente
  // (ver supabase/functions/submit-lead/index.ts). key se deja como
  // referencia del proyecto, no se usa ya para el insert.
  supabase: {
    url: 'https://dbntpdrvnxdhgvdcexrt.supabase.co',
    key: 'sb_publishable_yoJZhGK0iJrHDNmj7uEBLA_42dE-kGf',
    table: 'leads'
  },

  // Webhook opcional. Recibe el lead en JSON.
  webhookUrl: '',

  // Cloudflare Turnstile (protección anti-spam de los formularios de
  // contacto). Site Key, pública por diseño.
  turnstileSiteKey: '0x4AAAAAAENeLO4-8PHUoy9x',

  // Analítica. El script de GA solo se inyecta si el usuario acepta
  // todas las cookies en el banner (o ya lo aceptó en una visita
  // anterior); con "solo esenciales" no se carga en absoluto.
  gaId: 'G-PLTXXWN26D',
  metaPixelId: ''
};
