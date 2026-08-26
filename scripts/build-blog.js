#!/usr/bin/env node
/* ============================================================
   AI MANGANELL · generador del blog
   Node puro, sin dependencias (npm install no hace falta ni en
   local ni en CI). Lee blog/posts/*.post y genera blog/<slug>/.

   Uso: node scripts/build-blog.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const TEMPLATE_PATH = path.join(__dirname, 'post-template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, 'blog-index-template.html');
const SITE_URL = 'https://aimanganell.com';

const GENERATED_MARKER = '<!-- GENERADO POR scripts/build-blog.js — NO EDITAR A MANO -->';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// páginas escritas a mano que van en el sitemap — deliberadamente NO
// incluye legal/* (llevan noindex) ni blog/<slug>/ (esas se añaden
// solas desde blog/posts/). Si se añade una página nueva a mano al
// sitio, hay que añadirla aquí también para que salga en el sitemap.
const STATIC_PAGES = [
  { relPath: 'index.html', url: SITE_URL + '/' },
  { relPath: path.join('consultoria', 'index.html'), url: SITE_URL + '/consultoria/' }
];

// misma entidad en cada página — inline siempre (no @id cruzado entre
// páginas: la herramienta de resultados enriquecidos de Google valida
// cada página por separado y no resuelve referencias a otro documento).
// El @id sí se repite igual en todas partes (mismo valor que el
// ProfessionalService de index.html) para que un consumidor que cruce
// datos de varias páginas reconozca que es la misma entidad.
const ORGANIZATION = {
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'AI MANGANELL',
  url: SITE_URL + '/',
  logo: {
    '@type': 'ImageObject',
    url: SITE_URL + '/assets/logo-h-a.png',
    width: 985,
    height: 168
  }
};

// autor de los posts: persona real, no la marca — señal de E-E-A-T.
// publisher se queda como ORGANIZATION, sin cambios.
const AUTHOR_PERSON = {
  '@type': 'Person',
  name: 'Álvaro Manganell González',
  url: SITE_URL + '/',
  jobTitle: 'Fundador',
  worksFor: ORGANIZATION
};

// última fecha en que este archivo cambió según git — si no hay
// historial (repo nuevo, archivo sin commitear) devuelve null y quien
// llama usa data.date como respaldo
function gitLastModifiedISO(relPathPosix) {
  try {
    const out = execFileSync(
      'git', ['log', '-1', '--format=%aI', '--', relPathPosix],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString().trim();
    return out || null;
  } catch (e) {
    return null;
  }
}

// recorte centrado con ffmpeg (ya se usa en el proyecto para vídeo).
// Requiere ffmpeg en PATH — si falla (no instalado, imagen ya más
// estrecha que el ratio pedido...) devuelve false y quien llama sigue
// sin esa variante, no rompe el build por esto.
function cropImage(srcPath, destPath, targetW, targetH) {
  try {
    execFileSync('ffmpeg', [
      '-y', '-i', srcPath,
      '-vf', `crop=${targetW}:${targetH}`,
      '-q:v', '3',
      destPath
    ], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch (e) {
    return false;
  }
}

// reencoda la portada a JPEG en vez de copiarla en crudo. Hace falta
// porque las portadas que publica n8n llegan como PNG con nombre .jpg y
// pesan alrededor de 2 MB cada una; el listado del blog carga esa imagen
// en cada tarjeta, asi que iban varios MB por visita. Mismo -q:v que los
// recortes, para que las tres imagenes de un post se vean igual.
// Reencoda siempre, tambien si la fuente ya es JPEG: no acumula perdida
// porque cada build parte del original de blog/posts/, no de la salida
// anterior. Si no hay ffmpeg devuelve false y quien llama copia el
// archivo tal cual, que es como funcionaba antes.
function encodeCover(srcPath, destPath) {
  try {
    execFileSync('ffmpeg', [
      '-y', '-i', srcPath,
      '-q:v', '3',
      destPath
    ], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch (e) {
    return false;
  }
}

// genera cover-4x3.jpg y cover-1x1.jpg junto a cover.jpg, recortando
// desde el centro de la portada original (pensado para fuente 16:9,
// que es el valor por defecto de cover.width/height)
function generateCoverVariants(coverPath, outDir, width, height) {
  const variants = [];
  const w43 = Math.round((height * 4) / 3);
  if (w43 <= width) {
    const dest = path.join(outDir, 'cover-4x3.jpg');
    if (cropImage(coverPath, dest, w43, height)) variants.push({ file: 'cover-4x3.jpg', width: w43, height });
  }
  const w11 = height;
  if (w11 <= width) {
    const dest = path.join(outDir, 'cover-1x1.jpg');
    if (cropImage(coverPath, dest, w11, height)) variants.push({ file: 'cover-1x1.jpg', width: w11, height });
  }
  return variants;
}

// serializa un objeto a JSON-LD dentro de <script>, escapando "<" para
// que un valor con "</script>" dentro no pueda cortar el bloque
function jsonLdScript(graph) {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function buildBreadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  };
}

function fail(msg) {
  console.error('✖ ' + msg);
  process.exitCode = 1;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateHuman(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${parseInt(d, 10)} de ${MESES[parseInt(mo, 10) - 1]} de ${y}`;
}

function readingTimeMinutes(bodyHtml) {
  const text = bodyHtml.replace(/<[^>]+>/g, ' ');
  const words = (text.match(/\S+/g) || []).length;
  return Math.max(1, Math.round(words / 200));
}

// separa "---\n{json}\n---\n<html...>" en { data, body }
function parsePostFile(raw, filePath) {
  const lines = raw.split(/\r?\n/);
  if (lines[0].trim() !== '---') {
    throw new Error(`${filePath}: debe empezar con una línea "---"`);
  }
  const closeIdx = lines.indexOf('---', 1);
  if (closeIdx === -1) {
    throw new Error(`${filePath}: falta la línea "---" que cierra la cabecera JSON`);
  }
  const headerText = lines.slice(1, closeIdx).join('\n');
  const bodyHtml = lines.slice(closeIdx + 1).join('\n').trim();
  let data;
  try {
    data = JSON.parse(headerText);
  } catch (e) {
    throw new Error(`${filePath}: la cabecera no es JSON válido — ${e.message}`);
  }
  return { data, bodyHtml };
}

const REQUIRED_FIELDS = ['slug', 'title', 'description', 'category', 'date', 'cover'];

function validatePost(data, bodyHtml, filePath) {
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) throw new Error(`${filePath}: falta el campo obligatorio "${field}"`);
  }
  if (!data.cover.src) throw new Error(`${filePath}: falta cover.src`);
  if (!data.cover.alt) throw new Error(`${filePath}: falta cover.alt`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error(`${filePath}: date debe tener formato YYYY-MM-DD, recibido "${data.date}"`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) {
    throw new Error(`${filePath}: slug "${data.slug}" debe ser minúsculas-con-guiones`);
  }
  const expectedSlug = path.basename(filePath, '.post');
  if (data.slug !== expectedSlug) {
    throw new Error(`${filePath}: slug "${data.slug}" no coincide con el nombre de archivo (esperado "${expectedSlug}.post")`);
  }
  if (!bodyHtml) throw new Error(`${filePath}: el cuerpo del artículo está vacío`);
  if (data.faq) {
    if (!Array.isArray(data.faq)) throw new Error(`${filePath}: faq debe ser un array`);
    data.faq.forEach((item, i) => {
      if (!item.q || !item.a) throw new Error(`${filePath}: faq[${i}] necesita "q" y "a"`);
    });
  }
  const effectiveTitle = `${data.seoTitle || data.title} · AI MANGANELL`;
  if (effectiveTitle.length > 60) {
    console.warn(`⚠ ${filePath}: el <title> final mide ${effectiveTitle.length} caracteres (> 60): "${effectiveTitle}"${data.seoTitle ? '' : ' — añade "seoTitle" para acortarlo sin tocar el H1'}`);
  }
}

function renderFaqHtml(faq) {
  if (!faq || !faq.length) return '';
  return faq.map(item => (
    '        <details>\n' +
    `          <summary>${escapeHtml(item.q)}</summary>\n` +
    `          <p>${escapeHtml(item.a)}</p>\n` +
    '        </details>'
  )).join('\n');
}

function buildArticleSchema(data, canonical, imageUrls, dateModified) {
  return {
    '@type': 'BlogPosting',
    '@id': canonical + '#article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: data.title,
    description: data.description,
    image: imageUrls,
    datePublished: data.date,
    dateModified: dateModified,
    author: AUTHOR_PERSON,
    publisher: ORGANIZATION
  };
}

function buildFaqSchema(faq) {
  if (!faq || !faq.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
}

/* Convierte un titular en un id usable como ancla: sin tildes, sin
   signos y en minusculas-con-guiones. */
