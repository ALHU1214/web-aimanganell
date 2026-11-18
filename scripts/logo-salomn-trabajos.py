"""Logo de Salomn para /trabajos/: huella + SALOMN (calcados de su logo) +
TENERIFE y COMIDA AFRICANA (Montserrat, como el eslogan de su logo), en un
bloque pensado para leerse a unos 150 px de ancho. Sale en SVG, en azul.

Uso: python -I salomn-lockup.py <carpeta de salida> <logo-salom.png>
"""
import sys, pathlib, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import potrace
from playwright.sync_api import sync_playwright

AZUL = '#0071eb'
out = pathlib.Path(sys.argv[1]); src = sys.argv[2]
tmp = pathlib.Path(tempfile.mkdtemp())

# 1. Huella y SALOMN, del logo original (ampliado y suavizado)
a = np.asarray(Image.open(src).convert('RGBA')).astype(float) / 255
lum = a[..., :3] @ [0.299, 0.587, 0.114]
claro = np.clip((lum - .3) / .4, 0, 1) * (a[..., 3] > .5)
h, w = claro.shape
big = Image.fromarray((claro * 255).astype(np.uint8)).resize((w * 6, h * 6), Image.LANCZOS)
m = ndi.gaussian_filter(np.asarray(big).astype(float) / 255, 4.2) > .5
filas = np.where(m.any(1))[0]
saltos = np.where(np.diff(filas) > 1)[0]
# bloques separados por filas en blanco: [huella..., SALOMN, COMIDA AFRICANA]
cortes = [filas[0]] + [filas[i + 1] for i in saltos] + [filas[-1] + 1]
bloques = [(cortes[i], (filas[saltos[i]] + 1) if i < len(saltos) else filas[-1] + 1) for i in range(len(cortes) - 1)]
huella_y = (bloques[0][0], bloques[-3][1]); salomn_y = bloques[-2]
def recorte(y0, y1):
    sub = m[y0:y1]; xs = np.where(sub.any(0))[0]
    return sub[:, xs.min():xs.max() + 1]
for nombre, (y0, y1) in [('huella', huella_y), ('salomn', salomn_y)]:
    Image.fromarray((recorte(y0, y1) * 255).astype(np.uint8)).save(tmp / f'{nombre}.png')

# 2. Composición a 8x en el navegador, con Montserrat
K = 8
html = f"""<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=block">
<style>
 body {{ margin: 0; background: #000; }}
 #logo {{ display: inline-flex; flex-direction: column; align-items: center; padding: {4*K}px; background: #000; }}
 #huella {{ height: {78*K}px; display: block; }}
 #salomn {{ width: {124*K}px; display: block; margin-top: {8*K}px; }}
 .linea {{ font-family: Montserrat; color: #fff; text-transform: uppercase; white-space: nowrap; line-height: 1; }}
 #tenerife {{ font-weight: 700; font-size: {15*K}px; margin-top: {7*K}px; }}
 #comida {{ font-weight: 600; font-size: {12*K}px; margin-top: {7*K}px; }}
</style></head><body>
<div id="logo"><img id="huella" src="huella.png"><img id="salomn" src="salomn.png">
<div class="linea" id="tenerife">Tenerife</div><div class="linea" id="comida">Comida africana</div></div>
<script>
 // Cada línea, justificada a su ancho: TENERIFE al de SALOMN y COMIDA AFRICANA un poco más ancha.
 function ajustar(el, ancho) {{
   el.style.letterSpacing = '0px';
   const n = el.textContent.length, base = el.getBoundingClientRect().width;
   const ls = (ancho - base) / (n - 1);
   el.style.letterSpacing = ls + 'px'; el.style.marginRight = (-ls) + 'px';
 }}
 document.fonts.ready.then(() => {{
   const s = document.getElementById('salomn').getBoundingClientRect().width;
   ajustar(document.getElementById('tenerife'), s);
   ajustar(document.getElementById('comida'), {150*K});
   document.body.dataset.listo = '1';
 }});
</script></body></html>"""
(tmp / 'logo.html').write_text(html, encoding='utf-8')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 2400, 'height': 2400})
    pg.goto((tmp / 'logo.html').as_uri())
    pg.wait_for_selector('body[data-listo="1"]'); pg.wait_for_timeout(300)
    fuente = pg.evaluate("document.fonts.check('600 12px Montserrat') && document.fonts.check('700 12px Montserrat')")
    assert fuente, 'Montserrat no ha cargado'
    pg.locator('#logo').screenshot(path=str(tmp / 'logo.png'))
    b.close()

# 3. A vector
img = np.asarray(Image.open(tmp / 'logo.png').convert('L')).astype(float) / 255
mask = ndi.gaussian_filter(img, .8) > .5
ys, xs = np.where(mask); pad = 4
mask = mask[ys.min() - pad:ys.max() + pad + 1, xs.min() - pad:xs.max() + pad + 1]
H, W = mask.shape
curvas = potrace.Bitmap(~mask).trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                                     alphamax=1.0, opticurve=True, opttolerance=0.2)
f = lambda q: f'{q.x:.0f} {q.y:.0f}'
d = []
for c in curvas:
    d.append(f'M{f(c.start_point)}')
    for s in c.segments:
        d.append(f'L{f(s.c)}L{f(s.end_point)}' if s.is_corner else f'C{f(s.c1)} {f(s.c2)} {f(s.end_point)}')
    d.append('Z')
alto = 200; ancho = round(W * alto / H)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{ancho}" height="{alto}">'
       f'<path fill="{AZUL}" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n')
(out / 'logo-salomn.svg').write_text(svg, encoding='utf-8')
print('logo-salomn.svg', f'{ancho}x{alto}', f'{len(svg)/1024:.0f} KB', f'(a 1x: {W/K:.0f}x{H/K:.0f} px)')
