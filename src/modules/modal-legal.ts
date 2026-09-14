import { $, $$ } from './utils';

/* ---------- 7 · modal legal — contenido bajo demanda ---------- */
export function initModalLegal(): void {
  const modal = $('#legal-modal');
  const titleEl = $('#legal-title');
  const bodyEl = modal ? $('.legal-body', modal) : null;
  const titles: Record<string, string> = {
    priv: 'Política de privacidad',
    aviso: 'Aviso legal',
    cookies: 'Política de cookies'
  };
  const legalCache: Record<string, string> = {};

  function fetchLegalBody(doc: string, url: string): Promise<string> {
    if (legalCache[doc]) return Promise.resolve(legalCache[doc]);
    return fetch(url).then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then((html) => {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const source = parsed.querySelector('.legal-body');
      if (!source) throw new Error('sin .legal-body en la respuesta');
      $$('h2', source).forEach((h) => {
        const h3 = parsed.createElement('h3');
        h3.innerHTML = h.innerHTML;
        if (h.parentNode) h.parentNode.replaceChild(h3, h);
      });
      legalCache[doc] = source.innerHTML;
      return legalCache[doc];
    });
  }

  function openLegal(doc: string, url: string | null): void {
    if (!modal || !bodyEl || !url) {
      if (url) window.location.href = url;
      return;
    }
    if (titleEl) titleEl.textContent = titles[doc] || titles.priv;
    bodyEl.innerHTML = '<p>Cargando…</p>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    fetchLegalBody(doc, url).then((html) => {
      if (modal.hidden) return;
      bodyEl.innerHTML = html;
    }).catch(() => {
      closeLegal();
      window.location.href = url;
    });
  }

  function closeLegal(): void {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  $$('[data-legal]').forEach((a) => {
    a.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const doc = a.getAttribute('data-legal');
      const url = a.getAttribute('href');
      if (doc) openLegal(doc, url);
    });
  });

  const legalClose = $('.legal-close');
  if (legalClose) legalClose.addEventListener('click', closeLegal);
  if (modal) modal.addEventListener('click', (e: Event) => { if (e.target === modal) closeLegal(); });
  document.addEventListener('keydown', (e: KeyboardEvent) => { if (modal && e.key === 'Escape' && !modal.hidden) closeLegal(); });
}