function headingId(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* Pone un id a cada <h2> del cuerpo y devuelve la lista, para poder
   construir la tabla de contenidos sin que el autor la escriba a mano.
   Se hace aqui y no en el .post para que los articulos que genera n8n
   la tengan tambien sin tocar nada. */
function addHeadingIds(html) {
  const headings = [];
  const out = html.replace(/<h2>(.*?)<\/h2>/g, (m, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let id = headingId(text);
    let n = 2;
    while (headings.some(h => h.id === id)) id = headingId(text) + '-' + n++;
    headings.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, headings };
}

function renderTocHtml(headings) {
  if (headings.length < 3) return '';   // con dos apartados no aporta nada
  const items = headings
    .map(h => `      <li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
    .join('\n');
  return `<nav class="post-toc" aria-label="Tabla de contenidos">
    <h2>Tabla de contenidos</h2>
    <ol>
${items}
    </ol>
  </nav>`;
}

function renderKeyPointsHtml(points) {
  if (!Array.isArray(points) || !points.length) return '';
  const items = points.map(p => `      <li>${p}</li>`).join('\n');
  return `<aside class="post-keypoints">
    <h2>Puntos clave</h2>
    <ul>
${items}
    </ul>
  </aside>`;
}

function renderPost(template, data, bodyHtml, dateModified, coverVariants) {
  const slug = data.slug;
  const width = data.cover.width || 1600;
  const height = data.cover.height || 900;
  const canonical = `${SITE_URL}/blog/${slug}/`;
  const coverUrl = `${SITE_URL}/blog/${slug}/cover.jpg`;
  const robotsTag = data.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : '';

  const imageUrls = [coverUrl].concat(
    (coverVariants || []).map(v => `${SITE_URL}/blog/${slug}/${v.file}`)
  );

  const graph = [
    buildBreadcrumbSchema([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'Blog', url: `${SITE_URL}/blog/` },
      { name: data.title, url: canonical }
    ]),
    buildArticleSchema(data, canonical, imageUrls, dateModified)
  ];
  const faqSchema = buildFaqSchema(data.faq);
  if (faqSchema) graph.push(faqSchema);

  const withIds = addHeadingIds(bodyHtml);
  bodyHtml = withIds.html;

  const replacements = {
    '{{KEYPOINTS_HTML}}': renderKeyPointsHtml(data.keyPoints),
    '{{TOC_HTML}}': renderTocHtml(withIds.headings),
    '{{TITLE}}': escapeHtml(data.title),
    '{{SEO_TITLE}}': escapeHtml(data.seoTitle || data.title),
    '{{DESCRIPTION}}': escapeHtml(data.description),
    '{{KEYWORD}}': escapeHtml(data.keyword || ''),
    '{{CANONICAL}}': canonical,
    '{{OG_IMAGE}}': coverUrl,
    '{{ROBOTS_TAG}}': robotsTag,
    '{{CATEGORY}}': escapeHtml(data.category),
    '{{DATE_ISO}}': data.date,
    '{{DATE_HUMAN}}': formatDateHuman(data.date),
    '{{READING_TIME}}': String(readingTimeMinutes(bodyHtml)),
    '{{COVER_ALT}}': escapeHtml(data.cover.alt),
    '{{COVER_WIDTH}}': String(width),
    '{{COVER_HEIGHT}}': String(height),
    '{{BODY_HTML}}': bodyHtml,
    '{{FAQ_HTML}}': renderFaqHtml(data.faq),
    '{{JSONLD}}': jsonLdScript(graph)
  };

  let html = GENERATED_MARKER + '\n' + template;
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }
  return html;
}

function renderCardHtml(post) {
  const { data } = post;
  const width = data.cover.width || 1600;
  const height = data.cover.height || 900;
  return (
    `      <a class="blog-card" href="/blog/${data.slug}/" data-category="${escapeHtml(data.category)}">\n` +
    '        <div class="blog-card-cover">\n' +
    `          <img src="${data.slug}/cover.jpg" alt="${escapeHtml(data.cover.alt)}" width="${width}" height="${height}" loading="lazy">\n` +
    '        </div>\n' +
    '        <div class="blog-card-body">\n' +
    `          <h2>${escapeHtml(data.title)}</h2>\n` +
    `          <p>${escapeHtml(data.description)}</p>\n` +
    `          <time datetime="${data.date}">${formatDateHuman(data.date)}</time>\n` +
    '        </div>\n' +
    '      </a>'
  );
}

function renderFilterHtml(categories) {
  if (categories.length < 2) return '';
  const buttons = ['      <button type="button" class="blog-filter-btn is-active" data-filter="all" aria-pressed="true">Todos</button>']
    .concat(categories.map(cat => (
      `      <button type="button" class="blog-filter-btn" data-filter="${escapeHtml(cat)}" aria-pressed="false">${escapeHtml(cat)}</button>`
    )));
  return '    <div class="blog-filter" role="group" aria-label="Filtrar por categoría">\n' +
    buttons.join('\n') + '\n    </div>';
}

function buildItemListSchema(listedPosts) {
  if (!listedPosts.length) return null;
  return {
    '@type': 'ItemList',
    itemListElement: listedPosts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/blog/${p.data.slug}/`,
      name: p.data.title
    }))
  };
}

