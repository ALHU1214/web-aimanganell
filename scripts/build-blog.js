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

// misma entidad en cada página — inline siempre (no @id cruzado entre
// páginas: la herramienta de resultados enriquecidos de Google valida
// cada página por separado y no resuelve referencias a otro documento)
const ORGANIZATION = {
  '@type': 'Organization',
  name: 'AI MANGANELL',
  url: SITE_URL + '/',
  logo: {
    '@type': 'ImageObject',
    url: SITE_URL + '/assets/logo-h-a.png',
    width: 985,
    height: 168
  }
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

function buildArticleSchema(data, canonical, coverUrl, dateModified) {
  return {
    '@type': 'BlogPosting',
    '@id': canonical + '#article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: data.title,
    description: data.description,
    image: [coverUrl],
    datePublished: data.date,
    dateModified: dateModified,
    author: ORGANIZATION,
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

function renderPost(template, data, bodyHtml, dateModified) {
  const slug = data.slug;
  const width = data.cover.width || 1600;
  const height = data.cover.height || 900;
  const canonical = `${SITE_URL}/blog/${slug}/`;
  const coverUrl = `${SITE_URL}/blog/${slug}/cover.jpg`;
  const robotsTag = data.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : '';

  const graph = [
    buildBreadcrumbSchema([
      { name: 'Inicio', url: `${SITE_URL}/` },
      { name: 'Blog', url: `${SITE_URL}/blog/` },
      { name: data.title, url: canonical }
    ]),
    buildArticleSchema(data, canonical, coverUrl, dateModified)
  ];
  const faqSchema = buildFaqSchema(data.faq);
  if (faqSchema) graph.push(faqSchema);

  const replacements = {
    '{{TITLE}}': escapeHtml(data.title),
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
    `      <a class="blog-card" href="${data.slug}/index.html" data-category="${escapeHtml(data.category)}">\n` +
    '        <div class="blog-card-cover">\n' +
    `          <img src="${data.slug}/cover.jpg" alt="${escapeHtml(data.cover.alt)}" width="${width}" height="${height}" loading="lazy">\n` +
    '        </div>\n' +
    '        <div class="blog-card-body">\n' +
    `          <span class="blog-card-cat">${escapeHtml(data.category)}</span>\n` +
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
      description: 'Artículos sobre automatización con IA y ciberseguridad para pymes B2B: qué automatizar, en qué orden, y los errores más caros que vemos una y otra vez.'
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

      const dateModified = gitLastModifiedISO(`blog/posts/${file}`) || data.date;
      const html = renderPost(template, data, bodyHtml, dateModified);
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
      fs.copyFileSync(coverSrcPath, path.join(outDir, 'cover.jpg'));

      validSlugs.add(data.slug);
      okPosts.push({ data, bodyHtml });
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

  if (errors) {
    console.error(`\n${errors} archivo(s) con error. No se han tocado sus páginas generadas.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${postFiles.length} post(s) generado(s) correctamente.`);
  }
}

build();
