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

## Página `/diseno-web/` (portfolio; antes `/trabajos/`)

*Creada el 15-nov-2026 en `/trabajos/`.* Es el portfolio que Álvaro enseña con
un QR en las visitas a puerta fría. **19-nov-2026 (Álvaro): la dirección pasa a
`/diseno-web/`** (sin ñ: en una URL saldría `dise%C3%B1o`). El QR no estaba
impreso (Álvaro): se rehízo apuntando a `https://aimanganell.com/diseno-web/`
(`../departamentos/revenue/portfolio-trabajos/qr-diseno-web-movil.png` y
`qr-diseno-web.svg`). **`trabajos/index.html` se queda como desvío** a
`/diseno-web/` (meta refresh + `location.replace`, `noindex` y canónica a la
nueva), porque Google tenía `/trabajos/` indexada y alguien puede tenerla
guardada: no borrarlo. Las carpetas y nombres internos (`assets/trabajos/`,
`trabajos.css`, `trabajos.ts`, clases `tr-`) no cambian: no se ven.

- **Desde el 18-nov-2026 sale en el menú**, entre AI & CYBER AMG™ y BLOG, en
  todas las páginas y en las dos plantillas del blog de `scripts/`. **Desde el
  19-nov se llama «DISEÑO WEB»** (antes «TRABAJOS»): dice qué ofreces y le da a
  Google un enlace con la palabra clave desde cada página. El menú enlaza a
  `/diseno-web/`. Los tres enlaces de cada proyecto dicen «Ver la web».
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
- **El índice de arriba va con botones, no con enlaces `#slug` (20-nov-2026,
  Álvaro):** con anclas, Google sacaba «Salomn Tenerife» (`/diseno-web/#salomn`)
  como enlace aparte debajo de AI MANGANELL al buscar la marca, y Álvaro no
  quiere a los clientes ahí. Cada botón lleva `data-ir="<slug>"`, cada
  `<article>` `data-proyecto="<slug>"` (sin `id`) y los mueve
  `initIndiceTrabajos` (`src/modules/trabajos.ts`), que también lleva a su
  proyecto a quien entre con un enlace antiguo con `#slug`. **No volver a
  poner `href="#…"` ni `id` en los proyectos.** Sin `noindex`: la página sigue
  indexada.
- **En el ordenador, cada proyecto se queda quieto y centrado mientras pasa
  su web (20-nov-2026, Álvaro: «que se centre en el medio y, al seguir bajando,
  se scrollee la web sin que scrollee otra cosa, como alargar un poco la
  página»).** Antes la captura empezaba a moverse en cuanto el marco asomaba
  y al llegar al centro ya no se veía la portada. Ahora cada `<article>` lleva
  dentro un `<div class="tr-escena">` (la rejilla) que es sticky y está
  centrado en la ventana (relleno de 74 px, el alto del menú, para no quedar
  debajo); el artículo mide una ventana más `--tr-recorrido`, que calcula
  `trabajos.ts` con lo que baja la captura (1 px de rueda = 1 px de web).
  Solo donde cabe entero: de 1101 px de ancho con 640 px de alto o más (de 640
  a 759, número y logo algo menores), y de 761 a 1100 con 960 o más. En
  ventanas más bajas, en el móvil y con «reducir movimiento», como antes
  (comprobado igual que la versión anterior). Al añadir un proyecto, copiar
  también su `tr-escena`.
  **Mientras está quieto, solo se mueve la web del recuadro** (20-nov-2026,
  Álvaro: «que no scrollee el fondo ni las partículas ni nada más»): la
  textura del fondo la pinta una capa fija (`.tr-fondo`, la crea
  `trabajos.ts`) que baja con la página menos lo que llevan los proyectos
  quietos, y las partículas se pausan (`.tr-quieto` en `<html>`). Fuera de
  esos tramos el fondo se ve idéntico al de antes (comparado píxel a píxel).
  Solo sigue latiendo el botón CONTACTO del menú, como siempre. Si se cambia
  el fondo de `.fondo-negro body` (legal-modal.css), cambiar también el de
  `.tr-fondo > div` (trabajos.css).
- **Añadir un proyecto:** `python scripts/capturas-trabajos.py <slug> <url>`
  saca las dos capturas a `assets/trabajos/`; luego se copia un `<article>`
  de `diseno-web/index.html`, se cambian textos, enlaces e imágenes y se añade
  al índice de arriba. Las instrucciones están también en un comentario del HTML.
