/* ============================================================
   AI MANGANELL · lógica de la web
   Sin dependencias. Se apoya en window.AM_CONFIG (config.js).
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.AM_CONFIG || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1 · navegación entre las dos páginas ---------- */
  var pages = { home: $('#home'), info: $('#page2') };

  function showPage(which, anchor) {
    if (pages.home) pages.home.hidden = which !== 'home';
    if (pages.info) pages.info.hidden = which !== 'info';
    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = a.getAttribute('data-go');
      var href = a.getAttribute('href') || '';
      var anchor = href.charAt(0) === '#' && href.length > 1 && href !== '#page2' ? href.slice(1) : '';
      showPage(target, anchor);
    });
  });

  // enlaces internos dentro de la página 2 (#contacto, #diagnostico…)
  $$('#page2 a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
    });
  });

  // si la URL ya trae un ancla al cargar (enlace externo, ej. desde el
  // blog a /#formulario, o desde fuera a /consultoria/#contacto), hace
  // scroll ahí con el mismo offset que un clic — pero solo cuando la
  // página está visualmente asentada (fuentes cargadas + load), no al
  // analizar el script. El scroll nativo del navegador ocurre antes de
  // eso, con las fuentes de sistema todavía puestas; en cuanto el texto
  // reajusta con Space Grotesk/Manrope el layout se mueve y el navegador
  // no vuelve a corregir solo — por eso aterrizaba en el sitio equivocado
  // (normalmente el h1, más arriba de donde debía frenar).
  (function scrollToHashWhenReady() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;

    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var pageLoaded = new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });

    Promise.all([fontsReady, pageLoaded]).then(function () {
      // un frame más por si algo reajustó justo en el evento load
      requestAnimationFrame(function () {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        cleanHashFromUrl();
      });
    });

    // quita el #ancla de la barra de direcciones una vez el scroll suave
    // termina de verdad (evento scrollend) — replaceState, no navega ni
    // añade entrada al historial. Si el navegador no soporta scrollend,
    // o el scroll no llega a moverse (ya estaba en su sitio y por tanto
    // scrollend no dispara), un timeout de respaldo limpia igualmente.
    function cleanHashFromUrl() {
      var done = false;
      function clean() {
        if (done) return;
        done = true;
        window.removeEventListener('scrollend', clean);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if ('onscrollend' in window) window.addEventListener('scrollend', clean, { once: true });
      setTimeout(clean, 1500);
    }
  })();

  /* ---------- 2 · vídeos de fondo ---------- */
  function setupVideo(video, src, opts) {
    if (!video || !src) { if (video) video.style.display = 'none'; return; }
    opts = opts || {};
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;

    // en móvil con datos limitados o "reducir movimiento", no cargamos vídeo
    var small  = window.matchMedia('(max-width:760px)').matches;
    var conn   = navigator.connection || {};
    var frugal = conn.saveData === true ||
                 /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '') ||
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (small && frugal) { video.style.display = 'none'; return; }

    video.preload = small ? 'metadata' : 'auto';
    video.src = src;
    if (opts.rate) video.addEventListener('loadedmetadata', function () { video.playbackRate = opts.rate; });

    // fundido suave en los extremos del bucle
    if (opts.fade) {
      video.style.transition = 'opacity .35s linear';
      video.addEventListener('timeupdate', function () {
        if (!video.duration || isNaN(video.duration)) return;
        var edge = Math.min(video.currentTime, video.duration - video.currentTime);
        video.style.opacity = edge < 0.5 ? String(0.6 + 0.4 * (edge / 0.5)) : '1';
      });
    }
    video.addEventListener('pause', function () { video.play().catch(function () {}); });
    video.play().catch(function () {});
  }

  setupVideo($('#hero-video'), CFG.heroVideo, { fade: true });
  setupVideo($('.p2-hero-video'), CFG.consultoriaVideo, { rate: CFG.consultoriaVideoRate });

  /* ---------- 3 · filtro de categoría del blog ---------- */
  // mejora progresiva: sin JS los botones no hacen nada y se ven todas
  // las cards (enlaces reales, crawlables); con JS, filtra sin navegar
  var blogFilterBtns = $$('.blog-filter-btn');
  if (blogFilterBtns.length) {
    var blogCards = $$('.blog-card');
    blogFilterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        blogFilterBtns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        blogCards.forEach(function (card) {
          var show = cat === 'all' || card.getAttribute('data-category') === cat;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  /* ---------- 4 · textarea que crece con el texto ---------- */
  $$('.autogrow').forEach(function (t) {
    t.addEventListener('input', function () {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    });
  });

  /* ---------- 5 · envío del formulario ---------- */
  function sendLead(data) {
    var sb = CFG.supabase || {};
    if (sb.url && sb.key) {
      fetch(sb.url + '/rest/v1/' + (sb.table || 'leads'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sb.key,
          Authorization: 'Bearer ' + sb.key,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          nombre: data.nombre,
          empresa: data.empresa,
          email: data.email,
          telefono: data.telefono,
          mensaje: data.mensaje,
          origen: 'Landing web',
          notas: data.biz ? 'Tipo de negocio: ' + data.biz : ''
        })
      }).catch(function () {});
    }
    if (CFG.webhookUrl) {
      fetch(CFG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {});
    }
  }

  $$('.lead-form').forEach(function (form) {
    var card    = form.closest('.form-card');
    var sentBox = $('.form-sent', card);
    var errBox  = $('.form-error', form);
    var calLink = $('.btn-cal', card);

    function fail(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {
        nombre:   form.nombre.value.trim(),
        empresa:  form.empresa.value.trim(),
        email:    form.email.value.trim(),
        telefono: form.telefono.value.trim(),
        biz:      form.biz.value,
        mensaje:  form.mensaje.value.trim()
      };
      if (!d.nombre || !d.empresa || d.email.indexOf('@') === -1 || !d.telefono || !d.biz) {
        return fail('Rellena nombre, empresa, WhatsApp, email y tipo de negocio.');
      }
      if (!form.acepta.checked) {
        return fail('Debes aceptar la política de privacidad.');
      }
      errBox.hidden = true;

      sendLead(d);

      var url = (CFG.calUrl || '#') +
        ((CFG.calUrl || '').indexOf('?') > -1 ? '&' : '?') +
        'name=' + encodeURIComponent(d.nombre) + '&email=' + encodeURIComponent(d.email);
      if (calLink) calLink.href = url;

      form.hidden = true;
      sentBox.hidden = false;

      try { window.open(url, '_blank'); } catch (err) {}
      if (window.gtag) window.gtag('event', 'generate_lead');
      if (window.fbq)  window.fbq('track', 'Lead');
    });
  });

  /* ---------- 6 · modal legal — contenido bajo demanda ----------
     Los tres documentos ya existen como páginas reales (/legal/...).
     En vez de incrustar ~1500 palabras duplicadas en el DOM de CADA
     página, el modal hace fetch() a la página real y muestra solo su
     .legal-body. Si el fetch falla (sin red, sin JS, o el navegador
     no soporta fetch — o en local por file://, donde fetch entre
     archivos está bloqueado por CORS), el enlace lleva a la página
     real: exactamente lo que ya haría sin JS. */
  var modal  = $('#legal-modal');
  var titleEl = $('#legal-title');
  var bodyEl = modal && $('.legal-body', modal);
  var titles = {
    priv:    'Política de privacidad',
    aviso:   'Aviso legal',
    cookies: 'Política de cookies'
  };
  var legalCache = {};

  function fetchLegalBody(doc, url) {
    if (legalCache[doc]) return Promise.resolve(legalCache[doc]);
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (html) {
      var parsed = new DOMParser().parseFromString(html, 'text/html');
      var source = parsed.querySelector('.legal-body');
      if (!source) throw new Error('sin .legal-body en la respuesta');
      legalCache[doc] = source.innerHTML;
      return legalCache[doc];
    });
  }

  function openLegal(doc, url) {
    if (!modal || !bodyEl || !url) { if (url) window.location.href = url; return; }
    if (titleEl) titleEl.textContent = titles[doc] || titles.priv;
    bodyEl.innerHTML = '<p>Cargando…</p>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    fetchLegalBody(doc, url).then(function (html) {
      if (modal.hidden) return; // se cerró mientras cargaba
      bodyEl.innerHTML = html;
    }).catch(function () {
      closeLegal();
      window.location.href = url;
    });
  }
  function closeLegal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  $$('[data-legal]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openLegal(a.getAttribute('data-legal'), a.getAttribute('href'));
    });
  });
  var legalClose = $('.legal-close');
  if (legalClose) legalClose.addEventListener('click', closeLegal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeLegal(); });
  document.addEventListener('keydown', function (e) { if (modal && e.key === 'Escape' && !modal.hidden) closeLegal(); });

  /* ---------- 7 · cookies y analítica ----------
     GA solo se inyecta si el usuario acepta todas las cookies.
     Con "solo esenciales" (o sin elegir aún) no se carga el script
     en absoluto, ni siquiera en modo "denegado": el propio <script>
     de gtag.js no llega a añadirse al DOM. */
  var bar = $('#cookie-bar');
  var gaLoaded = false, metaLoaded = false;

  function loadGA() {
    if (gaLoaded || !CFG.gaId) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.gaId, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.gaId;
    document.head.appendChild(s);
  }

  function loadMeta() {
    if (metaLoaded || !CFG.metaPixelId) return;
    metaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    var n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    n.queue = []; n.loaded = true; n.version = '2.0';
    window.fbq('init', CFG.metaPixelId);
    window.fbq('track', 'PageView');
  }

  function grant() {
    loadGA();
    loadMeta();
  }

  try {
    var choice = localStorage.getItem('am_cookies');
    if (!choice) { if (bar) bar.hidden = false; }
    else if (choice === 'all') { grant(); }
    // choice === 'essential' → no se carga GA ni Meta
  } catch (err) { if (bar) bar.hidden = false; }

  var cookieAccept = $('#cookie-accept');
  if (cookieAccept) cookieAccept.addEventListener('click', function () {
    try { localStorage.setItem('am_cookies', 'all'); } catch (e) {}
    grant();
    if (bar) bar.hidden = true;
  });
  var cookieReject = $('#cookie-reject');
  if (cookieReject) cookieReject.addEventListener('click', function () {
    try { localStorage.setItem('am_cookies', 'essential'); } catch (e) {}
    if (bar) bar.hidden = true;
  });
  var reopenCookies = $('#reopen-cookies');
  if (reopenCookies) reopenCookies.addEventListener('click', function (e) {
    e.preventDefault();
    try { localStorage.removeItem('am_cookies'); } catch (err) {}
    closeLegal();
    if (bar) bar.hidden = false;
  });
})();
