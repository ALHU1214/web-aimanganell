import { $, $$ } from './utils';

/* ---------- 1 · navegación entre las dos páginas ---------- */
export function initNavegacion(): void {
  const pages: { home: HTMLElement | null; info: HTMLElement | null } = {
    home: $('#home'),
    info: $('#page2')
  };

  function showPage(which: string, anchor?: string): void {
    if (pages.home) pages.home.hidden = which !== 'home';
    if (pages.info) pages.info.hidden = which !== 'info';
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  $$('[data-go]').forEach((a) => {
    a.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const target = a.getAttribute('data-go');
      if (!target) return;
      const href = a.getAttribute('href') || '';
      const anchor = href.charAt(0) === '#' && href.length > 1 && href !== '#page2' ? href.slice(1) : '';
      showPage(target, anchor);
    });
  });

  // enlaces internos dentro de la página 2 (#contacto, #diagnostico…)
  $$('#page2 a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e: Event) => {
      const hrefAttr = a.getAttribute('href');
      if (!hrefAttr) return;
      const id = hrefAttr.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
    });
  });

  (function scrollToHashWhenReady(): void {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    const fontsReady: Promise<unknown> = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    const pageLoaded: Promise<void> = new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });

    Promise.all([fontsReady, pageLoaded]).then(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        cleanHashFromUrl();
      });
    });

    function cleanHashFromUrl(): void {
      let done = false;
      function clean(): void {
        if (done) return;
        done = true;
        window.removeEventListener('scrollend', clean);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if ('onscrollend' in window) window.addEventListener('scrollend', clean, { once: true });
      setTimeout(clean, 1500);
    }
  })();
}
