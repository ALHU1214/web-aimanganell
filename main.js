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
  // reajusta con Poppins/Manrope el layout se mueve y el navegador
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
  // Turnstile (modo Managed). El widget se renderiza cuando la API de
  // Cloudflare llama a window.onloadTurnstile — puede pasar antes o
  // después de que este script termine de correr, por eso se engancha
  // así en vez de llamarlo directamente. Si el script de Cloudflare no
  // llega a cargar (bloqueado por un adblocker, CDN caído...) el
  // formulario se puede enviar igual: el bloqueo real está en la Edge
  // Function (submit-lead), que rechaza sin token válido. Aquí solo
  // evitamos que un fallo de un tercero deje el formulario roto.
  window.onloadTurnstile = function () {
    if (!window.turnstile || !CFG.turnstileSiteKey) return;
    $$('.lead-form').forEach(function (form) {
      var box = $('.turnstile-box', form);
      if (!box) return;
      form._turnstileId = window.turnstile.render(box, {
        sitekey: CFG.turnstileSiteKey,
        theme: 'dark'
      });
    });
  };

  // Devuelve una promesa que se resuelve cuando han salido todas las
  // peticiones. El submit la espera antes de redirigir a /gracias/: si
  // redirigiera de inmediato, el navegador podria abortar un fetch aun
  // en vuelo y el lead se perderia. keepalive es el segundo cinturon —
  // permite que la peticion sobreviva a la descarga de la pagina.
  function sendLead(data, turnstileToken, origen) {
    var pending = [];
    var sb = CFG.supabase || {};
    if (sb.url) {
      pending.push(fetch(sb.url + '/functions/v1/submit-lead', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          empresa: data.empresa,
          email: data.email,
          telefono: data.telefono,
          mensaje: data.mensaje,
          origen: origen || 'Landing web',
          notas: data.biz ? 'Tipo de negocio: ' + data.biz : '',
          turnstileToken: turnstileToken || ''
        })
      }).catch(function () {}));
    }
    if (CFG.webhookUrl) {
      pending.push(fetch(CFG.webhookUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {}));
    }
    return Promise.all(pending);
  }

  $$('.lead-form').forEach(function (form) {
    var errBox = $('.form-error', form);
    var btn    = $('button[type="submit"]', form);
    var origen = form.classList.contains('lead-form-2') ? 'Consultoría' : 'Landing web';

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

      var token = (window.turnstile && form._turnstileId != null)
        ? window.turnstile.getResponse(form._turnstileId)
        : '';
      var enviado = sendLead(d, token, origen);
      if (window.turnstile && form._turnstileId != null) {
        window.turnstile.reset(form._turnstileId);
      }

      // Nada de esto viaja por la URL. Nombre y email porque son datos
      // personales y en la query quedarian en el historial, en el Referer
      // y en cada informe de analitica. Y el origen porque ensuciaba la
      // barra de direcciones con un ?o=Landing%20web a cambio de nada:
      // solo servia para separar las conversiones de cada formulario, y
      // eso se hace mejor como parametro del evento, aqui abajo.
      try {
        sessionStorage.setItem('am_lead', JSON.stringify({
          nombre: d.nombre,
          email:  d.email
        }));
      } catch (err) {}

      if (window.gtag) window.gtag('event', 'generate_lead', { origen: origen });
      if (window.fbq)  window.fbq('track', 'Lead', { content_category: origen });

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando…';
      }

      // Se redirige cuando el lead ha salido, pero como muy tarde a los
      // 2,5 s: si la red va mal, el usuario ve su pagina de gracias
      // igualmente y la peticion termina sola gracias a keepalive.
      var saltado = false;
      function irAGracias() {
        if (saltado) return;
        saltado = true;
        window.location.href = '/gracias/';
      }
      enviado.then(irAGracias, irAGracias);
      setTimeout(irAGracias, 2500);
    });
  });

  /* ---------- 6 · página de gracias ----------
     Solo hace algo en /gracias/. El formulario deja nombre y email en
     sessionStorage justo antes de redirigir (ver sección 5); aquí se
     leen para prerrellenar el calendario. Si no hay nada guardado
     — entrada directa por URL, pestaña nueva, un navegador que bloquea
     el almacenamiento — la página se ve igual, solo que con el enlace
     del calendario limpio. */
  var gracias = $('.gracias');
  if (gracias) {
    var lead = null;
    try { lead = JSON.parse(sessionStorage.getItem('am_lead') || 'null'); } catch (err) {}

    var calBtn = $('.gracias-cal', gracias);
    if (calBtn && CFG.calUrl) {
      var calHref = CFG.calUrl;
      if (lead && lead.nombre && lead.email) {
        calHref += (calHref.indexOf('?') > -1 ? '&' : '?') +
          'name=' + encodeURIComponent(lead.nombre) +
          '&email=' + encodeURIComponent(lead.email);
      }
      calBtn.href = calHref;
    }

    // El bloque de WhatsApp viene oculto del HTML y solo se destapa si
    // hay número en config.js: mejor no enseñarlo que enseñar un botón
    // que no lleva a ninguna parte.
    var waBox = $('.gracias-wa', gracias);
    if (waBox) {
      var waNum = (CFG.waNumber || '').replace(/[^0-9]/g, '');
      var waBtn = $('.gracias-wa-btn', waBox);
      if (waNum && waBtn) {
        waBtn.href = 'https://wa.me/' + waNum +
          (CFG.waMsg ? '?text=' + encodeURIComponent(CFG.waMsg) : '');
        waBox.hidden = false;
      }
    }
  }

  /* ---------- 7 · modal legal — contenido bajo demanda ----------
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

  /* ---------- 8 · cookies y analítica ----------
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
  /* ---------- 9 · reveal al hacer scroll (una sola vez) ----------
     Los bloques se marcan desde esta lista de selectores en vez de
     escribir data-reveal en el HTML de cada página: el HTML servido
     queda limpio, que es lo que necesita el modal legal (hace fetch
     de /legal/... e inyecta su .legal-body por innerHTML).
     El blog queda fuera del efecto a propósito: ni el listado ni los
     posts. Si algún día entra, ojo con las plantillas de scripts/.   */
  var REVEAL_SELECTORS = [
    '#home #formulario',
    // .guarantee-bar es una caja con borde y glow: se revela entera.
    // Si se revelara .wrap > * como en las demás secciones, el borde
    // aparecería de golpe y solo el texto de dentro haría el fundido.
    '#page2 .sec > .wrap.guarantee-bar',
    '#page2 .sec > .wrap:not(.guarantee-bar) > *',
    '#page2 .manifiesto > *',
    '#page2 .sec-total > *',
    '#page2 .contacto-head',
    '#page2 .form-sec',
    '.legal-page-wrap > h1',
    '.legal-page-wrap > .legal-date',
    '.legal-page .legal-body > *',  // .legal-page excluye el .legal-body del modal, que se rellena por innerHTML
    // En /gracias/ se revela solo de los pasos hacia abajo: el titular,
    // la confirmacion y el boton de reservar tienen que verse en el primer
    // pintado, sin esperar a ninguna transicion.
    '.gracias-pasos > li',
    '.gracias-links > a'
  ];

  (function initReveal() {
    if (!('IntersectionObserver' in window)) return;

    var els = [];
    REVEAL_SELECTORS.forEach(function (sel) {
      $$(sel).forEach(function (el) { if (els.indexOf(el) === -1) els.push(el); });
    });
    if (!els.length) return;

    // No se pre-marca nada como visible: de eso se encarga el observador.
    // No hace falta y además fallaba, porque en este punto las fuentes
    // (Poppins/Manrope) todavía no han reajustado el layout y el documento
    // mide menos de lo que medirá — bloques que en realidad quedan muy
    // abajo se medían dentro de la primera pantalla y salían ya visibles.
    // No hay parpadeo porque styles.css bloquea el pintado en <head> y
    // este script es síncrono al final del body: se ejecuta antes de que
    // el navegador pinte por primera vez.
    els.forEach(function (el) { el.setAttribute('data-reveal', ''); });
    document.documentElement.classList.add('js-reveal');

    // Al terminar el fundido se le quita el atributo y la clase: el
    // elemento vuelve a ser un elemento normal, sin transition viva ni
    // capa de composición. Importa porque varios de los bloques que se
    // revelan llevan glows muy grandes (.guarantee-bar, .total-box, la
    // .form-shadow del formulario) y mantenerlos compuestos encima de un
    // body con background-attachment:fixed penaliza el scroll.
    // Se hace con temporizador y no con transitionend porque ese evento
    // no llega a dispararse en algunos entornos; con setTimeout la
    // limpieza ocurre siempre. 600ms = los 500 de la transición + margen.
    // Quitar primero el atributo y después la clase deja al elemento sin
    // ninguna de las dos reglas aplicándose, así que no parpadea.
    function cleanUp(el) {
      setTimeout(function () {
        el.removeAttribute('data-reveal');
        el.classList.remove('is-in');
      }, 600);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cleanUp(entry.target);
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);   // una sola vez: al volver a subir no se re-oculta
      });
    }, { rootMargin: '0px 0px -60px 0px' });   // px fijos, no %: el margen negativo nunca puede superar la altura del footer y dejar un bloque sin disparar

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 10 · menú de móvil ----------
     El panel y la animación viven en styles.css, dentro de la consulta
     de 700px. Aquí solo se conmuta la clase, se mantiene aria-expanded
     en sintonía y se cierra en los tres casos en que el usuario espera
     que se cierre: al pulsar un enlace, con Escape, y al ensanchar la
     ventana por encima del punto de corte (si no, al girar el móvil el
     panel se quedaría abierto y desplazado sobre el contenido). */
  var barra = $('nav');
  var burger = $('.nav-burger', barra);
  if (barra && burger) {
    var panel = $('.nav-links', barra);

    function cerrarMenu() {
      if (!barra.classList.contains('abierto')) return;
      barra.classList.remove('abierto');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
    }

    burger.addEventListener('click', function () {
      var abierto = barra.classList.toggle('abierto');
      burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });

    if (panel) {
      $$('a', panel).forEach(function (a) {
        a.addEventListener('click', cerrarMenu);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarMenu();
    });

    window.matchMedia('(min-width: 701px)').addEventListener
      ? window.matchMedia('(min-width: 701px)').addEventListener('change', cerrarMenu)
      : window.addEventListener('resize', function () {
          if (window.innerWidth > 700) cerrarMenu();
        });
  }

})();
