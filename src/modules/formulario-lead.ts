import { $, $$ } from './utils';

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

/* ---------- 4 · autogrow & 5 · envío del formulario ---------- */
export function initFormularioLead(config: AMConfig): void {
  // 4. Textarea autogrow
  $$<HTMLTextAreaElement>('.autogrow').forEach((t) => {
    t.addEventListener('input', () => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    });
  });

  // 5. Turnstile y envío
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

    form.addEventListener('submit', (e: Event) => {
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
      if (errBox) errBox.hidden = true;

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
