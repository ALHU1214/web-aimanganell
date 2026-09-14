import { initNavegacion } from './modules/navegacion';
import { initVideosFondo } from './modules/video-fondo';
import { initFiltroBlog } from './modules/filtro-blog';
import { initFormularioLead } from './modules/formulario-lead';
import { initPaginaGracias } from './modules/pagina-gracias';
import { initModalLegal } from './modules/modal-legal';
import { initGestionCookies } from './modules/gestion-cookies';
import { initScrollReveal } from './modules/scroll-reveal';
import { initMenuMovil } from './modules/menu-movil';
import { config } from './config';

/* ============================================================
   AI MANGANELL · lógica de la web
   Usa la configuración compilada desde src/config.ts.
   ============================================================ */
(function (): void {
  'use strict';

  const CFG = config;

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

