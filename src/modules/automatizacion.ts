import { $, $$ } from './utils';

/* ============================================================
   /automatizacion-procesos-ia/ · los cuatro pasos (.auto-linea)
   Al bajar, la línea de la izquierda se llena hasta donde va el lector
   (--avance, de 0 a 1) y cada paso se enciende (.activo) al llegar a él.
   Con «reducir movimiento», todo encendido desde el principio.
   Estilos en src/styles/automatizacion.css.
   ============================================================ */
export function initPasosAutomatizacion(): void {
  const lista = $<HTMLElement>('.auto-linea');
  if (!lista) return;
  const pasos = $$<HTMLElement>('.auto-paso', lista);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lista.style.setProperty('--avance', '1');
    pasos.forEach((p) => p.classList.add('activo'));
    return;
  }

  let pendiente = false;
  const pintar = (): void => {
    pendiente = false;
    const marca = window.innerHeight * 0.62;   // la «altura de lectura»
    const caja = lista.getBoundingClientRect();
    const avance = Math.min(1, Math.max(0, (marca - caja.top) / caja.height));
    lista.style.setProperty('--avance', avance.toFixed(4));
    pasos.forEach((p) => {
      p.classList.toggle('activo', p.getBoundingClientRect().top + 58 < marca);
    });
  };
  const pedir = (): void => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };

  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  pintar();
}

/* El dibujo de la cabecera (.auto-flujo): se enseña y se anima cuando entra
   en pantalla (.anima), empezando por el desorden. Con «reducir movimiento»
   sale quieto en su estado final (lo resuelve el CSS). */
export function initFlujoAutomatizacion(): void {
  const flujo = $<HTMLElement>('.auto-flujo');
  if (!flujo) return;
  if (!('IntersectionObserver' in window)) { flujo.classList.add('anima'); return; }
  const io = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) {
      flujo.classList.add('anima');
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(flujo);
}
