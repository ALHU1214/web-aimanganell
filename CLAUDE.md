# Instrucciones para Claude Code — AI MANGANELL web

## Antes de tocar nada: `git pull`

Al empezar cualquier sesión de trabajo en este repo, haz `git pull`
**antes** de hacer ningún cambio, incluso si la sesión anterior
terminó con el repo sincronizado.

**Por qué:** el workflow de n8n publica posts nuevos commiteando
directamente a GitHub por su API — sin pasar por esta copia del repo.
(n8n corre en local, en el PC del usuario: solo publica mientras está
encendido. Aun así sus commits no llegan a esta carpeta sin un pull.)
Cuando eso pasa,
GitHub Actions genera `blog/<slug>/`, `blog/index.html`,
`sitemap.xml`, `robots.txt` y `blog/rss.xml`, y los commitea de
vuelta automáticamente. La copia local se queda desactualizada sola,
sin que nadie la toque a mano. Trabajar sobre un repo obsoleto puede
sobrescribir posts ya publicados o provocar conflictos al hacer push
(ya ha pasado).

## CSS y JS: se editan en `src/`, nunca en `styles.css` ni `main.js`

`styles.css` y `main.js` los genera `npm run build` desde `src/styles/`
y `src/*.ts`. Cualquier cambio hecho directamente en ellos se pierde en
el siguiente build.

**Por qué:** en septiembre de 2026, tras migrar a `src/`, se siguió
editando `styles.css` a mano. Al fusionar, el archivo acabó con dos copias
del CSS (la compilada y la antigua) que se pisaban entre sí: 157 KB en vez
de 57, y un arreglo de colores de los desplegables anulado en producción.

Flujo: editar en `src/` → `npm run build` → comprobar en local →
commit de `src/` **y** de `styles.css`/`main.js` (Pages no compila nada).

## Si el pull trae cambios en posts o archivos generados, avisa

Si el `git pull` trae cambios en `blog/posts/`, o en cualquier
archivo generado (`blog/<slug>/`, `blog/index.html`, `sitemap.xml`,
`robots.txt`, `blog/rss.xml`), **avisa antes de continuar** con lo
que se te haya pedido. Suele significar que n8n publicó un post
nuevo (o editó uno existente) desde la última sesión, y conviene
tenerlo en cuenta antes de seguir.

## Página `/trabajos/` (portfolio del QR)

*Creada el 15-nov-2026.* Es el portfolio que Álvaro enseña con un QR en las
visitas a puerta fría. El QR (`https://aimanganell.com/trabajos/`) está en
`../departamentos/revenue/portfolio-trabajos/`: **no cambiar la URL**, que
ya está impresa o guardada en su móvil.

- **Desde el 18-nov-2026 sale en el menú**, entre AI & CYBER AMG™ y BLOG, en
  todas las páginas y en las dos plantillas del blog de `scripts/`. **Desde el
  19-nov se llama «DISEÑO WEB»** (antes «TRABAJOS»): dice qué ofreces y le da a
  Google un enlace con la palabra clave desde cada página. La URL sigue siendo
  `/trabajos/` (la del QR). Los tres enlaces de cada proyecto dicen «Ver la web».
- **Desde el 19-nov-2026 está indexada** (Álvaro): sin `noindex`, en el sitemap
  (`STATIC_PAGES` de `scripts/build-blog.js`) y en `llms.txt`. Es la página para
  las búsquedas de **diseño y desarrollo web en Tenerife y Canarias**: título
  «Diseño y desarrollo web en Tenerife - AI MANGANELL», y esas palabras en la
  entradilla, el texto del cierre, los `alt` y el JSON-LD (`CollectionPage` +
  `Service`). Ojo: al estar indexada, quien busque «El Libanés» puede dar con ella.
  También dice que posicionamos en IA (19-nov-2026, Álvaro), con palabras de cliente:
  «que te encuentren en Google (SEO) y también cuando alguien le pregunta a ChatGPT,
  Gemini o Perplexity por un negocio como el tuyo (posicionamiento en IA)». En ELNUBA,
  «Posicionamiento en Google y en IA» (vendido como «Google y ChatGPT»).
