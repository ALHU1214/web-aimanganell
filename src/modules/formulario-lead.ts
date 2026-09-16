import { $, $$, trasCarga, cargarScript } from './utils';

interface FieldValidationResult {
  isValid: boolean;
  message: string;
}

const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'tempmail.com', 'temp-mail.org', 'tempmail.net',
  '10minutemail.com', '10minutemail.net',
  'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
  'mailinator.com', 'dispostable.com', 'trashmail.com',
  'getnada.com', 'throwawaymail.com', 'fakeinbox.com',
  'maildrop.cc', 'mohmal.com', 'generator.email', 'emailondeck.com',
  'crazymailing.com', 'nada.ltd', 'mytemp.email'
]);

const DOMAIN_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.es': 'gmail.com',
  'gmai.es': 'gmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmai.es': 'hotmail.es',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlok.es': 'outlook.es',
  'yaho.es': 'yahoo.es',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'iclou.com': 'icloud.com'
};

function validateNombre(val: string): FieldValidationResult {
  const trimmed = val.trim();
  if (!trimmed) {
    return { isValid: false, message: 'El nombre es obligatorio.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'El nombre no puede superar los 50 caracteres.' };
  }
  if (/\d/.test(trimmed)) {
    return { isValid: false, message: 'El nombre no puede contener números.' };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(trimmed)) {
    return { isValid: false, message: 'El nombre solo puede contener letras y espacios.' };
  }
  return { isValid: true, message: '' };
}

function validateEmpresa(val: string): FieldValidationResult {
  const trimmed = val.trim();
  if (!trimmed) {
    return { isValid: false, message: 'El nombre de la empresa es obligatorio. Si no pertenece a ninguna déjalo abajo en el campo "Opcional".' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'El nombre de la empresa no puede superar los 50 caracteres.' };
  }
  return { isValid: true, message: '' };
}

function validateTelefono(val: string): FieldValidationResult {
  const trimmed = val.trim();
  if (!trimmed) {
    return { isValid: false, message: 'El teléfono es obligatorio.' };
  }
  if (!/^[\d\s+\-]{9,15}$/.test(trimmed)) {
    return { isValid: false, message: 'El teléfono debe contener entre 9 y 15 números.' };
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return { isValid: false, message: 'El teléfono debe contener entre 9 y 15 números.' };
  }
  return { isValid: true, message: '' };
}

function validateEmail(val: string): FieldValidationResult {
  const trimmed = val.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, message: 'El correo electrónico es obligatorio.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Introduce un correo electrónico válido (ej. nombre@empresa.com).' };
  }

  const parts = trimmed.split('@');
  if (parts.length === 2) {
    const [user, domain] = parts;

    // 1. Bloqueo de emails temporales / desechables
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { isValid: false, message: 'No se admiten direcciones de correo temporales o desechables.' };
    }

    // 2. Detección de erratas de dominio conocidas
    if (DOMAIN_TYPOS[domain]) {
      const suggestedDomain = DOMAIN_TYPOS[domain];
      return { isValid: false, message: `¿Quisiste decir ${user}@${suggestedDomain}?` };
    }
  }

  return { isValid: true, message: '' };
}

function validateBiz(val: string): FieldValidationResult {
  if (!val) {
    return { isValid: false, message: 'Selecciona una opción de tipo de negocio.' };
  }
  return { isValid: true, message: '' };
}

function validateMensaje(val: string): FieldValidationResult {
  const trimmed = val.trim();
  if (trimmed.length > 300) {
    return { isValid: false, message: 'El mensaje no puede superar los 300 caracteres.' };
  }
  return { isValid: true, message: '' };
}

function setFieldError(fieldEl: HTMLElement, message: string): void {
  const container = fieldEl.closest('.field-wrap, .ct-group') || fieldEl.parentElement;
  if (!container) return;

  let errorSpan = container.querySelector('.field-error') as HTMLSpanElement | null;
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    container.appendChild(errorSpan);
  }

  if (message) {
    errorSpan.textContent = message;
    errorSpan.hidden = false;
    fieldEl.classList.add('is-invalid');
  } else {
    errorSpan.textContent = '';
    errorSpan.hidden = true;
    fieldEl.classList.remove('is-invalid');
  }
}

function sendLead(
  config: AMConfig,
  data: { nombre: string; empresa: string; email: string; telefono: string; mensaje: string; bizLabel?: string },
  turnstileToken: string,
  origen: string
): Promise<unknown[]> {
  const pending: Promise<Response>[] = [];
  const sb = config.supabase || {};
  if (sb.url) {
    pending.push(
      fetch(sb.url + '/functions/v1/submit-lead', {
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
      }).catch(() => new Response())
    );
  }
  if (config.webhookUrl) {
    pending.push(
      fetch(config.webhookUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => new Response())
    );
  }
  return Promise.all(pending);
}

