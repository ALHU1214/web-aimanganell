import { $ } from './utils';

/* ---------- 6 · página de gracias ---------- */
export function initPaginaGracias(config: AMConfig): void {
  const gracias = $('.gracias');
  if (!gracias) return;

  let lead: { nombre?: string; email?: string } | null = null;
  try { lead = JSON.parse(sessionStorage.getItem('am_lead') || 'null'); } catch (err) {}

  const calBtn = $('.gracias-cal', gracias) as HTMLAnchorElement | null;
  if (calBtn && config.calUrl) {
    let calHref = config.calUrl;
    if (lead && lead.nombre && lead.email) {
      calHref += (calHref.indexOf('?') > -1 ? '&' : '?') +
        'name=' + encodeURIComponent(lead.nombre) +
        '&email=' + encodeURIComponent(lead.email);
    }
    calBtn.href = calHref;
  }

  const waBox = $('.gracias-wa', gracias);
  if (waBox) {
    const waNum = (config.waNumber || '').replace(/[^0-9]/g, '');
    const waBtn = $('.gracias-wa-btn', waBox) as HTMLAnchorElement | null;
    if (waNum && waBtn) {
      waBtn.href = 'https://wa.me/' + waNum +
        (config.waMsg ? '?text=' + encodeURIComponent(config.waMsg) : '');
      waBox.hidden = false;
    }
  }
}
