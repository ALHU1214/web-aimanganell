# AI MANGANELL · web

Web estática en GitHub Pages (`aimanganell.com`). El HTML se edita a mano;
el CSS y el JS se escriben en `src/` y se compilan.

## Estructura

```
web/
├── index.html           Portada (hero + formulario)
├── consultoria/         Página del AI & Cyber AMG™
├── contacto-aimanganell/ Página de contacto
├── gracias/             Tras enviar un formulario (noindex)
├── legal/               Aviso legal, privacidad, cookies — URL propia + modal
├── blog/
│   ├── posts/           DATOS de cada post (*.post) — lo único que toca n8n
│   ├── <slug>/          Páginas generadas — NO editar a mano, ver "Blog"
│   ├── index.html       Listado — generado
│   └── rss.xml          Feed — generado
├── src/
│   ├── styles/          CSS por módulos (nav, hero, formulario, consultoria…)
│   ├── modules/         JS por módulos (TypeScript)
│   └── config.ts        Ajustes: calendario, WhatsApp, Supabase, analítica…
├── styles.css           GENERADO desde src/styles — no editar a mano
├── main.js              GENERADO desde src/ — no editar a mano
├── contraste-minimo.css Ajustes de contraste (a mano)
├── scripts/             Build del CSS/JS y generador del blog
├── sitemap.xml, robots.txt  Generados por el build del blog
├── DEPLOY.md            Checklist de publicación
└── assets/              Logos, favicon, vídeo del hero, fuentes, imágenes
```

## CSS y JS: se editan en `src/`

`styles.css` y `main.js` salen de `src/`. Si se editan directamente, el
próximo build los sobrescribe y el cambio se pierde (ya pasó: durante un
tiempo `styles.css` llevó dos copias del CSS mezcladas).

```bash
npm install        # la primera vez
npm run build      # compila src/styles → styles.css y src/*.ts → main.js
npm run check      # comprueba tipos de TypeScript
```

Tras compilar, se hace commit de `src/` **y** de `styles.css`/`main.js`:
GitHub Pages sirve los archivos tal cual, no compila nada. Los `?v=` de
las páginas los pone solo el workflow al hacer push.

**Colores y tipografía:** `src/styles/theme.css`, bloque `:root`.
Cambiando `--acc`, `--acc2` y `--acc-rgb` cambia el acento de toda la web.

## Ajustes (`src/config.ts`)

| Clave | Para qué |
|---|---|
| `calUrl` | URL de cal.com donde se agenda la llamada |
| `waNumber` / `waMsg` | WhatsApp de la página de gracias (vacío = sin bloque) |
| `heroVideo` | Vídeo de fondo de la portada (vacío = sin vídeo) |
| `supabase` | Dónde se guardan los leads (`url`, `key`, `table`) |
| `webhookUrl` | Opcional: n8n / Zapier / Make, recibe el lead en JSON |
| `turnstileSiteKey` | Anti-spam de Cloudflare en los formularios |
| `gaId` / `metaPixelId` | Analítica. Vacío = desactivada |

Cada clave se puede sobrescribir con una variable de entorno o un `.env`
al compilar (ver `.env.example`).

## Verla en local

```bash
npx serve . -l 5000
```

Y abrir `http://localhost:5000`. Hace falta un servidor (no vale abrir el
archivo): los enlaces son absolutos (`/consultoria/`) y los vídeos y las
fuentes no cargan desde `file://`.

## Blog

Contenido y presentación separados: `blog/posts/*.post` son los datos
(uno por post), `blog/<slug>/` y `blog/index.html` (el listado) son
las páginas ya generadas. **No se edita nada de eso a mano** — se
sobrescribe en el próximo build. El formato exacto de un `.post` está
documentado en [`blog/posts/README.md`](blog/posts/README.md).

**Quién publica:** los posts los escribe y sube un workflow de **n8n que
corre en local**, en el PC de Álvaro. Solo publica mientras ese n8n está
encendido: con el PC apagado no sale ningún post. Lo que viene después
sí es automático: el push de n8n dispara en GitHub el workflow
`build-blog.yml`, que genera las páginas sin depender de ningún PC.

El listado se genera ordenado por fecha descendente, con filtro por
categoría (mejora progresiva: sin JS se ven todos los posts con enlaces
reales; con JS, los botones filtran sin navegar). Los posts con
`"noindex": true` no aparecen en el listado, ni en el sitemap ni en el
RSS: el mismo campo controla las tres cosas.

```bash
node scripts/build-blog.js    # genera posts, listado, sitemap, robots y RSS
```

Es Node puro, sin `npm install`. Necesita **ffmpeg** en el PATH para las
variantes 4:3 y 1:1 de cada portada (sin él, el post se genera solo con
la 16:9). En GitHub lo hace solo el workflow
`.github/workflows/build-blog.yml` en cada push que toque `blog/posts/`,
las plantillas o los CSS/JS sellados.

Rediseñar el blog es editar `scripts/post-template.html` y volver a
ejecutar el build: todos los posts se regeneran sin tocar ningún `.post`.

**SEO técnico (JSON-LD):** cada post lleva `BreadcrumbList` + `BlogPosting`
(+ `FAQPage` si tiene preguntas) generados solos; el listado lleva
`CollectionPage` + `BreadcrumbList` (+ `ItemList`). La portada,
consultoría y contacto llevan su marcado escrito a mano. `robots.txt` no
bloquea nada con `Disallow`: las páginas no indexables ya llevan
`<meta name="robots" content="noindex">`, y combinar los dos impediría a
Google rastrearlas para ver esa etiqueta.

## Nota sobre las claves

Todo lo de `src/config.ts` acaba en `main.js`, que es público. La clave de
Supabase es una *publishable key*, pensada para eso, pero la tabla `leads`
debe tener RLS activo con una política que **solo permita insertar**,
nunca leer.
