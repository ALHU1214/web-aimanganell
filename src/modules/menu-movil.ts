import { $, $$ } from './utils';

/* ---------- 10 · menú de móvil ---------- */
export function initMenuMovil(): void {
  const barra = $('nav');
  const burger = barra ? $('.nav-burger', barra) : null;
  if (!barra || !burger) return;

  const panel = $('.nav-links', barra);

  function cerrarMenu(): void {
    if (!barra || !burger) return;
    if (!barra.classList.contains('abierto')) return;
    barra.classList.remove('abierto');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
  }

  burger.addEventListener('click', () => {
    const abierto = barra.classList.toggle('abierto');
    burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  if (panel) {
    $$('a', panel).forEach((a) => {
      a.addEventListener('click', cerrarMenu);
    });
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') cerrarMenu();
  });

  if (window.matchMedia('(min-width: 701px)').addEventListener) {
    window.matchMedia('(min-width: 701px)').addEventListener('change', cerrarMenu);
  } else {
    window.addEventListener('resize', () => {
      if (window.innerWidth > 700) cerrarMenu();
    });
  }
}
