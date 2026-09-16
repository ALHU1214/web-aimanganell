import { $$ } from './utils';

/* ---------- 9 · reveal al hacer scroll (una sola vez) ---------- */
const REVEAL_SELECTORS = [
  '#home #formulario',
  '#page2 .sec > .wrap.guarantee-bar',
  '#page2 .sec > .wrap:not(.guarantee-bar) > *',
  '#page2 .manifiesto > *',
  '#page2 .sec-total > *',
  '#page2 .contacto-head',
  '.sec-title',
  '.contacto-head h2',
  '#page2 .form-sec',
  '.legal-page-wrap > h1',
  '.legal-page-wrap > .legal-date',
  '.legal-page .legal-body > *',
  '.gracias-pasos > li',
  '.gracias-links > a'
];

export function initScrollReveal(): void {
  if (!('IntersectionObserver' in window)) return;

  // En móvil el formulario de la home se ve desde el principio, sin subir
  const movil = window.matchMedia('(max-width: 760px)').matches;
  const selectores = movil ? REVEAL_SELECTORS.filter((s) => s !== '#home #formulario') : REVEAL_SELECTORS;

  const els: HTMLElement[] = [];
  selectores.forEach((sel) => {
    $$<HTMLElement>(sel).forEach((el) => { if (els.indexOf(el) === -1) els.push(el); });
  });
  // Lo que ya está en pantalla al entrar no se oculta para volver a
  // mostrarlo: ese parpadeo retrasaba el LCP (páginas legales, cabeceras).
  const alto = window.innerHeight;
  for (let i = els.length - 1; i >= 0; i--) {
    if (els[i].getBoundingClientRect().top < alto) els.splice(i, 1);
  }
  if (!els.length) return;

  els.forEach((el) => { el.setAttribute('data-reveal', ''); });
  document.documentElement.classList.add('js-reveal');

  function cleanUp(el: HTMLElement): void {
    setTimeout(() => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-in');
    }, 600);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target as HTMLElement;
      cleanUp(target);
      target.classList.add('is-in');
      io.unobserve(target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  els.forEach((el) => { io.observe(el); });
}
