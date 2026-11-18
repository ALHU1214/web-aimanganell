"""Logos de los clientes para /trabajos/, en el azul de AI MANGANELL (#0071eb).

Uso (desde cualquier carpeta; las rutas, absolutas):
  python -I scripts/logos-trabajos.py assets/trabajos       elnuba=<logo de ELNUBA> salom=<logo de Salomn> libanes=<logo de El Libanés>

Saca de cada logo solo el dibujo y las letras, lo pinta plano en azul sobre
transparente y lo guarda como assets/trabajos/logo-<slug>.webp (200 px de
alto), más una vista previa prev-<slug>.png sobre fondo oscuro. Borrar las
previas antes de hacer commit.

Cada logo tiene su receta, porque cada uno viene distinto:
- ELNUBA: recortado sobre transparente -> su silueta, con rayas finas donde
  cambia el color dentro del lápiz (franjas y punta).
- Salomn: huella y letras claras dentro de un círculo negro -> lo claro.
- El Libanés: cartel con relieve -> las letras blancas y el cedro verde,
  sin el borde ni la franja blanca central.
Para un cliente nuevo, añadir su receta y mirar la vista previa.
Necesita numpy, pillow y scipy.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src = {k: v for k, v in (a.split('=', 1) for a in sys.argv[2:])}
out = sys.argv[1]
AZUL = (0, 113, 235)

def guardar(nombre, mask):
    m = np.clip(mask, 0, 1)
    ys, xs = np.where(m > 0.04)
    m = m[ys.min():ys.max()+1, xs.min():xs.max()+1]
    h, w = m.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = AZUL
    rgba[..., 3] = (m * 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    alto = 200
    im = im.resize((round(w * alto / h), alto), Image.LANCZOS)
    im.save(f'{out}/logo-{nombre}.webp', lossless=True, quality=100, method=6)
    prev = Image.new('RGBA', (im.width + 80, im.height + 80), (6, 16, 25, 255))
    prev.alpha_composite(im, (40, 40)); prev.convert('RGB').save(f'{out}/prev-{nombre}.png')
    print(nombre, im.size)

# ELNUBA: recortado sobre transparente -> su silueta
a = np.asarray(Image.open(src['elnuba']).convert('RGBA')).astype(float) / 255
al = a[..., 3]; H, W = al.shape
pal = np.array([[247,138,55],[252,226,101],[232,67,67],[244,200,130],[120,60,30]]) / 255
d = ((a[..., None, :3] - pal[None, None]) ** 2).sum(-1)
cls = d.argmin(-1)
cls = ndi.median_filter(cls, size=9)
borde = np.zeros_like(al, bool)
borde[:-1] |= cls[:-1] != cls[1:]; borde[:, :-1] |= cls[:, :-1] != cls[:, 1:]
zona = np.zeros_like(borde); zona[int(H * .13): int(H * .5), : int(W * .2)] = True
corte = ndi.binary_dilation(borde & zona & (al > .9), iterations=9)
m = al * ~corte
guardar('elnuba', ndi.gaussian_filter(m, 1.2))

# Salomn: círculo negro; nos quedamos con lo claro (huella y letras)
a = np.asarray(Image.open(src['salom']).convert('RGBA')).astype(float) / 255
lum = a[..., :3] @ [0.299, 0.587, 0.114]
guardar('salomn', np.clip((lum - 0.35) / 0.35, 0, 1) * a[..., 3])

# El Libanés: letras blancas (no el borde exterior ni la franja central) + cedro verde
a = np.asarray(Image.open(src['libanes']).convert('RGBA')).astype(float) / 255
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
blanco = (r > .78) & (g > .72) & (b > .72) & (al > .5)
verde = (g > r + .12) & (g > b + .05) & (al > .5)
lab, n = ndi.label(blanco)
areas = np.bincount(lab.ravel())
orden = np.argsort(areas[1:])[::-1] + 1
quitar = {orden[0]}               # borde exterior + franja central (van unidos)
# también lo blanco que cae dentro del cedro (sus puntos)
cedro = ndi.binary_fill_holes(ndi.binary_closing(verde, iterations=4))
keep = np.isin(lab, [i for i in range(1, n+1) if i not in quitar]) & ~cedro
mask = (keep | (verde & ~ndi.binary_dilation(blanco & cedro, iterations=1))).astype(float)
# fuera trocitos sueltos (brillos del relieve)
lab2, n2 = ndi.label(mask > 0)
ar2 = np.bincount(lab2.ravel()); ar2[0] = 0
mask = mask * np.isin(lab2, np.where(ar2 > 120)[0])
mask = ndi.gaussian_filter(mask, 0.7)
guardar('el-libanes', mask)
for i in orden[:4]: print('comp', i, areas[i])
