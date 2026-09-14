import { initNavegacion } from './modules/navegacion';
import { initVideosFondo } from './modules/video-fondo';
import { initFiltroBlog } from './modules/filtro-blog';
import { initFormularioLead } from './modules/formulario-lead';
import { initPaginaGracias } from './modules/pagina-gracias';
import { initModalLegal } from './modules/modal-legal';
import { initGestionCookies } from './modules/gestion-cookies';
import { initScrollReveal } from './modules/scroll-reveal';
import { initMenuMovil } from './modules/menu-movil';

/* ============================================================
   AI MANGANELL · lógica de la web
   Sin dependencias. Se apoya en window.AM_CONFIG (config.js).
   ============================================================ */
(function (): void {
  'use strict';

  const CFG: AMConfig = (window.AM_CONFIG || {}) as AMConfig;

  initNavegacion();
  initVideosFondo(CFG);
  initFiltroBlog();
  initFormularioLead(CFG);
  initPaginaGracias(CFG);
  initModalLegal();
  initGestionCookies(CFG);
  initScrollReveal();
  initMenuMovil();
})();