/* ---------- autogrow & envío del formulario con validaciones ---------- */
export function initFormularioLead(config: AMConfig): void {
  // 1. Textarea autogrow: el campo crece con el texto para que siempre se lea
  // entero. scrollHeight no incluye el borde y los campos van con
  // box-sizing: border-box, así que se suma (si no, corta 1-2px del final).
  $$<HTMLTextAreaElement>('.autogrow').forEach((t) => {
    const ajustar = (): void => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + (t.offsetHeight - t.clientHeight) + 'px';
    };
    t.addEventListener('input', ajustar);
    ajustar();   // por si el navegador lo rellena al volver a la página
  });

  // 2. Turnstile y renderizado
  window.onloadTurnstile = function (): void {
    if (!window.turnstile || !config.turnstileSiteKey) return;
    $$<LeadFormElement>('.lead-form').forEach((form) => {
      const box = $('.turnstile-box', form);
      if (!box) return;
      form._turnstileId = window.turnstile?.render(box, {
        sitekey: config.turnstileSiteKey,
        theme: 'dark'
      });
    });
  };

  // Turnstile (~200 KiB entre script y reto) ya no va en el HTML: se pide
  // cuando el formulario se acerca a la pantalla o en cuanto alguien toca
  // un campo, así no frena la carga de páginas donde el formulario queda
  // abajo (consultoría). Tocar un campo lo carga al momento, con tiempo de
  // sobra para que el reto esté resuelto antes de enviar.
  const formularios = $$<LeadFormElement>('.lead-form');
  if (formularios.length && config.turnstileSiteKey) {
    let pedido = false;
    const cargarTurnstile = (): void => {
      if (pedido) return;
      pedido = true;
      cargarScript('https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstile');
    };
    formularios.forEach((f) => f.addEventListener('focusin', cargarTurnstile, { once: true }));
    trasCarga(() => {
      if (!('IntersectionObserver' in window)) { cargarTurnstile(); return; }
      const io = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) { io.disconnect(); cargarTurnstile(); }
      }, { rootMargin: '400px 0px' });
      formularios.forEach((f) => io.observe(f));
    });
  }

  // 3. Validación y envío
  $$<LeadFormElement>('.lead-form').forEach((form) => {
    const errBox = $('.form-error', form);
    const btn = $('button[type="submit"]', form) as HTMLButtonElement | null;
    const origen = form.getAttribute('data-origen') ||
      (form.classList.contains('lead-form-2') ? 'Consultoría' : 'Landing web');

    function fail(msg: string): void {
      if (errBox) {
        errBox.textContent = msg;
        errBox.hidden = false;
      }
    }

    const fieldsToValidate = [
      { el: form.nombre, validator: validateNombre },
      { el: form.empresa, validator: validateEmpresa },
      { el: form.email, validator: validateEmail },
      { el: form.telefono, validator: validateTelefono },
      { el: form.biz, validator: validateBiz },
      { el: form.mensaje, validator: validateMensaje }
    ];

    // Nada se marca en rojo hasta el primer envío fallido. A partir de ahí la
    // validación va en tiempo real, para que cada campo se limpie al corregirlo.
    let envioFallido = false;
    fieldsToValidate.forEach(({ el, validator }) => {
      if (!el) return;
      const validate = () => {
        if (!envioFallido) return true;
        const res = validator(el.value);
        setFieldError(el, res.isValid ? '' : res.message);
        return res.isValid;
      };
      el.addEventListener('input', validate);
      el.addEventListener('blur', validate);
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', validate);
      }
    });

    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();

      let hasError = false;
      let firstInvalidEl: HTMLElement | null = null;

      fieldsToValidate.forEach(({ el, validator }) => {
        if (!el) return;
        const res = validator(el.value);
        if (!res.isValid) {
          setFieldError(el, res.message);
          if (!hasError) {
            hasError = true;
            firstInvalidEl = el;
          }
        } else {
          setFieldError(el, '');
        }
      });

      if (hasError) {
        envioFallido = true;
        fail('Por favor, corrige los errores señalados en el formulario.');
        if (firstInvalidEl) {
          (firstInvalidEl as HTMLElement).focus();
        }
        return;
      }

      if (!form.acepta.checked) {
        return fail('Debes aceptar la política de privacidad.');
      }
      if (errBox) errBox.hidden = true;

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

      const token = (window.turnstile && form._turnstileId != null)
        ? window.turnstile.getResponse(form._turnstileId)
        : '';
      const enviado = sendLead(config, d, token, origen);
      if (window.turnstile && form._turnstileId != null) {
        window.turnstile.reset(form._turnstileId);
      }

      try {
        sessionStorage.setItem('am_lead', JSON.stringify({
          nombre: d.nombre,
          email: d.email
        }));
      } catch (err) {}

      if (window.gtag) window.gtag('event', 'generate_lead', { origen: origen });
      if (window.fbq) window.fbq('track', 'Lead', { content_category: origen });

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando…';
      }

      let confirmado = false;
      function confirmarYSalir(): void {
        if (confirmado) return;
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
}