- Sin etiqueta de estado, la descripción dice lo que es cada uno (por ejemplo,
  El Libanés: «la diseñamos por iniciativa propia, sin encargo»). Nunca
  presentar una propuesta como cliente ni poner resultados o cifras que el
  cliente no haya dicho.
- Estilos en `src/styles/trabajos.css`; el movimiento de las capturas, en
  `src/modules/trabajos.ts`.
- **En el móvil, la web de dentro del recuadro tiene sus proporciones (19-nov-2026,
  Álvaro: «que no se vea ampliada» y «el recuadro como estaba antes»):** el
  recuadro sigue a todo el ancho; dentro va una tercera captura, `<slug>-recuadro`
  (pantalla de 560 × 844, las proporciones del recuadro), con `<picture>` y
  `<source media="(max-width: 760px)">`. Así la web cabe entera y en pequeño. La
  de móvil (390) solo se usa en el móvil pequeño del ordenador. No poner el
  recuadro con forma de móvil (se probó y no era lo que quería). Al añadir un
  proyecto, copiar también el `<picture>` entero.
- **Salomn empieza en la carta (19-nov-2026, Álvaro: los platos son lo fuerte
  de su web):** sus capturas van desde «La Carta» hasta el último plato, con la
  barra de su web arriba y todos los platos (hasta `ALTO_ZONA`). Lo hace solo el script (`ZONAS` en
  `scripts/capturas-trabajos.py`): si se rehacen, sale igual. Para que otro
  proyecto empiece en una sección, se añade ahí su slug con la sección de inicio
  y la de final.
- **Rendimiento (19-nov-2026):** cada captura tiene versiones pequeñas
  (`-movil-400/-640`, `-escritorio-700`) que salen solas de
  `scripts/capturas-trabajos.py`, y cada `<img>` lleva su `srcset`: al añadir
  un proyecto, copiar también el `srcset` y cambiar el nombre.
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

## Portada: títulos H1, H2 y H3 (22-nov-2026, Álvaro)

Álvaro: «nadie va a buscar "Solicita tu AI & Cyber"». Los tres niveles de
título tienen que **verse** y llevar lo que la gente escribe en Google
(sacado de las sugerencias de Google: «consultoría IA para empresas/pymes»,
«ciberseguridad empresas Tenerife», «empresas ciberseguridad Canarias»,
«automatizar procesos en mi empresa»).

- **Enfoque (22-nov-2026, Álvaro): que le encuentren por la consultoría de IA.
  La ciberseguridad es un añadido, no lo que se posiciona:** fuera de títulos,
  H1 y H2. No crear página de ciberseguridad. Estudio de palabras clave en
  `../aeo/clientes/aimanganell/palabras-clave-2026-11-22.md`.
- **H1** (`.hero-kicker`, frase corta encima del gancho, como la de
  /consultoria/): «Consultoría de IA para empresas en Tenerife y Canarias».
  Título de pestaña: «AI MANGANELL - Consultoría de IA para empresas en
  Tenerife y Canarias».
- **/consultoria/**: el H1 es la frase pequeña (`h1.p2-kicker`): «Consultoría
  de IA para pymes que no quieren romper lo que ya funciona». El gancho grande
  es `<p class="p2-hook">`. Título: «Consultoría de IA para pymes: diagnóstico
  AI & Cyber AMG™ - AI MANGANELL».
- El gancho grande («Sabes que deberías usar IA…») sigue igual, pero es un
  `<p class="hero-hook">`, no un título. No volver a hacerlo H1: dos H1
  confunden a Google.
- **H2 del formulario**: «Pide tu diagnóstico de IA» (el enlace a
  /consultoria/ va en «diagnóstico de IA»). El nombre AI & Cyber
  AMG™ sigue en el menú y en /consultoria/.
- **H2 + tres H3** en la sección `.srv-home`, debajo del formulario:
  «Consultoría de IA y automatización para pymes» → «Automatización de
  procesos con IA», «Con la seguridad revisada», «Diseño y desarrollo
  web en Tenerife». Filas con línea fina, sin tarjetas ni iconos. Cada una
  enlaza a /consultoria/, /blog/ y /diseno-web/. Textos sacados de
  /consultoria/ y `llms.txt`: no añadir promesas ni cifras que no estén allí.
- Estilos en `src/styles/hero.css`.
