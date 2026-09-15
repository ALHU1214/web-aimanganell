/* ---------- partículas de fondo (todas las páginas) ----------
   Puntos de luz que suben despacio por la pantalla. Se generan aquí, no en
   el HTML, para que todas las páginas (y las del blog, que salen de una
   plantilla) tengan las mismas sin copiar marcado.
   Reparto fijo, no aleatorio: cada carga se ve igual y no se amontonan.
   Con prefers-reduced-motion no se muestran (theme.css). */

const CANTIDAD = 22;
// color, opacidad — azul de marca, azul claro y blanco, alternados
const COLORES = [
  'rgba(var(--acc-rgb),.65)',
  'rgba(232,242,239,.5)',
  'rgba(59,141,255,.55)'
];

export function initParticulas(): void {
  let capa = document.querySelector<HTMLElement>('.particles');
  if (!capa) {
    capa = document.createElement('div');
    capa.className = 'particles';
    capa.setAttribute('aria-hidden', 'true');
    document.body.prepend(capa);
  }
  if (capa.children.length) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < CANTIDAD; i++) {
    const p = document.createElement('span');
    const size = i % 2 === 0 ? 2 : 1;
    // repartidas a lo ancho con un pequeño desfase para que no formen columnas
    const left = Math.min(98, Math.max(1, ((i + 0.5) * 100) / CANTIDAD + ((i * 37) % 7) - 3));
    // 7 a 13 s en subir (antes 10 a 18): algo más rápidas
    const dur = 7 + ((i * 53) % 61) / 10;
    const delay = -((i * 29) % 130) / 10;
    p.style.cssText =
      `left:${left.toFixed(1)}%;width:${size}px;height:${size}px;` +
      `background:${COLORES[i % COLORES.length]};` +
      `animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s`;
    frag.appendChild(p);
  }
  capa.appendChild(frag);
}