function renderBlogIndex(indexTemplate, listedPosts) {
  let cardsHtml, filterHtml;
  if (!listedPosts.length) {
    filterHtml = '';
    cardsHtml = '    <div class="blog-empty">\n      <p>Todavía no hay artículos publicados. Vuelve pronto.</p>\n    </div>';
  } else {
    const categories = Array.from(new Set(listedPosts.map(p => p.data.category))).sort((a, b) => a.localeCompare(b, 'es'));
    filterHtml = renderFilterHtml(categories);
    cardsHtml = '    <div class="blog-grid">\n' + listedPosts.map(renderCardHtml).join('\n') + '\n    </div>';
  }

  const graph = [
    {
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/blog/#webpage`,
      url: `${SITE_URL}/blog/`,
      name: 'Blog · AI MANGANELL',
      description: 'Artículos sobre automatización con IA y ciberseguridad para pymes: qué automatizar, en qué orden, y los errores más caros que vemos una y otra vez.'
    },
    buildBreadcrumbSchema([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'Blog', url: `${SITE_URL}/blog/` }
    ])
  ];
  const itemListSchema = buildItemListSchema(listedPosts);
  if (itemListSchema) graph.push(itemListSchema);

  let html = GENERATED_MARKER + '\n' + indexTemplate;
  html = html.split('{{FILTER_HTML}}').join(filterHtml);
  html = html.split('{{CARDS_HTML}}').join(cardsHtml);
  html = html.split('{{JSONLD}}').join(jsonLdScript(graph));
  return html;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// RFC 822 (lo que exige RSS) a partir de "YYYY-MM-DD" — sin hora real,
