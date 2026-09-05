#!/usr/bin/env node
/* ============================================================
   Sella styles.css, contraste-minimo.css, main.js y config.js con
   ?v=<hash> en todas las paginas y plantillas.

   Por que: GitHub Pages sirve esos cuatro con Cache-Control max-age=14400,
   o sea cuatro horas. Un visitante que ya los tenga cacheados no vuelve a
   pedirlos aunque se publique una version nueva, asi que un cambio de CSS
   puede tardar horas en verse. El HTML, en cambio, caduca en diez minutos.

   Con el hash en la URL el archivo pasa a ser una direccion distinta en
   cuanto cambia su contenido: el HTML nuevo llega enseguida y apunta a una
   URL que nadie tiene cacheada. Si el contenido no cambia, el hash tampoco,
   y se sigue aprovechando la cache.

   Se ejecuta despues de build-blog.js, para sellar tambien las paginas
   recien generadas.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SELLADOS = ['styles.css', 'contraste-minimo.css', 'main.js', 'config.js'];

// hash corto del contenido: 8 caracteres bastan para distinguir versiones
const hashes = {};
for (const f of SELLADOS) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  hashes[f] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
}

function htmlsDe(dir, salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'assets') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlsDe(p, salida);
    else if (e.name.endsWith('.html')) salida.push(p);
  }
  return salida;
}

let tocados = 0;
for (const p of htmlsDe(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  const antes = s;
  for (const [f, h] of Object.entries(hashes)) {
    // captura la ruta con cualquier profundidad de "../" y con o sin ?v= previo
    const re = new RegExp(`((?:\\.\\./)*)${f.replace('.', '\\.')}(\\?v=[0-9a-f]+)?`, 'g');
    s = s.replace(re, (_m, prefijo) => `${prefijo}${f}?v=${h}`);
  }
  if (s !== antes) { fs.writeFileSync(p, s); tocados++; }
}

console.log(`✓ sellado: ${Object.entries(hashes).map(([f, h]) => `${f}=${h}`).join('  ')}`);
console.log(`✓ ${tocados} archivo(s) HTML actualizado(s)`);