- **Aspecto (19-nov-2026, Álvaro): «que no sean dos estilos distintos»: sigue las
  reglas de la página de AI & Cyber AMG™.** Todo en Poppins y nada en mayúsculas.
  Título y cierre, centrados y grandes, como el manifiesto de consultoría
  («Primero claridad, después IA.»: 700, blanco y la parte azul en su línea).
  Nombres de cada proyecto, como sus títulos de sección (`.sec-title`: 500).
  Si se cambia el estilo de consultoría, cambiar también este. **Nada de etiquetas pequeñas (Trabajos · Tenerife, El siguiente),
  ni estados (Cliente, En desarrollo, Propuesta), ni la línea de sector bajo cada
  nombre.** En el índice, el símbolo de cada cliente (huella, lápiz, cedro) en
  lugar de los números pequeños 01-03 («se nota IA»). **Los números grandes de
  contorno al lado del logo SÍ le gustan: no quitarlos** (se quitaron por error
  el 19-nov y se volvieron a poner).
- Con cinco enlaces, entre 761 y 960 px el menú va a 14 px (`src/styles/nav.css`).
  Si se añade otro enlace, volver a medir de 700 a 1920 px.
- **Añadir un proyecto:** `python scripts/capturas-trabajos.py <slug> <url>`
  saca las dos capturas a `assets/trabajos/`; luego se copia un `<article>`
  de `trabajos/index.html`, se cambian textos, enlaces e imágenes y se añade
  al índice de arriba. Las instrucciones están también en un comentario del HTML.
- Sin etiqueta de estado, la descripción dice lo que es cada uno (por ejemplo,
  El Libanés: «la diseñamos por iniciativa propia, sin encargo»). Nunca
  presentar una propuesta como cliente ni poner resultados o cifras que el
  cliente no haya dicho.
- Estilos en `src/styles/trabajos.css`; el movimiento de las capturas, en
  `src/modules/trabajos.ts`.
- **Logos (18-nov-2026):** cada proyecto lleva el logo del cliente al lado
  del número grande, plano y en nuestro azul, en vector (`assets/trabajos/logo-<slug>.svg`,
  nítido en cualquier pantalla). Se sacan con `scripts/logos-trabajos.py`
  (una receta por logo, trazado con potrace; instrucciones dentro). Las rayas
  del lápiz de ELNUBA se dibujan desde su geometría, no calcadas.
- **Salomn (18-nov-2026, Álvaro):** el logo dice SALOMN, TENERIFE y COMIDA
  AFRICANA (se llama «Salomn Tenerife»). Su eslogan original no se leía a ese
  tamaño, así que se compone aparte con `scripts/logo-salomn-trabajos.py`
  (huella y SALOMN calcados, TENERIFE y COMIDA AFRICANA en Montserrat) y va
  más alto que los otros dos. Cada uno lleva su alto en `.tr-logo--<slug>` para
  que pesen igual. El script también saca el símbolo de cada uno
  (`logo-<slug>-simbolo.svg`) para el índice. Nunca a color: con los colores de
  cada marca la página parece un collage.

## Títulos de pestaña: con guion

*18-nov-2026, Álvaro.* Todos los títulos (`<title>`, `og:title`,
`twitter:title` y el `name` del JSON-LD) separan con guion: `Página - AI MANGANELL`.
Nunca barra `|` ni punto `·`. La home es la única con la marca delante
(`AI MANGANELL - Consultoría de IA y ciberseguridad en Canarias`), a propósito.
Los posts del blog salen de `scripts/build-blog.js` y `scripts/post-template.html`,
que ya lo llevan así.
