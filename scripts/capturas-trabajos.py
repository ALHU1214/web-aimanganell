"""
Capturas para la página /trabajos/ (portfolio).

Saca tres imágenes de la web de un proyecto y las deja en assets/trabajos/:
  <slug>-movil.webp       390 px de ancho a 2x  -> 780 px   (móvil pequeño, en el ordenador)
  <slug>-escritorio.webp  1440 px de ancho      -> 1200 px  (pantalla grande, en el ordenador)
  <slug>-recuadro.webp    560 px de ancho a 2x  -> 1120 px  (el recuadro, en el móvil)
El recuadro del móvil ocupa todo el ancho (~358 × 540): la web se saca con una
pantalla de esas proporciones (560 × 844) para que quepa entera y en pequeño,
sin verse ampliada (19-nov-2026, Álvaro).

Solo se captura el principio de cada web (ALTO_CSS píxeles): en la página la
imagen se desliza dentro de su marco mientras se hace scroll, y con más altura
correría demasiado deprisa. Quien quiera verla entera la toca y se abre en directo.
Si el proyecto está en ZONAS (abajo), se captura esa parte en vez de la portada.

Uso (desde la raíz del repo):
  python scripts/capturas-trabajos.py <slug> <url>
  python scripts/capturas-trabajos.py salomn https://salomtenerife.com/
  python scripts/capturas-trabajos.py salomn https://salomtenerife.com/ recuadro   (solo esa)

No forma parte del build ni se publica (scripts/ está en INTERNOS de
minificar-html.js). Necesita Python con playwright y Pillow.
"""
import asyncio
import io
import pathlib
import sys

from PIL import Image
from playwright.async_api import async_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "assets" / "trabajos"
ALTO_CSS = 2000
ALTO_ZONA = 2800   # con ZONAS: hasta el final de la zona (los platos de Salomn a 560 px miden ~2500)

# Proyectos cuya captura no empieza en la portada, sino en la parte que más
# luce: (sección donde empieza, elemento donde acaba). Se recorta de una a otro
# (como mucho ALTO_CSS) y se pega encima la barra de la web tal como se ve al
# bajar, para que parezca la web de verdad recorrida en ese punto.
# 19-nov-2026 (Álvaro): Salomn empieza en «La Carta» y pasa por los platos.
ZONAS = {
    "salomn": ("#carta", "#menuGrid"),
}

MEDIR_ZONA = """
([desde, hasta]) => {
  const a = document.querySelector(desde);
  if (!a) return null;
  const b = hasta ? document.querySelector(hasta) : null;
  const barra = [...document.querySelectorAll('body *')].find((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
    const r = el.getBoundingClientRect();
    return r.top <= 2 && r.width >= innerWidth * 0.9 && r.height < 200;
  });
  return {
    inicio: a.getBoundingClientRect().top + scrollY,
    fin: b ? b.getBoundingClientRect().bottom + scrollY : null,
    barra: barra ? barra.getBoundingClientRect().height : 0,
  };
}
"""

PERFILES = {
    "movil": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                  is_mobile=True, has_touch=True, ancho_final=780),
    "escritorio": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1,
                       is_mobile=False, has_touch=False, ancho_final=1200),
    "recuadro": dict(viewport={"width": 560, "height": 844}, device_scale_factor=2,
                     is_mobile=True, has_touch=True, ancho_final=1120),
}

# Botones de los avisos de cookies: se rechazan para que no salgan en la foto
BOTONES_COOKIES = ["Rechazar todas", "Rechazar", "Solo esenciales", "Solo necesarias",
                   "Aceptar todas", "Aceptar"]

# Lo que queda fijo en pantalla (botón de WhatsApp, avisos) se quita;
# la barra de navegación de arriba se deja porque forma parte del diseño.
QUITAR_FIJOS = """
() => {
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    const esBarraArriba = r.top <= 2 && r.width >= innerWidth * 0.9 && r.height < 200;
    if (!esBarraArriba) el.style.setProperty('display', 'none', 'important');
  }
}
"""


