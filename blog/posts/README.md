# Formato de datos de un post (`*.post`)

Esta carpeta es la única que tiene que tocar el workflow de n8n. Cada
archivo `<slug>.post` de aquí genera automáticamente `blog/<slug>/`
al ejecutar `node scripts/build-blog.js` — a mano en local, o solo
al hacer push (GitHub Actions se encarga, ver
`.github/workflows/build-blog.yml`).

**n8n nunca debe tocar nada fuera de esta carpeta.** No genera HTML,
no actualiza ningún índice, no ejecuta ningún build. Solo escribe
un `.post` y, si el post tiene portada nueva, la imagen junto a él,
y hace commit + push de los dos.

## Estructura del archivo

```
---
{ ...JSON... }
---
<html del cuerpo del artículo, sin envolver en nada>
```

Tres partes, en este orden exacto:
1. Una línea `---`
2. Un bloque JSON válido (la cabecera de datos)
3. Una línea `---` que cierra la cabecera
4. El resto del archivo: HTML crudo del cuerpo del artículo

## Campos del JSON

| Campo | Obligatorio | Formato | Notas |
|---|---|---|---|
| `slug` | Sí | minúsculas-con-guiones | Debe coincidir EXACTO con el nombre de archivo (`mi-post.post` → `"slug": "mi-post"`). El build falla si no coinciden. |
| `title` | Sí | texto | Se usa en `<title>`, `<h1>`, `og:title`. |
| `description` | Sí | texto, ~150-160 car. | Meta description y `og:description`. |
| `keyword` | No | texto | Keyword principal. Se guarda en `<meta name="keywords">`; no tiene más efecto en SEO (Google la ignora), es sobre todo para trazabilidad del propio workflow. |
| `category` | Sí | texto corto | Aparece en la cabecera del post (badge + línea de metadatos). |
| `date` | Sí | `YYYY-MM-DD` | El build falla si no cumple este formato. |
| `cover.src` | Sí | nombre de archivo | La imagen debe subirse a `blog/posts/` (esta carpeta), con ese mismo nombre, en el mismo commit que el `.post`. |
| `cover.alt` | Sí | texto | Alt real y descriptivo, no vacío. |
| `cover.width` / `cover.height` | No | número | Por defecto 1600×900. Solo hace falta si la imagen tiene otro tamaño. |
| `faq` | No | array de `{ "q": "...", "a": "..." }` | Cualquier número de preguntas, incluido 0. |
| `noindex` | No | `true` / `false` | `true` añade `<meta name="robots" content="noindex, nofollow">`. Para contenido de prueba, no para posts reales. |

Todos los valores de texto son JSON normal — comillas, tildes y saltos
de línea se escapan solos si generas el JSON con `JSON.stringify()`
(o el nodo de n8n que sea) en vez de construir el texto a mano.

## El cuerpo del artículo

Todo lo que va después del segundo `---`, tal cual, hasta el final
del archivo. HTML semántico — `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`,
`<li>`, `<blockquote>`, `<strong>`, `<a>`, `<code>` — **sin clases**.
El CSS del sitio ya da estilo a esas etiquetas dentro de `.post-content`,
así que si el generador de contenido las añade, no pasa nada (se
ignoran), pero no hacen falta.

## Lo que NO hay que generar

- **Tiempo de lectura**: se calcula solo a partir del número de
  palabras del cuerpo. No es un campo del JSON.
- **Bloque de autor y CTA de cierre**: son fijos, iguales en todos
  los posts, y viven en `scripts/post-template.html`, no en los datos.

## Validación

`node scripts/build-blog.js` valida cada `.post` antes de generar
nada: campos obligatorios, formato de fecha y de slug, que la imagen
de portada exista, que el JSON sea válido. Si un archivo tiene un
error, ese post no se genera (ni se toca su página anterior si ya
existía) y el script termina con código de salida distinto de cero
— en GitHub Actions eso hace que el workflow falle de forma visible
en vez de publicar una página a medias.

## Ejemplo completo

Ver [`ejemplo-post.post`](ejemplo-post.post) en esta misma carpeta.
