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
    // Tiene que ser `arguments`, no (...args): gtag.js solo procesa objetos
    // Arguments del dataLayer e ignora los arrays. Con un array GA carga pero
    // no envía nada (pasó tras la migración a TypeScript, sep. 2026).
    window.gtag = function (): void {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
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
    // Stub oficial de Meta: encola las llamadas (como `arguments`) hasta que
    // fbevents.js carga y define callMethod. Sin la cola, los eventos se perdían.
    type FbqStub = { (): void; callMethod?: (...a: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };
    const n = function (): void {
      // eslint-disable-next-line prefer-rest-params
      if (n.callMethod) n.callMethod.apply(n, arguments as unknown as unknown[]); else n.queue.push(arguments);
    } as FbqStub;
    n.push = n; n.queue = []; n.loaded = true; n.version = '2.0';
    if (!window._fbq) window._fbq = n;
    const fbq = n as unknown as NonNullable<Window['fbq']>;
    window.fbq = fbq;
    fbq('init', config.metaPixelId);
    fbq('track', 'PageView');
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
