"use strict";
/* ============================================================
   AI MANGANELL · lógica de la web
   Sin dependencias. Se apoya en window.AM_CONFIG (config.js).
   ============================================================ */
(function () {
    'use strict';
    const CFG = (window.AM_CONFIG || {});
    function $(s, r) {
        return (r || document).querySelector(s);
    }
    function $$(s, r) {
        return Array.prototype.slice.call((r || document).querySelectorAll(s));
    }
    /* ---------- 1 · navegación entre las dos páginas ---------- */
    const pages = {
        home: $('#home'),
        info: $('#page2')
    };
    function showPage(which, anchor) {
        if (pages.home)
            pages.home.hidden = which !== 'home';
        if (pages.info)
            pages.info.hidden = which !== 'info';
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
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = a.getAttribute('data-go');
            if (!target)
                return;
            const href = a.getAttribute('href') || '';
            const anchor = href.charAt(0) === '#' && href.length > 1 && href !== '#page2' ? href.slice(1) : '';
            showPage(target, anchor);
        });
    });
    // enlaces internos dentro de la página 2 (#contacto, #diagnostico…)
    $$('#page2 a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const hrefAttr = a.getAttribute('href');
            if (!hrefAttr)
                return;
            const id = hrefAttr.slice(1);
            const el = id ? document.getElementById(id) : null;
            if (!el)
                return;
            e.preventDefault();
            window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        });
    });
    (function scrollToHashWhenReady() {
        const id = window.location.hash.slice(1);
        if (!id)
            return;
        const target = document.getElementById(id);
        if (!target)
            return;
        const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        const pageLoaded = new Promise((resolve) => {
            if (document.readyState === 'complete')
                resolve();
            else
                window.addEventListener('load', () => resolve(), { once: true });
        });
        Promise.all([fontsReady, pageLoaded]).then(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
                cleanHashFromUrl();
            });
        });
        function cleanHashFromUrl() {
            let done = false;
            function clean() {
                if (done)
                    return;
                done = true;
                window.removeEventListener('scrollend', clean);
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            if ('onscrollend' in window)
                window.addEventListener('scrollend', clean, { once: true });
            setTimeout(clean, 1500);
        }
    })();
    function setupVideo(video, src, opts) {
        if (!video || !src) {
            if (video)
                video.style.display = 'none';
            return;
        }
        opts = opts || {};
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        video.loop = true;
        const small = window.matchMedia('(max-width:760px)').matches;
        if (small) {
            video.style.display = 'none';
            return;
        }
        video.preload = 'auto';
        video.src = src;
        if (opts.rate) {
            const rate = opts.rate;
            video.addEventListener('loadedmetadata', () => {
                video.playbackRate = rate;
            });
        }
        if (opts.fade) {
            video.style.transition = 'opacity .35s linear';
            video.addEventListener('timeupdate', () => {
                if (!video.duration || isNaN(video.duration))
                    return;
                const edge = Math.min(video.currentTime, video.duration - video.currentTime);
                video.style.opacity = edge < 0.5 ? String(0.6 + 0.4 * (edge / 0.5)) : '1';
            });
        }
        video.addEventListener('pause', () => {
            video.play().catch(() => { });
        });
        video.play().catch(() => {
            const arrancar = () => {
                video.play().catch(() => { });
                ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => {
                    window.removeEventListener(ev, arrancar);
                });
            };
            ['touchstart', 'pointerdown', 'scroll'].forEach((ev) => {
                window.addEventListener(ev, arrancar, { once: false, passive: true });
            });
        });
    }
    setupVideo($('#hero-video'), CFG.heroVideo, { fade: true });
    setupVideo($('.p2-hero-video'), CFG.consultoriaVideo, { rate: CFG.consultoriaVideoRate });
    /* ---------- 3 · filtro de categoría del blog ---------- */
    const blogFilterBtns = $$('.blog-filter-btn');
    if (blogFilterBtns.length) {
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
    /* ---------- 4 · textarea que crece con el texto ---------- */
    $$('.autogrow').forEach((t) => {
        t.addEventListener('input', () => {
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
        });
    });
    /* ---------- 5 · envío del formulario ---------- */
    window.onloadTurnstile = function () {
        if (!window.turnstile || !CFG.turnstileSiteKey)
            return;
        $$('.lead-form').forEach((form) => {
            const box = $('.turnstile-box', form);
            if (!box)
                return;
            form._turnstileId = window.turnstile?.render(box, {
                sitekey: CFG.turnstileSiteKey,
                theme: 'dark'
            });
        });
    };
    function sendLead(data, turnstileToken, origen) {
        const pending = [];
        const sb = CFG.supabase || {};
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
                    biz: data.bizLabel || '',
                    notas: data.bizLabel ? 'Tipo de negocio: ' + data.bizLabel : '',
                    turnstileToken: turnstileToken || ''
                })
            }).catch(() => new Response()));
        }
        if (CFG.webhookUrl) {
            pending.push(fetch(CFG.webhookUrl, {
                method: 'POST',
                keepalive: true,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(() => new Response()));
        }
        return Promise.all(pending);
    }
    $$('.lead-form').forEach((form) => {
        const errBox = $('.form-error', form);
        const btn = $('button[type="submit"]', form);
        const origen = form.getAttribute('data-origen') ||
            (form.classList.contains('lead-form-2') ? 'Consultoría' : 'Landing web');
        function fail(msg) {
            if (errBox) {
                errBox.textContent = msg;
                errBox.hidden = false;
            }
        }
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = {
                nombre: form.nombre.value.trim(),
                empresa: form.empresa.value.trim(),
                email: form.email.value.trim(),
                telefono: form.telefono.value.trim(),
                biz: form.biz.value,
                bizLabel: form.biz.options[form.biz.selectedIndex]
                    ? form.biz.options[form.biz.selectedIndex].text.trim()
                    : '',
                mensaje: form.mensaje.value.trim()
            };
            if (!d.nombre || !d.empresa || d.email.indexOf('@') === -1 || !d.telefono || !d.biz) {
                return fail('Rellena nombre, empresa, teléfono, email y tipo de negocio.');
            }
            if (!form.acepta.checked) {
                return fail('Debes aceptar la política de privacidad.');
            }
            if (errBox)
                errBox.hidden = true;
            const token = (window.turnstile && form._turnstileId != null)
                ? window.turnstile.getResponse(form._turnstileId)
                : '';
            const enviado = sendLead(d, token, origen);
            if (window.turnstile && form._turnstileId != null) {
                window.turnstile.reset(form._turnstileId);
            }
            try {
                sessionStorage.setItem('am_lead', JSON.stringify({
                    nombre: d.nombre,
                    email: d.email
                }));
            }
            catch (err) { }
            if (window.gtag)
                window.gtag('event', 'generate_lead', { origen: origen });
            if (window.fbq)
                window.fbq('track', 'Lead', { content_category: origen });
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Enviando…';
            }
            let confirmado = false;
            function confirmarYSalir() {
                if (confirmado)
                    return;
                confirmado = true;
                if (btn) {
                    btn.textContent = 'Enviado ✓';
                    btn.classList.add('is-enviado');
                }
                setTimeout(() => { window.location.href = '/gracias/'; }, 1500);
            }
            enviado.then(confirmarYSalir, confirmarYSalir);
            setTimeout(confirmarYSalir, 1000);
        });
    });
    /* ---------- 6 · página de gracias ---------- */
    const gracias = $('.gracias');
    if (gracias) {
        let lead = null;
        try {
            lead = JSON.parse(sessionStorage.getItem('am_lead') || 'null');
        }
        catch (err) { }
        const calBtn = $('.gracias-cal', gracias);
        if (calBtn && CFG.calUrl) {
            let calHref = CFG.calUrl;
            if (lead && lead.nombre && lead.email) {
                calHref += (calHref.indexOf('?') > -1 ? '&' : '?') +
                    'name=' + encodeURIComponent(lead.nombre) +
                    '&email=' + encodeURIComponent(lead.email);
            }
            calBtn.href = calHref;
        }
        const waBox = $('.gracias-wa', gracias);
        if (waBox) {
            const waNum = (CFG.waNumber || '').replace(/[^0-9]/g, '');
            const waBtn = $('.gracias-wa-btn', waBox);
            if (waNum && waBtn) {
                waBtn.href = 'https://wa.me/' + waNum +
                    (CFG.waMsg ? '?text=' + encodeURIComponent(CFG.waMsg) : '');
                waBox.hidden = false;
            }
        }
    }
    /* ---------- 7 · modal legal — contenido bajo demanda ---------- */
    const modal = $('#legal-modal');
    const titleEl = $('#legal-title');
    const bodyEl = modal ? $('.legal-body', modal) : null;
    const titles = {
        priv: 'Política de privacidad',
        aviso: 'Aviso legal',
        cookies: 'Política de cookies'
    };
    const legalCache = {};
    function fetchLegalBody(doc, url) {
        if (legalCache[doc])
            return Promise.resolve(legalCache[doc]);
        return fetch(url).then((res) => {
            if (!res.ok)
                throw new Error('HTTP ' + res.status);
            return res.text();
        }).then((html) => {
            const parsed = new DOMParser().parseFromString(html, 'text/html');
            const source = parsed.querySelector('.legal-body');
            if (!source)
                throw new Error('sin .legal-body en la respuesta');
            $$('h2', source).forEach((h) => {
                const h3 = parsed.createElement('h3');
                h3.innerHTML = h.innerHTML;
                if (h.parentNode)
                    h.parentNode.replaceChild(h3, h);
            });
            legalCache[doc] = source.innerHTML;
            return legalCache[doc];
        });
    }
    function openLegal(doc, url) {
        if (!modal || !bodyEl || !url) {
            if (url)
                window.location.href = url;
            return;
        }
        if (titleEl)
            titleEl.textContent = titles[doc] || titles.priv;
        bodyEl.innerHTML = '<p>Cargando…</p>';
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        fetchLegalBody(doc, url).then((html) => {
            if (modal.hidden)
                return;
            bodyEl.innerHTML = html;
        }).catch(() => {
            closeLegal();
            window.location.href = url;
        });
    }
    function closeLegal() {
        if (!modal)
            return;
        modal.hidden = true;
        document.body.style.overflow = '';
    }
    $$('[data-legal]').forEach((a) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const doc = a.getAttribute('data-legal');
            const url = a.getAttribute('href');
            if (doc)
                openLegal(doc, url);
        });
    });
    const legalClose = $('.legal-close');
    if (legalClose)
        legalClose.addEventListener('click', closeLegal);
    if (modal)
        modal.addEventListener('click', (e) => { if (e.target === modal)
            closeLegal(); });
    document.addEventListener('keydown', (e) => { if (modal && e.key === 'Escape' && !modal.hidden)
        closeLegal(); });
    /* ---------- 8 · cookies y analítica ---------- */
    const bar = $('#cookie-bar');
    let gaLoaded = false;
    let metaLoaded = false;
    function loadGA() {
        if (gaLoaded || !CFG.gaId)
            return;
        gaLoaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function (...args) {
            window.dataLayer?.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', CFG.gaId, { anonymize_ip: true });
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.gaId;
        document.head.appendChild(s);
    }
    function loadMeta() {
        if (metaLoaded || !CFG.metaPixelId)
            return;
        metaLoaded = true;
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(s);
        window.fbq = function (...args) {
            if (window.fbq.queue) {
                window.fbq.queue.push(args);
            }
        };
        window.fbq('init', CFG.metaPixelId);
        window.fbq('track', 'PageView');
    }
    function grant() {
        loadGA();
        loadMeta();
    }
    try {
        const choice = localStorage.getItem('am_cookies');
        if (!choice) {
            if (bar)
                bar.hidden = false;
        }
        else if (choice === 'all') {
            grant();
        }
    }
    catch (err) {
        if (bar)
            bar.hidden = false;
    }
    const cookieAccept = $('#cookie-accept');
    if (cookieAccept)
        cookieAccept.addEventListener('click', () => {
            try {
                localStorage.setItem('am_cookies', 'all');
            }
            catch (e) { }
            grant();
            if (bar)
                bar.hidden = true;
        });
    const cookieReject = $('#cookie-reject');
    if (cookieReject)
        cookieReject.addEventListener('click', () => {
            try {
                localStorage.setItem('am_cookies', 'essential');
            }
            catch (e) { }
            if (bar)
                bar.hidden = true;
        });
    const reopenCookies = $('#reopen-cookies');
    if (reopenCookies)
        reopenCookies.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                localStorage.removeItem('am_cookies');
            }
            catch (err) { }
            closeLegal();
            if (bar)
                bar.hidden = false;
        });
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
    (function initReveal() {
        if (!('IntersectionObserver' in window))
            return;
        const els = [];
        REVEAL_SELECTORS.forEach((sel) => {
            $$(sel).forEach((el) => { if (els.indexOf(el) === -1)
                els.push(el); });
        });
        if (!els.length)
            return;
        els.forEach((el) => { el.setAttribute('data-reveal', ''); });
        document.documentElement.classList.add('js-reveal');
        function cleanUp(el) {
            setTimeout(() => {
                el.removeAttribute('data-reveal');
                el.classList.remove('is-in');
            }, 600);
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting)
                    return;
                const target = entry.target;
                cleanUp(target);
                target.classList.add('is-in');
                io.unobserve(target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
        els.forEach((el) => { io.observe(el); });
    })();
    /* ---------- 10 · menú de móvil ---------- */
    const barra = $('nav');
    const burger = barra ? $('.nav-burger', barra) : null;
    if (barra && burger) {
        const panel = $('.nav-links', barra);
        function cerrarMenu() {
            if (!barra || !burger)
                return;
            if (!barra.classList.contains('abierto'))
                return;
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape')
                cerrarMenu();
        });
        if (window.matchMedia('(min-width: 701px)').addEventListener) {
            window.matchMedia('(min-width: 701px)').addEventListener('change', cerrarMenu);
        }
        else {
            window.addEventListener('resize', () => {
                if (window.innerWidth > 700)
                    cerrarMenu();
            });
        }
    }
})();
