"""
Capturas para la página /trabajos/ (portfolio).

Saca dos imágenes de la web de un proyecto y las deja en assets/trabajos/:
  <slug>-movil.webp       390 px de ancho a 2x  -> 780 px
  <slug>-escritorio.webp  1440 px de ancho      -> 1200 px

Solo se captura el principio de cada web (ALTO_CSS píxeles): en la página la
imagen se desliza dentro de su marco mientras se hace scroll, y con más altura
correría demasiado deprisa. Quien quiera verla entera la toca y se abre en directo.

Uso (desde la raíz del repo):
  python scripts/capturas-trabajos.py <slug> <url>
  python scripts/capturas-trabajos.py salomn https://salomtenerife.com/

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

PERFILES = {
    "movil": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                  is_mobile=True, has_touch=True, ancho_final=780),
    "escritorio": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1,
                       is_mobile=False, has_touch=False, ancho_final=1200),
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
    y = 0
    while y < ALTO_CSS + alto_vista:
        y += alto_vista // 2
        await pagina.evaluate(f"window.scrollTo(0, {y})")
        await pagina.wait_for_timeout(250)
    await pagina.evaluate("window.scrollTo(0, 0)")
    await pagina.wait_for_timeout(1200)
    await pagina.evaluate(QUITAR_FIJOS)

    png = await pagina.screenshot(full_page=True)
    await ctx.close()

    img = Image.open(io.BytesIO(png)).convert("RGB")
    escala = p["device_scale_factor"]
    img = img.crop((0, 0, img.width, min(img.height, ALTO_CSS * escala)))
    if img.width != ancho_final:
        img = img.resize((ancho_final, round(img.height * ancho_final / img.width)), Image.LANCZOS)
    destino = SALIDA / f"{slug}-{nombre}.webp"
    img.save(destino, "WEBP", quality=72, method=6)
    print(f"{destino.relative_to(RAIZ)}  {img.width}x{img.height}  {destino.stat().st_size // 1024} KB")


async def main(slug, url):
    SALIDA.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        navegador = await pw.chromium.launch()
        for nombre, perfil in PERFILES.items():
            await capturar(navegador, slug, url, nombre, perfil)
        await navegador.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1], sys.argv[2]))
