# AI MANGANELL · web

Web estática. Sin build, sin dependencias: HTML + CSS + JS puro.

## Estructura

```
web/
├── index.html          Portada (hero + formulario)
├── consultoria/        Página de consultoría (URL propia, antes vivía oculta en index.html)
├── legal/              Aviso legal, privacidad, cookies — URL propia + modal
├── blog/
│   ├── posts/          DATOS de cada post (*.post) — lo único que toca n8n
│   ├── <slug>/          Páginas generadas — NO editar a mano, ver "Blog" más abajo
│   ├── index.html       Listado — generado
│   └── rss.xml          Feed — generado
├── scripts/            Plantilla y generador del blog (Node puro, sin dependencias)
├── sitemap.xml          Generado — solo páginas indexables
├── robots.txt            Generado
├── styles.css           Todos los estilos
├── main.js              Lógica: navegación, formularios, cookies, vídeos, modal legal
├── config.js            Ajustes que cambian al publicar
├── DEPLOY.md            Checklist para publicar (dominio, Pages, Search Console)
└── assets/              Logos, favicon, vídeos e imágenes compartidas
```

## Verla en local

Abre `index.html` en el navegador, o en VS Code usa la extensión
**Live Server** (botón "Go Live"). Necesario si quieres que carguen
bien los vídeos y las fuentes.

Para regenerar el blog hace falta además **ffmpeg** en el PATH (genera
las variantes de portada en distintos ratios) — ya está instalado en
esta máquina. Si lo ejecutas en otra, instálalo primero; sin él, el
build sigue funcionando pero cada post se queda solo con la portada
16:9, sin las variantes 4:3/1:1.

## Qué tocar antes de publicar

Todo está en `config.js`:

| Clave | Para qué |
|---|---|
| `calUrl` | URL de cal.com donde se agenda la llamada |
| `heroVideo` | Vídeo de fondo de la portada |
| `consultoriaVideo` | Vídeo de fondo de la página de consultoría |
| `supabase` | Dónde se guardan los leads (`url`, `key`, `table`) |
| `webhookUrl` | Opcional: n8n / Zapier / Make, recibe el lead en JSON |
| `gaId` / `metaPixelId` | Analítica. Vacío = desactivada |

**Vídeos:** ya están en local, `assets/hero.mp4` y `assets/consultoria.mp4`
(H.264, 1080p, sin audio, ~2.6 MB cada uno). Los originales sin comprimir
quedaron fuera del repo, en `../videos-originales-backup/`, por si hace
falta recomprimir con otros parámetros.

**Colores y tipografía:** en `styles.css`, bloque `:root` al principio.
Cambiando `--acc`, `--acc2` y `--acc-rgb` cambia el acento de toda la web.

## Blog

Contenido y presentación separados: `blog/posts/*.post` son los datos
(uno por post), `blog/<slug>/` y `blog/index.html` (el listado) son
las páginas ya generadas. **No se edita nada de eso a mano** — se
sobrescribe en el próximo build. El formato exacto de un `.post` está
documentado en [`blog/posts/README.md`](blog/posts/README.md).

El listado (`blog/index.html`) se genera solo, ordenado por fecha
descendente, con filtro por categoría (mejora progresiva: sin JS se
ven todos los posts, con enlaces `<a href>` reales y crawlables; con
JS, los botones filtran sin navegar). Los posts marcados `"noindex":
true` en su `.post` no aparecen en el listado — es el mismo campo que
controla la indexación, así que no hace falta uno nuevo, pero ojo:
esto acopla "no indexar" con "no listar". Si algún día hace falta un
post indexable-pero-no-listado (o al revés), habrá que separar los
dos campos.

Para generar las páginas a partir de los datos:

```bash
node scripts/build-blog.js
```

No hace falta `npm install` — es Node puro. En local hay que
ejecutarlo a mano tras añadir o editar un `.post`; en GitHub, el
workflow `.github/workflows/build-blog.yml` lo hace solo en cada
push que toque `blog/posts/`.

Rediseñar el blog es editar `scripts/post-template.html` y volver a
ejecutar el build — todos los posts (pasados y futuros) se regeneran
con el diseño nuevo, sin tocar ningún `.post`.

**SEO técnico (JSON-LD):** cada post lleva `BreadcrumbList` + `BlogPosting`
(+ `FAQPage` si tiene preguntas) generados solos; el listado lleva
`CollectionPage` + `BreadcrumbList` (+ `ItemList` si hay posts). `index.html`
y `consultoria/index.html` llevan su propio marcado (`ProfessionalService`
y `Service`) escrito a mano. Detalle completo y cómo validarlo en
[`blog/posts/README.md`](blog/posts/README.md#seo-técnico-json-ld).

**`sitemap.xml`, `robots.txt` y `blog/rss.xml`** se generan en el mismo
build, a partir de los mismos `.post`. Ni las 3 páginas legales ni los
posts marcados `noindex` entran en el sitemap ni en el RSS — solo lo
que de verdad quieres que se indexe. `robots.txt` no bloquea nada por
`Disallow` (las páginas no indexables ya llevan su propio
`<meta name="robots" content="noindex">`, y combinar los dos mecanismos
en la misma URL es contraproducente: Google no podría rastrearla para
ver esa etiqueta).

## Publicar en WordPress

La web no es un tema de WordPress. Tres opciones, de menos a más trabajo:

1. **Subdominio o carpeta aparte** (lo más simple). Sube la carpeta `web/`
   por FTP a `public_html/` y sirve el sitio desde ahí. WordPress se queda
   solo para el blog, si lo necesitas.
2. **Plugin de HTML estático** (p. ej. *Simple Custom CSS and JS* +
   una plantilla de página en blanco). Pegas el HTML en una página con
   plantilla vacía y encolas `styles.css` y `main.js`.
3. **Convertirlo en tema hecho a medida**: `index.html` pasa a
   `front-page.php`, los estilos y scripts se encolan con
   `wp_enqueue_style` / `wp_enqueue_script` en `functions.php`, y las
   rutas de `assets/` con `get_template_directory_uri()`.

Si el sitio no va a tener blog ni área privada, la opción 1 es la
más rápida y la más rápida de cargar.

## Subir a GitHub

```bash
cd web
git init
git add .
git commit -m "Primera versión"
git branch -M master
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin master
```

Checklist completo de qué falta para publicar de verdad (Pages, dominio,
Search Console) en [`DEPLOY.md`](DEPLOY.md).

## Nota sobre las claves

`config.js` es público: cualquiera puede leerlo desde el navegador. La
clave de Supabase que hay ahí es una *publishable key*, pensada para eso,
pero asegúrate de que en Supabase la tabla `leads` tiene RLS activo con
una política que **solo permita insertar**, nunca leer.
