"""Imágenes de vista previa (WhatsApp, LinkedIn, etc.) de cada página.

Cada página que Álvaro manda por WhatsApp lleva su propia imagen de 1200 x 630,
con la misma estética que la de la portada (assets/og.jpg): se aprovechan sus
trazos de luz de la izquierda y se cambia el texto de la derecha.

Uso:  python scripts/imagenes-compartir.py
Sale: assets/compartir-<nombre>.jpg  (una por entrada de IMAGENES)

Para cambiar un texto, se edita IMAGENES y se vuelve a ejecutar. Después hay
que cambiar el nombre del archivo (por ejemplo, añadir -2): WhatsApp guarda las
imágenes que ya ha visto y no se entera del cambio si el nombre es el mismo.
"""
import base64
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
ASSETS = RAIZ / "assets"

IMAGENES = {
    "automatizacion": {
        "fina": "Automatización<br>de procesos",
        "gorda": "con IA.",
        "pie": "Para empresas en Tenerife y Canarias.",
    },
    "diseno-web": {
        "fina": "Diseño web para",
        "gorda": "tu negocio.",
        "pie": "A medida, adaptada al móvil y preparada para salir en Google.",
    },
    "mejorar-web": {
        "fina": "¿Ya tienes web?",
        "gorda": "La mejoramos.",
        "pie": "Adaptada al móvil y preparada para salir en Google y en ChatGPT.",
    },
}


def datos(ruta: Path, tipo: str) -> str:
    return f"data:{tipo};base64," + base64.b64encode(ruta.read_bytes()).decode()


def html(t: dict) -> str:
    fondo = datos(ASSETS / "og.jpg", "image/jpeg")
    logo = datos(ASSETS / "logos" / "horizontal-x.png", "image/png")
    p400 = datos(ASSETS / "fonts" / "poppins-400.woff2", "font/woff2")
    p700 = datos(ASSETS / "fonts" / "poppins-700.woff2", "font/woff2")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:P;font-weight:400;src:url({p400})}}
@font-face{{font-family:P;font-weight:700;src:url({p700})}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;overflow:hidden;background:#020111 url({fondo}) 0 0/1200px 630px no-repeat;font-family:P}}
/* tapa el lema de la imagen original, dejando los trazos de luz */
.tapa{{position:absolute;left:640px;top:0;right:0;bottom:0;
  background:linear-gradient(90deg,rgba(2,1,17,0) 0,#020111 60px)}}
.txt{{position:absolute;left:715px;right:36px;top:0;bottom:0;display:flex;
  flex-direction:column;justify-content:center;color:#f3f4f8}}
.logo{{width:330px;margin-bottom:56px}}
.fina{{font-weight:400;font-size:46px;line-height:1.12;letter-spacing:-.01em}}
.gorda{{font-weight:700;font-size:60px;line-height:1.1;letter-spacing:-.02em;white-space:nowrap}}
.pie{{margin-top:30px;font-size:22px;line-height:1.4;color:#a9b0c6;max-width:440px}}
</style></head><body><div class="tapa"></div><div class="txt">
<img class="logo" src="{logo}" alt="">
<div class="fina">{t['fina']}</div><div class="gorda">{t['gorda']}</div>
<div class="pie">{t['pie']}</div></div></body></html>"""


def main() -> None:
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pag = nav.new_page(viewport={"width": 1200, "height": 630})
        for nombre, textos in IMAGENES.items():
            pag.set_content(html(textos))
            pag.evaluate("document.fonts.ready")
            salida = ASSETS / f"compartir-{nombre}.jpg"
            pag.screenshot(path=str(salida), type="jpeg", quality=86)
            print(f"✓ {salida.relative_to(RAIZ)}  ({salida.stat().st_size // 1024} KB)")
        nav.close()


if __name__ == "__main__":
    main()
