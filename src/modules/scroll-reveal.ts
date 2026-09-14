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

  const els: HTMLElement[] = [];
  REVEAL_SELECTORS.forEach((sel) => {
    $$<HTMLElement>(sel).forEach((el) => { if (els.indexOf(el) === -1) els.push(el); });
  });
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
