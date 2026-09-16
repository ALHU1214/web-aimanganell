import { $ } from './utils';

/* ---------- 8 · cookies y analítica ---------- */
export function initGestionCookies(config: AMConfig): void {
  const bar = $('#cookie-bar');
  // Medición solo en el dominio real: las pruebas en localhost (o en
  // cualquier otra copia) no deben sumar visitas a GA4 ni a Clarity.
  const produccion = /(^|\.)aimanganell\.com$/.test(location.hostname);
  // Marcarlas como ya cargadas hace que los load*() no hagan nada fuera de producción
  let gaLoaded = !produccion;
  let metaLoaded = !produccion;
  let clarityLoaded = !produccion;

  /* GA4 con Consent Mode v2 (modo avanzado): GA carga siempre, pero arranca
     con todo denegado. Sin consentimiento no escribe cookies ni guarda un ID
     de visitante: solo envía avisos anónimos de visita (GA4 no almacena IPs).
     Al aceptar se concede analytics_storage y pasa a medición completa. Los
     permisos de publicidad (ad_*) se quedan siempre denegados: no hay Google
     Ads en la web. */
  function loadGA(aceptadas: boolean): void {
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
    // 'default' tiene que ir antes de 'config' para que el primer envío ya
    // salga con el estado correcto (quien aceptó en otra visita arranca
    // concedido; así no se cuenta dos veces).
    window.gtag('consent', 'default', {
      analytics_storage: aceptadas ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', config.gaId);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.gaId;
    document.head.appendChild(s);
  }

  function consentimientoAnalitica(concedido: boolean): void {
    window.gtag?.('consent', 'update', { analytics_storage: concedido ? 'granted' : 'denied' });
  }

  /* Microsoft Clarity: mapas de calor y grabaciones. Graba la sesión, así
     que va con las analíticas: solo con consentimiento. El texto que se
     escribe en los formularios lo enmascara Clarity por defecto (Masking:
     Balanced en su panel; no bajarlo a Relaxed en esta web). */
  function loadClarity(): void {
    if (clarityLoaded || !config.clarityId) return;
    clarityLoaded = true;
    // cola del fragmento oficial: encola las llamadas hasta que carga el tag
    if (!window.clarity) {
      const q: unknown[] = [];
      const stub = function (): void {
        // eslint-disable-next-line prefer-rest-params
        q.push(arguments);
      } as unknown as NonNullable<Window['clarity']>;
      (stub as unknown as { q: unknown[] }).q = q;
      window.clarity = stub;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + config.clarityId;
    document.head.appendChild(s);
    // Desde oct. 2025 Clarity exige señal de consentimiento para visitas de
    // la UE. Solo se carga tras aceptar, así que se concede la analítica;
    // la publicitaria siempre denegada (no hay anuncios en la web).
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
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

  // Con consentimiento: analítica completa y Meta Pixel (este no tiene modo
  // sin cookies, así que solo carga si se acepta).
  function grant(): void {
    consentimientoAnalitica(true);
    loadClarity();
    loadMeta();
  }

  let choice: string | null = null;
  try { choice = localStorage.getItem('am_cookies'); } catch (err) {}
  loadGA(choice === 'all');   // siempre; en modo denegado salvo que ya aceptara
  if (choice === 'all') { loadClarity(); loadMeta(); }
  else if (!choice && bar) bar.hidden = false;

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
    consentimientoAnalitica(false);   // retirar el consentimiento hasta que vuelva a elegir
    window.clarity?.('consent', false); // Clarity: borra sus cookies y deja de rastrear

    const modal = $('#legal-modal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';

    if (bar) bar.hidden = false;
  });
}
