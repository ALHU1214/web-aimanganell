#!/usr/bin/env node
/* ============================================================
   AI MANGANELL · Script de Build Unificado
   Compila CSS con Tailwind CLI y empaqueta JS con esbuild
   inyectando variables de entorno desde .env o el sistema.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');

// Cargar .env si existe en la raíz
const envFile = path.join(ROOT, '.env');
const envVars = {};
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  }
}

// Valores por defecto
const defaults = {
  WA_NUMBER: '34650903265',
  WA_MSG: 'Hola, acabo de solicitar el AI & Cyber AMG en la web.',
  CAL_URL: 'https://cal.com/aimanganell/llamada-inicial',
  HERO_VIDEO: 'assets/hero.mp4',
  CONSULTORIA_VIDEO: '../assets/consultoria.mp4',
  SUPABASE_URL: 'https://dbntpdrvnxdhgvdcexrt.supabase.co',
  SUPABASE_KEY: 'sb_publishable_yoJZhGK0iJrHDNmj7uEBLA_42dE-kGf',
  SUPABASE_TABLE: 'leads',
  WEBHOOK_URL: '',
  TURNSTILE_SITE_KEY: '0x4AAAAAAENeLO4-8PHUoy9x',
  GA_ID: 'G-PLTXXWN26D',
  META_PIXEL_ID: ''
};

// Mapa de defines para esbuild
const define = {};
for (const [key, defaultVal] of Object.entries(defaults)) {
  const val = process.env[key] || envVars[key] || defaultVal;
  define[`process.env.${key}`] = JSON.stringify(val);
}

async function runBuild() {
  console.log('🎨 Compilando CSS con Tailwind v4...');
  execSync('npx @tailwindcss/cli -i src/styles.css -o styles.css --minify', { cwd: ROOT, stdio: 'inherit' });

  console.log('⚡ Empaquetando JS (main.ts -> main.js)...');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/main.ts')],
    outfile: path.join(ROOT, 'main.js'),
    bundle: true,
    target: 'es2020',
    minify: true,
    define
  });

  console.log('⚡ Empaquetando JS (config.ts -> config.js)...');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/config.ts')],
    outfile: path.join(ROOT, 'config.js'),
    bundle: true,
    target: 'es2020',
    minify: true,
    define
  });

  console.log('✨ Build completado con éxito.');
}

runBuild().catch(err => {
  console.error('❌ Error en el proceso de build:', err);
  process.exit(1);
});
