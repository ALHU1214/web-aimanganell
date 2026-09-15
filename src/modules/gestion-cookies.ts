import { $ } from './utils';

/* ---------- 8 · cookies y analítica ---------- */
export function initGestionCookies(config: AMConfig): void {
  const bar = $('#cookie-bar');
  let gaLoaded = false;
  let metaLoaded = false;

  function loadGA(): void {
    if (gaLoaded || !config.gaId) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]): void {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', config.gaId, { anonymize_ip: true });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.gaId;
    document.head.appendChild(s);
  }

  function loadMeta(): void {
    if (metaLoaded || !config.metaPixelId) return;
    metaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq = function (...args: unknown[]): void {
      if ((window.fbq as unknown as { queue?: unknown[] }).queue) {
        (window.fbq as unknown as { queue: unknown[] }).queue.push(args);
      }
    };
    window.fbq('init', config.metaPixelId);
    window.fbq('track', 'PageView');
  }

  function grant(): void {
    loadGA();
    loadMeta();
  }

  try {
    const choice = localStorage.getItem('am_cookies');
    if (!choice) { if (bar) bar.hidden = false; }
    else if (choice === 'all') { grant(); }
  } catch (err) { if (bar) bar.hidden = false; }

  const cookieAccept = $('#cookie-accept');
  if (cookieAccept) cookieAccept.addEventListener('click', () => {
    try { localStorage.setItem('am_cookies', 'all'); } catch (e) {}
    grant();
    if (bar) bar.hidden = true;
  });

  const cookieReject = $('#cookie-reject');
  if (cookieReject) cookieReject.addEventListener('click', () => {
    try { localStorage.setItem('am_cookies', 'essential'); } catch (e) {}
    if (bar) bar.hidden = true;
  });

  const reopenCookies = $('#reopen-cookies');
  if (reopenCookies) reopenCookies.addEventListener('click', (e: Event) => {
    e.preventDefault();
    try { localStorage.removeItem('am_cookies'); } catch (err) {}

    const modal = $('#legal-modal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';

    if (bar) bar.hidden = false;
  });
}
