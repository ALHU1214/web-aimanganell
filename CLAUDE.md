# Instrucciones para Claude Code — AI MANGANELL web

## Antes de tocar nada: `git pull`

Al empezar cualquier sesión de trabajo en este repo, haz `git pull`
**antes** de hacer ningún cambio, incluso si la sesión anterior
terminó con el repo sincronizado.

**Por qué:** el workflow de n8n publica posts nuevos commiteando
directamente a GitHub — sin pasar por esta máquina. Cuando eso pasa,
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
