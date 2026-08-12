# AI MANGANELL — Estado del proyecto

*Actualizado: 12 agosto 2026*

---

## El negocio

Consultoría de IA y ciberseguridad para pymes B2B. Base en Tenerife, presencial en Canarias y remoto en península.

**Servicio principal:** diagnóstico de pago que mapea procesos, detecta qué automatizar y en qué orden, y revisa la seguridad de cada paso. Su importe se descuenta íntegro si contratan la implantación.

**Cliente:** CEO o director de pyme B2B (5-50 empleados), no técnico. Piensa "sé que debería usar IA pero no sé por dónde empezar y no quiero equivocarme".

**Canal actual:** puerta fría. Sin tráfico web todavía.

---

## Infraestructura

| Qué | Dónde |
|---|---|
| Web | `aimanganell.com` — HTML/CSS/JS estático, sin build |
| Repo | `github.com/ALHU1214/web-aimanganell` (público, rama master) |
| Hosting | GitHub Pages + Cloudflare (proxy activo) |
| Formularios | Supabase (tabla `leads`) |
| Calendario | Cal.com |
| Correo | Zoho |
| Automatización | n8n Cloud (prueba, ~9 días restantes) |

**Métricas actuales:** PageSpeed 100/100/100/100, Navegación agéntica 2/2, securityheaders A.

---

## El blog

Sistema de archivos `.post` en `blog/posts/`. Cada post son dos archivos: el `.post` (cabecera JSON + cuerpo HTML) y su portada `.jpg`. GitHub Actions genera las páginas, el listado, sitemap y RSS.

**Publicados:** 3 posts.

**Flujo de trabajo:**
1. n8n genera el post con `noindex: true` y un marcador `[PENDIENTE: caso real]`
2. Se edita en GitHub (blog/posts/ → lápiz)
3. Se sustituye el marcador por un párrafo de experiencia propia
4. Se borra la línea `"noindex": true,`
5. Commit → publicado en 2 minutos

---

## El workflow de n8n

**Nombre:** "Blog SEO AI MANGANELL - GitHub"

Cadena: Schedule Trigger → Google Trends (SerpAPI) → Extraer TOP 2 → Filtrar Keywords → Elegir tema SEO → Buscar fuentes (Perplexity sonar) → Borrador → Buscar blog anterior (Sheets) → Links internos → Creador HTML → Slug → Título → Meta → FAQ → Generar portada (gpt-image-1) → Portada a binario → Montar .post → Commit portada → Commit post → Guardar en Sheets

**Modelos:** gpt-5.6-terra en los tres nodos pesados, gpt-5.6-luna en los ligeros.

**Coste:** ~$0.25 por post (la imagen es el 70%).

**Google Sheet:** `CONTROL DE BLOG`, pestaña `Posts`, columnas: Link, Titulo, Slug, Keyword, Resumen, Fecha.

**Estado:** en modo manual (no publicado). Se lanza con "Execute workflow".

---

## PENDIENTE

### 1. Turnstile — a medias, código en local sin commitear

Cloudflare Turnstile en los formularios. El problema de fondo: hoy cualquiera puede leer la clave pública de Supabase en `config.js` y escribir directo en la tabla `leads`.

**Solución elegida:** Edge Function de Supabase que valida el token con la Secret Key e inserta con la service role key. Después, cerrar el INSERT anónimo.

**Ya hecho (en local, sin push):** `config.js` con turnstileSiteKey, widget en ambos formularios, `main.js` adaptado, `supabase/functions/submit-lead/index.ts`, `supabase/config.toml`.

**Falta hacer, en este orden:**
1. Coger la Secret Key en Cloudflare Turnstile
2. `npx supabase login`
3. `npx supabase link --project-ref dbntpdrvnxdhgvdcexrt`
4. `npx supabase secrets set TURNSTILE_SECRET_KEY=... --project-ref dbntpdrvnxdhgvdcexrt`
5. `npx supabase functions deploy submit-lead --project-ref dbntpdrvnxdhgvdcexrt`
6. Avisar a Claude Code para que haga commit y push
7. Probar el formulario y confirmar la fila en Supabase
8. Solo entonces, cerrar el INSERT anónimo con SQL

**Tiempo estimado:** 20-30 min.

### 2. La web en móvil

Se ve mal según el usuario. No se ha diagnosticado — hacen falta capturas.

### 3. Marcar el origen del lead

Home y consultoría escriben en la misma tabla sin distinguir de dónde viene. Sin eso no se sabrá si el blog convierte.

### 4. Migrar n8n a un PC local

Quedan ~9 días de prueba en Cloud. El JSON está exportado. Harán falta todas las credenciales de nuevo: OpenAI, SerpAPI, Perplexity, GitHub (token), Google Sheets.

### 5. Menores

- H1 sin keywords (home y consultoría) — decisión pendiente del usuario
- Meta social incompletas en /consultoria/ (twitter:title, twitter:description, og:image:alt)
- Emojis como iconos sin `aria-hidden`
- `og:image` igual en todas las páginas
- Datos legales: aviso legal y privacidad con `[NIF PENDIENTE]` — se rellenan al darse de alta como autónomo
- CSP: la nota está limitada a A por `'unsafe-inline'` en script-src. Subir a A+ requiere eliminar todos los scripts inline. Decidido: no compensa.

---

## Riesgos vivos

**Contenido duplicado.** Los dos últimos posts tratan casi el mismo tema (seguridad de agentes IA en reservas), porque Google Trends devolvió lo mismo dos días seguidos. Vigilar canibalización.

**La fuente de temas.** Trends con semilla `ai agent` (US, inglés) trae noticias del sector, no problemas de pymes. Se mitigó con una regla de reencuadre en el prompt del selector, pero la solución de fondo sería una lista propia de temas. El usuario prefiere mantener el automatismo.

**El formulario está activo** con los datos legales incompletos. Decisión asumida por el usuario.

---

## Cosas que aprendimos por las malas

- En n8n, al editar un campo de expresión a mano, **no** poner `=` al principio. Solo aparece en los JSON exportados.
- n8n commitea directo a GitHub sin pasar por la máquina local. Hay una regla en `CLAUDE.md` que obliga a `git pull` al empezar.
- Cloudflare cachea agresivamente. Si un cambio no se ve: Ctrl+F5, y si no, Purge Everything.
- El JSON del workflow **no** debe commitearse al repo (es público).
