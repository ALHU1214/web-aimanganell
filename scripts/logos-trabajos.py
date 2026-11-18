"""Logos de los clientes para /trabajos/, en vector (SVG) y en el azul de
AI MANGANELL (#0071eb).

Uso:
  python -I scripts/logos-trabajos.py <carpeta de salida> \\
      elnuba=<logo ELNUBA> salom=<logo Salomn> libanes=<logo El Libanés>

De cada logo se saca solo el dibujo y las letras (una máscara en blanco y
negro, a alta resolución), se pasa a curvas con potrace y se guarda como
logo-<slug>.svg, relleno plano en azul. Cada logo tiene su receta porque
cada uno viene distinto:
- ELNUBA: recortado sobre transparente -> su silueta, con rayas del mismo
  grosor donde el lápiz cambia de pieza (franjas, madera y mina).
- Salomn: huella y letras claras dentro de un círculo negro -> lo claro.
  El original es pequeño (600 px): se amplía antes de trazarlo. Sin la
  línea «COMIDA AFRICANA», que a ese tamaño no se lee.
- El Libanés: cartel con relieve -> letras blancas y cedro verde, sin el
  borde exterior ni la franja blanca central.
Necesita numpy, pillow, scipy y potracer (pip install potracer).
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import potrace

AZUL = '#0071eb'
out = sys.argv[1]
src = dict(a.split('=', 1) for a in sys.argv[2:])
solo = set(src.pop('solo', '').split(',')) - {''}


def rgba(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(float) / 255


def reescalar(mask, factor):
    """Amplía o reduce una máscara suave con Lanczos."""
    h, w = mask.shape
    im = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8), 'L')
    im = im.resize((round(w * factor), round(h * factor)), Image.LANCZOS)
    return np.asarray(im).astype(float) / 255


def svg(nombre, mask, turdsize=4, alphamax=1.0):
    """mask: True = azul. Recorta, traza y guarda el SVG."""
    ys, xs = np.where(mask)
    pad = 4
    mask = mask[max(ys.min() - pad, 0):ys.max() + pad + 1, max(xs.min() - pad, 0):xs.max() + pad + 1]
    h, w = mask.shape
    bm = potrace.Bitmap(~mask)  # potracer traza lo "oscuro" (False)
    curvas = bm.trace(turdsize=turdsize, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                      alphamax=alphamax, opticurve=True, opttolerance=0.2)
    f = lambda p: f'{p.x:.0f} {p.y:.0f}'
    d = []
    for c in curvas:
        d.append(f'M{f(c.start_point)}')
        for s in c.segments:
            if s.is_corner:
                d.append(f'L{f(s.c)}L{f(s.end_point)}')
            else:
                d.append(f'C{f(s.c1)} {f(s.c2)} {f(s.end_point)}')
        d.append('Z')
    alto = 200
    ancho = round(w * alto / h)
    texto = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
             f'width="{ancho}" height="{alto}">'
             f'<path fill="{AZUL}" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n')
    with open(f'{out}/logo-{nombre}.svg', 'w', encoding='utf-8') as fh:
        fh.write(texto)
    print(nombre, f'{ancho}x{alto}', f'{len(texto) / 1024:.0f} KB', len(curvas), 'curvas')


# ---------- ELNUBA ----------
if not solo or 'elnuba' in solo:
    a = rgba(src['elnuba'])
    r, g, b, al = (a[..., i] for i in range(4))
    H, W = al.shape
    lleno = al > .5
    # Piezas del lápiz: madera (clara y con azul alto), y franjas por su verde
    clase = np.full(al.shape, 0, np.int8)
    madera = (r > .78) & (g > .6) & (b > .39)
    clase[~madera & (g > .70)] = 1          # amarillo
    clase[~madera & (g > .25) & (g <= .70)] = 2  # naranja
    clase[~madera & (g <= .25)] = 3         # rojo
    clase[madera] = 4
    clase = ndi.median_filter(clase, size=15)
    # El lápiz es la mancha de la izquierda; la mina (abajo) va sin rayas
    # internas: solo se marca dónde acaba la madera.
    ys, xs = np.where(lleno[:, :int(W * .25)])
    lapiz = np.zeros_like(lleno); lapiz[:, :int(W * .25)] = lleno[:, :int(W * .25)]
    lab, n = ndi.label(lapiz)
    tam = np.bincount(lab.ravel()); tam[0] = 0
    lapiz = lab == tam.argmax()
    # Las rayas se dibujan a partir de la geometría del lápiz, no calcadas
    # píxel a píxel (calcadas salían con quiebros y bultos del sombreado):
    # - las dos franjas, rectas y verticales, en la x media donde cambia el color;
    # - el borde de la madera (las ondas), siguiendo su perfil suavizado;
    # - el final de la madera (donde empieza la mina), suavizado del todo.
    T = 26                                     # grosor de raya, a 4096 px
    filas = np.where(lapiz.any(1))[0]
    cols = np.where(lapiz.any(0))[0]
    es_madera = (clase == 4) & lapiz
    arriba = np.full(W, -1.0); abajo = np.full(W, -1.0)
    for x in cols:
        yy = np.where(es_madera[:, x])[0]
        if len(yy) > 20:
            arriba[x], abajo[x] = yy.min(), yy.max()
    con = arriba >= 0
    xs_m = np.where(con)[0]
    def suave(v, sigma):
        vv = np.interp(np.arange(W), xs_m, v[xs_m])
        return ndi.gaussian_filter1d(vv, sigma)
    ondas = suave(arriba, 3)
    # Final de la madera: solo en las columnas donde debajo empieza la mina
    # (en las de los lados, lo último de madera es el lado del cono). Se
    # ajusta a una curva suave y se alarga para que cruce el cono entero.
    xs_f, ys_f = [], []
    for x in xs_m:
        y = int(abajo[x])
        debajo = lapiz[y + 8:y + 60, x] & (clase[y + 8:y + 60, x] != 4)
        if debajo.size and debajo.mean() > .9:
            xs_f.append(x); ys_f.append(y)
    xs_f, ys_f = np.array(xs_f), np.array(ys_f, float)
    coef = np.polyfit(xs_f, ys_f, 2)
    fin_mad = np.polyval(coef, np.arange(W))
    con_f = np.zeros(W, bool)
    ext = (xs_f.max() - xs_f.min()) * .25
    con_f[int(xs_f.min() - ext):int(xs_f.max() + ext) + 1] = True
    tope = filas.min()
    inicio_ondas = int(np.nanmin(np.where(con, arriba, np.nan)))
    # franjas: en las filas del cuerpo, x donde pasa de amarillo a naranja y de naranja a rojo
    cuerpo = range(tope + int((inicio_ondas - tope) * .3), inicio_ondas - 10)
    xa, xb = [], []
    for y in cuerpo:
        fila = clase[y]
        t1 = np.where((fila[:-1] == 1) & (fila[1:] == 2) & lapiz[y, :-1])[0]
        t2 = np.where((fila[:-1] == 2) & (fila[1:] == 3) & lapiz[y, :-1])[0]
        if len(t1): xa.append(t1[0])
        if len(t2): xb.append(t2[0])
    xa, xb = float(np.median(xa)), float(np.median(xb))
    yy, xx = np.mgrid[0:H, 0:W]
    corte = np.zeros_like(lleno)
    # franjas: desde poco antes de la cúpula de arriba hasta las ondas
    margen_arriba = (inicio_ondas - tope) * .1
    for xc in (xa, xb):
        corte |= (np.abs(xx - xc) <= T / 2) & (yy >= tope + margen_arriba) & (yy <= ondas[np.clip(xx, 0, W - 1)])
    # las ondas cruzan el lápiz de lado a lado (por los dos lados igual)
    con_o = ndi.binary_dilation(con, iterations=45)
    corte |= con_o[xx] & (np.abs(yy - ondas[xx]) <= T / 2)
    corte |= con_f[xx] & (np.abs(yy - fin_mad[xx]) <= T / 2)
    corte = ndi.gaussian_filter(corte.astype(float), 3) > .5
    corte &= lapiz            # las rayas solo cortan el lápiz, nunca la «E» de al lado
    m = lleno & ~corte
    m = ndi.gaussian_filter(m.astype(float), 1.5)
    m = reescalar(m, .5) > .5
    svg('elnuba', m, turdsize=20)

# ---------- Salomn ----------
if not solo or 'salom' in solo:
    a = rgba(src['salom'])
    lum = a[..., :3] @ [0.299, 0.587, 0.114]
    claro = np.clip((lum - .3) / .4, 0, 1) * (a[..., 3] > .5)
    m = reescalar(claro, 5)
    m = ndi.gaussian_filter(m, 3.5) > .5
    # Sin «COMIDA AFRICANA»: a 60-100 px de alto sus letras miden menos de
    # 2 px y no se leen (Álvaro, 18-nov-2026). Es la última línea del logo:
    # lo que queda por debajo del último hueco horizontal en blanco.
    filas = np.where(m.any(1))[0]
    saltos = np.where(np.diff(filas) > 1)[0]
    corte_y = filas[saltos[-1]] + 1
    assert (filas.max() - corte_y) < .1 * (filas.max() - filas.min()), 'la última línea no parece el eslogan'
    m[corte_y:] = False
    svg('salomn', m, turdsize=40, alphamax=1.2)

# ---------- El Libanés ----------
if not solo or 'libanes' in solo:
    a = rgba(src['libanes'])
    rgb = a[..., :3]; al = a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Blanco del relieve: poco saturado y claro (incluye su sombra rosada)
    blanco = (sat < .3) & (mx > .72) & (al > .5)
    # Verde del cedro, con sus sombras
    verde = (g > r * 1.25) & (g > b * 1.15) & (g > .18) & (al > .5)
    verde = ndi.binary_opening(verde, iterations=2)
    lab, n = ndi.label(verde); tam = np.bincount(lab.ravel()); tam[0] = 0
    cedro = lab == tam.argmax()
    cedro_lleno = ndi.binary_fill_holes(cedro)
    # Puntos blancos del cedro: los huecos, limpios y sin motas
    huecos = cedro_lleno & ~cedro
    huecos = ndi.binary_opening(huecos, iterations=2)
    lab_h, nh = ndi.label(huecos); th = np.bincount(lab_h.ravel()); th[0] = 0
    huecos = np.isin(lab_h, np.where(th > 60)[0])
    cedro = cedro_lleno & ~huecos
    # Letras: lo blanco que no es el borde exterior ni la franja central
    lab_b, nb = ndi.label(blanco); tb = np.bincount(lab_b.ravel()); tb[0] = 0
    grande = tb.argmax()
    letras = blanco & (lab_b != grande) & ~ndi.binary_dilation(cedro_lleno, iterations=6)
    letras = ndi.binary_opening(letras, iterations=1)
    lab_l, nl = ndi.label(letras); tl = np.bincount(lab_l.ravel()); tl[0] = 0
    letras = np.isin(lab_l, np.where(tl > 90)[0])
    m = (letras | cedro).astype(float)
    m = reescalar(ndi.gaussian_filter(m, 1.6), 2) > .5
    svg('el-libanes', m, turdsize=30)
