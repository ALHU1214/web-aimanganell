# AI MANGANELL · web

Web estática. Sin build, sin dependencias: HTML + CSS + JS puro.

## Estructura

```
web/
├── index.html    Todo el marcado (portada + consultoría + legales)
├── styles.css    Todos los estilos
├── main.js       Lógica: navegación, formularios, cookies, vídeos
├── config.js     Ajustes que cambian al publicar
└── assets/       Logos, favicon y textura de fondo
```

## Verla en local

Abre `index.html` en el navegador, o en VS Code usa la extensión
**Live Server** (botón "Go Live"). Necesario si quieres que carguen
bien los vídeos y las fuentes.

## Qué tocar antes de publicar

Todo está en `config.js`:

| Clave | Para qué |
|---|---|
| `calUrl` | URL de cal.com donde se agenda la llamada |
| `heroVideo` | Vídeo de fondo de la portada |
| `consultoriaVideo` | Vídeo de fondo de la página de consultoría |
| `supabase` | Dónde se guardan los leads (`url`, `key`, `table`) |
| `webhookUrl` | Opcional: n8n / Zapier / Make, recibe el lead en JSON |
| `gaId` / `metaPixelId` | Analítica. Vacío = desactivada |

**Vídeos:** ya están en local, `assets/hero.mp4` y `assets/consultoria.mp4`
(H.264, 1080p, sin audio, ~2.6 MB cada uno). Los originales sin comprimir
quedaron fuera del repo, en `../videos-originales-backup/`, por si hace
falta recomprimir con otros parámetros.

**Colores y tipografía:** en `styles.css`, bloque `:root` al principio.
Cambiando `--acc`, `--acc2` y `--acc-rgb` cambia el acento de toda la web.

## Publicar en WordPress

La web no es un tema de WordPress. Tres opciones, de menos a más trabajo:

1. **Subdominio o carpeta aparte** (lo más simple). Sube la carpeta `web/`
   por FTP a `public_html/` y sirve el sitio desde ahí. WordPress se queda
   solo para el blog, si lo necesitas.
2. **Plugin de HTML estático** (p. ej. *Simple Custom CSS and JS* +
   una plantilla de página en blanco). Pegas el HTML en una página con
   plantilla vacía y encolas `styles.css` y `main.js`.
3. **Convertirlo en tema hecho a medida**: `index.html` pasa a
   `front-page.php`, los estilos y scripts se encolan con
   `wp_enqueue_style` / `wp_enqueue_script` en `functions.php`, y las
   rutas de `assets/` con `get_template_directory_uri()`.

Si el sitio no va a tener blog ni área privada, la opción 1 es la
más rápida y la más rápida de cargar.

## Subir a GitHub

```bash
cd web
git init
git add .
git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/USUARIO/REPO.git
git push -u origin main
```

Con GitHub Pages activado en Settings → Pages ya tienes la web publicada.

## Nota sobre las claves

`config.js` es público: cualquiera puede leerlo desde el navegador. La
clave de Supabase que hay ahí es una *publishable key*, pensada para eso,
pero asegúrate de que en Supabase la tabla `leads` tiene RLS activo con
una política que **solo permita insertar**, nunca leer.