// se usa medianoche UTC porque el .post tampoco tiene hora (igual que
// datePublished en el JSON-LD del post)
function toRfc822(dateISO) {
  return new Date(dateISO + 'T00:00:00Z').toUTCString();
}

// XML de sitemap: solo lo indexable — páginas estáticas + posts sin
// noindex. Ni las 3 páginas legales (noindex) ni los posts noindex
// entran aquí.
function buildSitemapXml(listedPosts) {
  const urls = STATIC_PAGES.map(p => ({
    url: p.url,
    lastmod: (gitLastModifiedISO(p.relPath.split(path.sep).join('/')) || '').slice(0, 10)
  }));
  urls.push({ url: `${SITE_URL}/blog/`, lastmod: new Date().toISOString().slice(0, 10) });
  listedPosts.forEach(p => {
    urls.push({ url: `${SITE_URL}/blog/${p.data.slug}/`, lastmod: p.dateModified.slice(0, 10) });
  });

  const entries = urls.map(u => (
    '  <url>\n' +
    `    <loc>${escapeXml(u.url)}</loc>\n` +
    (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
    '  </url>'
  )).join('\n');

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries + '\n' +
    '</urlset>\n';
}

function buildRobotsTxt() {
  // sin Disallow: las páginas no indexables ya llevan
  // <meta name="robots" content="noindex"> en su propio HTML — un
  // Disallow aquí impediría a Google rastrearlas y por tanto NUNCA
  // vería esa etiqueta (los dos mecanismos no se combinan bien)
  return (
    'User-agent: *\n' +
    'Allow: /\n' +
    '\n' +
    `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

function buildRssXml(listedPosts) {
  const items = listedPosts.map(p => {
    const link = `${SITE_URL}/blog/${p.data.slug}/`;
    return (
      '    <item>\n' +
      `      <title>${escapeXml(p.data.title)}</title>\n` +
      `      <link>${escapeXml(link)}</link>\n` +
      `      <guid>${escapeXml(link)}</guid>\n` +
      `      <pubDate>${toRfc822(p.data.date)}</pubDate>\n` +
      `      <category>${escapeXml(p.data.category)}</category>\n` +
      `      <description>${escapeXml(p.data.description)}</description>\n` +
      '    </item>'
    );
  }).join('\n');

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0">\n' +
    '  <channel>\n' +
    '    <title>Blog · AI MANGANELL</title>\n' +
    `    <link>${SITE_URL}/blog/</link>\n` +
    '    <description>Artículos sobre automatización con IA y ciberseguridad para pymes.</description>\n' +
    '    <language>es</language>\n' +
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
    (items ? items + '\n' : '') +
    '  </channel>\n' +
    '</rss>\n';
}

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    fail(`No existe ${POSTS_DIR}`);
    return;
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const postFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.post'));

  if (!postFiles.length) {
    console.log('No hay archivos .post en blog/posts/ — nada que generar.');
  }

  const validSlugs = new Set();
  const okPosts = [];
  let errors = 0;

  for (const file of postFiles) {
    const filePath = path.join(POSTS_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, bodyHtml } = parsePostFile(raw, file);
      validatePost(data, bodyHtml, file);

      const coverSrcPath = path.join(POSTS_DIR, data.cover.src);
      if (!fs.existsSync(coverSrcPath)) {
        throw new Error(`${file}: no se encuentra la imagen de portada "${data.cover.src}" en blog/posts/`);
      }

      const outDir = path.join(BLOG_DIR, data.slug);
      fs.mkdirSync(outDir, { recursive: true });

      const coverDestPath = path.join(outDir, 'cover.jpg');
      if (!encodeCover(coverSrcPath, coverDestPath)) {
        fs.copyFileSync(coverSrcPath, coverDestPath);
      }
      const coverVariants = generateCoverVariants(
        coverDestPath, outDir, data.cover.width || 1600, data.cover.height || 900
      );

      const dateModified = gitLastModifiedISO(`blog/posts/${file}`) || data.date;
      const html = renderPost(template, data, bodyHtml, dateModified, coverVariants);
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

      validSlugs.add(data.slug);
      okPosts.push({ data, bodyHtml, dateModified });
      console.log(`✓ blog/${data.slug}/  ←  blog/posts/${file}`);
    } catch (e) {
      fail(e.message);
      errors++;
    }
  }

  // limpia carpetas generadas cuyo .post ya no existe (solo si llevan
  // nuestra marca — nunca borra nada que no hayamos generado nosotros)
  for (const entry of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'posts' || validSlugs.has(entry.name)) continue;
    const indexPath = path.join(BLOG_DIR, entry.name, 'index.html');
    if (fs.existsSync(indexPath) && fs.readFileSync(indexPath, 'utf8').startsWith(GENERATED_MARKER)) {
      fs.rmSync(path.join(BLOG_DIR, entry.name), { recursive: true, force: true });
      console.log(`🗑 blog/${entry.name}/  (ya no hay blog/posts/${entry.name}.post)`);
    }
  }

  // listado: solo posts sin error y sin noindex, más recientes primero
  const listedPosts = okPosts
    .filter(p => !p.data.noindex)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));

  const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_PATH, 'utf8');
  const indexHtml = renderBlogIndex(indexTemplate, listedPosts);
  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHtml, 'utf8');
  console.log(`✓ blog/index.html  (${listedPosts.length} post(s) listados)`);

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemapXml(listedPosts), 'utf8');
  console.log(`✓ sitemap.xml  (${STATIC_PAGES.length + 1 + listedPosts.length} URLs)`);

  fs.writeFileSync(path.join(ROOT, 'robots.txt'), buildRobotsTxt(), 'utf8');
  console.log('✓ robots.txt');

  fs.writeFileSync(path.join(BLOG_DIR, 'rss.xml'), buildRssXml(listedPosts), 'utf8');
  console.log(`✓ blog/rss.xml  (${listedPosts.length} entradas)`);

  if (errors) {
    console.error(`\n${errors} archivo(s) con error. No se han tocado sus páginas generadas.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${postFiles.length} post(s) generado(s) correctamente.`);
  }
}

build();