async def capturar(navegador, slug, url, nombre, perfil):
    p = dict(perfil)
    ancho_final = p.pop("ancho_final")
    ctx = await navegador.new_context(**p, locale="es-ES")
    pagina = await ctx.new_page()
    await pagina.goto(url, wait_until="load", timeout=60000)
    await pagina.wait_for_timeout(1500)

    for texto in BOTONES_COOKIES:
        boton = pagina.get_by_role("button", name=texto, exact=True)
        try:
            if await boton.count() and await boton.first.is_visible():
                await boton.first.click(timeout=1500)
                await pagina.wait_for_timeout(500)
                break
        except Exception:
            pass

    # Bajar poco a poco para que aparezcan las animaciones de entrada
    alto_vista = p["viewport"]["height"]
    zona = None
    hasta_y = ALTO_CSS + alto_vista
    if slug in ZONAS:
        zona = await pagina.evaluate(MEDIR_ZONA, list(ZONAS[slug]))
        if zona is None:
            sys.exit(f"No encuentro {ZONAS[slug][0]} en {url}")
        hasta_y = zona["inicio"] + ALTO_CSS + alto_vista
    y = 0
    while y < hasta_y:
        y += alto_vista // 2
        await pagina.evaluate(f"window.scrollTo(0, {y})")
        await pagina.wait_for_timeout(250)

    tira_barra = None
    if zona:
        # Medir otra vez, ya con todo cargado, y fotografiar la barra tal como
        # se ve al llegar a la zona (con su fondo de «ya has bajado»).
        zona = await pagina.evaluate(MEDIR_ZONA, list(ZONAS[slug]))
        await pagina.evaluate(f"window.scrollTo(0, {zona['inicio'] - zona['barra']})")
        await pagina.wait_for_timeout(1200)
        await pagina.evaluate(QUITAR_FIJOS)
        if zona["barra"]:
            tira_barra = Image.open(io.BytesIO(await pagina.screenshot())).convert("RGB")
            # En la foto de página entera la barra fija saldría a media altura
            # (donde estaba la pantalla): se esconde y se pega arriba aparte.
            await pagina.evaluate("""() => {
              for (const el of document.querySelectorAll('body *')) {
                const cs = getComputedStyle(el);
                if (cs.position === 'fixed' || cs.position === 'sticky')
                  el.style.setProperty('opacity', '0', 'important');  // no visibility: un hijo puede forzar «visible»
              }
            }""")
    else:
        await pagina.evaluate("window.scrollTo(0, 0)")
        await pagina.wait_for_timeout(1200)
        await pagina.evaluate(QUITAR_FIJOS)

    png = await pagina.screenshot(full_page=True)
    await ctx.close()

    img = Image.open(io.BytesIO(png)).convert("RGB")
    escala = p["device_scale_factor"]
    if zona:
        y0 = max(0, round((zona["inicio"] - zona["barra"]) * escala))
        y1 = y0 + ALTO_ZONA * escala   # la zona manda; el tope solo por si acaso
        if zona["fin"] is not None:
            y1 = min(y1, round((zona["fin"] + 48) * escala))
        img = img.crop((0, y0, img.width, min(img.height, y1)))
        if tira_barra:
            alto_barra = round(zona["barra"] * escala)
            img.paste(tira_barra.crop((0, 0, img.width, alto_barra)), (0, 0))
    else:
        img = img.crop((0, 0, img.width, min(img.height, ALTO_CSS * escala)))
    if img.width != ancho_final:
        img = img.resize((ancho_final, round(img.height * ancho_final / img.width)), Image.LANCZOS)
    destino = SALIDA / f"{slug}-{nombre}.webp"
    img.save(destino, "WEBP", quality=72, method=6)
    print(f"{destino.relative_to(RAIZ)}  {img.width}x{img.height}  {destino.stat().st_size // 1024} KB")
    # Versiones pequeñas para el srcset de diseno-web/index.html (19-nov-2026):
    # cada pantalla baja la que necesita (móvil 400/640/780, escritorio 700/1200).
    for ancho in {"movil": [400, 640], "escritorio": [700], "recuadro": [720]}[nombre]:
        peque = img.resize((ancho, round(img.height * ancho / img.width)), Image.LANCZOS)
        d = SALIDA / f"{slug}-{nombre}-{ancho}.webp"
        peque.save(d, "WEBP", quality=72, method=6)
        print(f"{d.relative_to(RAIZ)}  {peque.width}x{peque.height}  {d.stat().st_size // 1024} KB")


async def main(slug, url, solo=None):
    SALIDA.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        navegador = await pw.chromium.launch()
        for nombre, perfil in PERFILES.items():
            if solo and nombre not in solo:
                continue
            await capturar(navegador, slug, url, nombre, perfil)
        await navegador.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3:] or None))
