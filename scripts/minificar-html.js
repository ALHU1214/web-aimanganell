#!/usr/bin/env node
/* ============================================================
   AI MANGANELL · Copia de publicación con HTML minificado
   Copia la web a _site/ y minifica ahí todos los .html, para que
   "ver código fuente" (Ctrl+U) muestre el HTML compacto.
   Los .html del repo NO se tocan: se siguen editando legibles.
   Lo usa .github/workflows/deploy.yml antes de publicar en Pages.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_site');

// Lo que nunca ha hecho falta servir (o no debe salir del repo).
// Además se salta todo lo que empieza por punto (.env.example,
// .gitignore, .cover-hash...): Jekyll tampoco lo publicaba.
const EXCLUIR = new Set(['node_modules', '_site']);

const OPCIONES = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  minifyCSS: true,
  // El JSON-LD va en <script type="application/ld+json">: terser solo
  // toca los scripts de JS, el JSON lo compacta processScripts aparte
  minifyJS: true,
  processScripts: ['application/ld+json'],
  sortAttributes: false,
  removeRedundantAttributes: false,
  keepClosingSlash: true,
};

function copiar(origen, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    if (entrada.name.startsWith('.') || EXCLUIR.has(entrada.name)) continue;
    const de = path.join(origen, entrada.name);
    const a = path.join(destino, entrada.name);
    if (entrada.isDirectory()) copiar(de, a);
    else fs.copyFileSync(de, a);
  }
}

function listarHtml(dir, lista = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarHtml(ruta, lista);
    else if (entrada.name.endsWith('.html')) lista.push(ruta);
  }
  return lista;
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  copiar(ROOT, OUT);

  let antes = 0;
  let despues = 0;
  for (const archivo of listarHtml(OUT)) {
    const original = fs.readFileSync(archivo, 'utf8');
    const compacto = await minify(original, OPCIONES);
    fs.writeFileSync(archivo, compacto);
    antes += Buffer.byteLength(original);
    despues += Buffer.byteLength(compacto);
  }
  console.log(`HTML minificado: ${(antes / 1024).toFixed(0)} KB → ${(despues / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
