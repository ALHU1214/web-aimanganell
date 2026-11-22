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

/* ============================================================
   El dibujo de la cabecera (.auto-flujo)
   0 – 0,8 s   desorden: los puntos flotan descolocados, unidos por una
               línea enredada.
   0,8 – 2,2 s se ordenan: cada punto va a su sitio y la línea se desenreda
               con ellos (se recalcula en cada fotograma).
   después     automatización: una luz con estela recorre la línea, una y
               otra vez; cada punto se enciende y suelta una onda al pasar.
   Empieza al entrar en pantalla y se para cuando sale (no gasta batería).
   Con «reducir movimiento», todo quieto y ordenado desde el principio.
   ============================================================ */
const FINAL_X = [70, 242, 414, 586, 758, 930];
const FINAL_Y = 60;
const DESORDEN = [[34, -44], [-58, 46], [44, -52], [-36, 42], [56, -36], [-24, 32]];
const T_ORDEN = 0.8;      // cuándo empiezan a ordenarse
const DUR_ORDEN = 1.4;    // cuánto tardan
const T_LUZ = 2.8;        // cuándo sale la primera luz
const DUR_LUZ = 2.2;      // lo que tarda en cruzar
const PAUSA_LUZ = 0.8;    // descanso entre una luz y la siguiente
const ESTELA = 160;       // largo de la estela, en unidades del dibujo

const suave = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function initFlujoAutomatizacion(): void {
  const flujo = $<HTMLElement>('.auto-flujo');
  if (!flujo) return;
  const traza = flujo.querySelector<SVGPathElement>('.auto-traza');
  const luz = flujo.querySelector<SVGLineElement>('.auto-luz');
  const cola = flujo.querySelector<SVGLinearGradientElement>('#auto-cola');
  const nodos = Array.prototype.slice.call(flujo.querySelectorAll('.auto-nodo')) as SVGCircleElement[];
  const ondas = Array.prototype.slice.call(flujo.querySelectorAll('.auto-onda')) as SVGCircleElement[];
  if (!traza || !luz || !cola || nodos.length !== FINAL_X.length) return;

  const colocar = (xs: number[], ys: number[]): void => {
    nodos.forEach((n, i) => { n.setAttribute('cx', xs[i].toFixed(1)); n.setAttribute('cy', ys[i].toFixed(1)); });
    ondas.forEach((o, i) => { o.setAttribute('cx', xs[i].toFixed(1)); o.setAttribute('cy', ys[i].toFixed(1)); });
    traza.setAttribute('d', xs.map((x, i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + ys[i].toFixed(1)).join(' '));
  };
  const finalY = FINAL_X.map(() => FINAL_Y);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    colocar(FINAL_X, finalY);
    flujo.classList.add('anima', 'listo');
    return;
  }

  // estado inicial: desordenado (antes de que se vea)
  colocar(FINAL_X.map((x, i) => x + DESORDEN[i][0]), FINAL_X.map((_, i) => FINAL_Y + DESORDEN[i][1]));
  traza.setAttribute('stroke-dasharray', '6 8');

  let inicio = 0;          // ms en que empezó (descontando pausas)
  let parado = 0;          // ms en que se paró, para reanudar donde iba
  let visible = false;
  let frame = 0;
  let ultimaCabeza = -Infinity;
  let vuelta = -1;

  const encender = (i: number): void => {
    const n = nodos[i];
    const o = ondas[i];
    n.classList.add('encendido');
    window.setTimeout(() => n.classList.remove('encendido'), 420);
    if (o) {
      o.classList.remove('ping');
      void o.getBoundingClientRect();   // reinicia la animación de la onda
      o.classList.add('ping');
    }
  };

  const paso = (ahora: number): void => {
    const t = (ahora - inicio) / 1000;
    const xs: number[] = [];
    const ys: number[] = [];
    let orden = 1;
    FINAL_X.forEach((fx, i) => {
      const p = suave(Math.min(1, Math.max(0, (t - T_ORDEN - i * 0.07) / DUR_ORDEN)));
      orden = Math.min(orden, p);
      // mientras está desordenado, flota un poco
      const flota = 1 - p;
      const ox = DESORDEN[i][0] + Math.sin(t * 2.1 + i * 1.7) * 6;
      const oy = DESORDEN[i][1] + Math.cos(t * 1.8 + i * 2.3) * 6;
      xs.push(fx + ox * flota);
      ys.push(FINAL_Y + oy * flota);
    });
    colocar(xs, ys);
    // la línea pasa de discontinua a continua según se ordena
    if (orden < 1) {
      traza.setAttribute('stroke-dasharray', (6 + orden * 900).toFixed(1) + ' ' + (8 * (1 - orden)).toFixed(2));
    } else if (traza.hasAttribute('stroke-dasharray')) {
      traza.removeAttribute('stroke-dasharray');
      flujo.classList.add('listo');
    }

    // la luz
    if (t >= T_LUZ) {
      const ciclo = DUR_LUZ + PAUSA_LUZ;
      const n = Math.floor((t - T_LUZ) / ciclo);
      const dentro = (t - T_LUZ) - n * ciclo;
      if (n !== vuelta) { vuelta = n; ultimaCabeza = -Infinity; }
      const recorrido = FINAL_X[FINAL_X.length - 1] - FINAL_X[0] + ESTELA;
      const cabeza = FINAL_X[0] + Math.min(1, dentro / DUR_LUZ) * recorrido;
      const x1 = Math.max(FINAL_X[0], cabeza - ESTELA);
      const x2 = Math.min(FINAL_X[FINAL_X.length - 1], cabeza);
      if (dentro < DUR_LUZ && x2 > x1) {
        luz.setAttribute('x1', x1.toFixed(1)); luz.setAttribute('x2', x2.toFixed(1));
        cola.setAttribute('x1', (cabeza - ESTELA).toFixed(1)); cola.setAttribute('x2', cabeza.toFixed(1));
        luz.style.opacity = '1';
      } else {
        luz.style.opacity = '0';
      }
      FINAL_X.forEach((fx, i) => { if (ultimaCabeza < fx && cabeza >= fx && dentro < DUR_LUZ) encender(i); });
      ultimaCabeza = cabeza;
    }
    if (visible) frame = requestAnimationFrame(paso);
  };

  const arrancar = (): void => {
    if (visible) return;
    visible = true;
    const ahora = performance.now();
    if (!inicio) inicio = ahora;
    else if (parado) inicio += ahora - parado;
    parado = 0;
    flujo.classList.add('anima');
    frame = requestAnimationFrame(paso);
  };
  const parar = (): void => {
    if (!visible) return;
    visible = false;
    parado = performance.now();
    cancelAnimationFrame(frame);
  };

  if (!('IntersectionObserver' in window)) { arrancar(); return; }
  new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? arrancar() : parar()));
  }, { threshold: 0.5 }).observe(flujo);
}

/* Los dibujos pequeños de «¿Automatización o agentes de IA?»: se animan
   solo mientras se ven. */
export function initOpcionesAutomatizacion(): void {
  const caja = $<HTMLElement>('.auto-opciones');
  if (!caja) return;
  if (!('IntersectionObserver' in window)) { caja.classList.add('anima'); return; }
  new IntersectionObserver((entradas) => {
    entradas.forEach((e) => caja.classList.toggle('anima', e.isIntersecting));
  }, { threshold: 0.25 }).observe(caja);
}
