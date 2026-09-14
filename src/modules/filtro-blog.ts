import { $$ } from './utils';

/* ---------- 3 · filtro de categoría del blog ---------- */
export function initFiltroBlog(): void {
  const blogFilterBtns = $$('.blog-filter-btn');
  if (!blogFilterBtns.length) return;

  const blogCards = $$('.blog-card');
  blogFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      blogFilterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      blogCards.forEach((card) => {
        const show = cat === 'all' || card.getAttribute('data-category') === cat;
        card.classList.toggle('is-hidden', !show);
      });
    });
  });
}
