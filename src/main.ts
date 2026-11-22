import { initNavegacion } from './modules/navegacion';
import { initVideosFondo } from './modules/video-fondo';
import { initFiltroBlog } from './modules/filtro-blog';
import { initFormularioLead } from './modules/formulario-lead';
import { initPaginaGracias } from './modules/pagina-gracias';
import { initModalLegal } from './modules/modal-legal';
import { initGestionCookies } from './modules/gestion-cookies';
import { initScrollReveal } from './modules/scroll-reveal';
import { initMenuMovil } from './modules/menu-movil';
import { initParticulas } from './modules/particulas';
import { initTrabajos, initIndiceTrabajos } from './modules/trabajos';
import { initPasosAutomatizacion, initFlujoAutomatizacion } from './modules/automatizacion';
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
  initParticulas();
  initTrabajos();        // antes que el índice: alarga cada proyecto y así
  initIndiceTrabajos();  // un enlace con #slug cae en su sitio
  initPasosAutomatizacion();
  initFlujoAutomatizacion();
})();

