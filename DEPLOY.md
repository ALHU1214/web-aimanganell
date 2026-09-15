# Checklist de publicación — AI MANGANELL

Todo lo de este documento lo tienes que hacer tú (cuenta de GitHub,
DNS, Search Console) — nada de esto lo puede hacer Claude Code por ti.

## ⚠️ Aviso legal: falta el domicilio completo

*Revisado el 2026-09-15.*

**Resuelto:** titular identificado con nombre y NIF — *Álvaro Manganell
González, NIF 79087261J, que opera con el nombre comercial AI MANGANELL* —
en el aviso legal y en la política de privacidad (el modal de cada página
carga esos mismos textos, no hay copias que tocar), y `vatID` en el JSON-LD
de la portada.

**Sigue pendiente:** el domicilio solo llega a "Tenerife (Canarias,
España)". La LSSI-CE pide el domicilio del titular. Nada de esto es
asesoramiento legal.

**Para cerrarlo:** pasarme el domicilio completo y lo añado en los dos
textos legales y como `streetAddress` en el `address` del JSON-LD.

### Lo que NO es este bloqueante

No tiene nada que ver con Supabase. El formulario ya no escribe directo
contra la base de datos: pasa por la Edge Function `submit-lead` con
Turnstile y service role key, cerrado el 2026-08-12 y verificado con fila
real. Eso está resuelto y no forma parte de este bloqueante.

## 1. Repositorio en GitHub — ✅ hecho

Repo creado y con todo el historial subido:
`https://github.com/ALHU1214/web-aimanganell`

## 2. Permisos de GitHub Actions — ✅ hecho

`default_workflow_permissions` en `write`. Verificado con una
ejecución manual del workflow: comitea y empuja las páginas
generadas sin error.

## 3. GitHub Pages — ✅ hecho

Activado, Source = rama `master`, carpeta `/`. Primer build
(`pages build and deployment`) completado con éxito.

## 4. Dominio propio (aimanganell.com) — ✅ hecho

`aimanganell.com` resuelve y sirve por HTTPS, con Cloudflare delante de
GitHub Pages (comprobado el 2026-09-14). El `CNAME` del repo es el que
le dice a Pages qué dominio es el suyo: no borrarlo.

## 5. Google Search Console

- [ ] Dar de alta la propiedad `https://aimanganell.com/`.
- [ ] Verificar propiedad — dos formas, cualquiera vale:
  - **DNS**: añadir el registro TXT que te da Search Console (se
    hace en el mismo sitio donde ya tocaste el DNS en el paso 4).
  - **Archivo HTML**: Search Console te da un nombre de archivo
    (tipo `google1234567890abcdef.html`) y un contenido — pásamelo y
    lo creo en la raíz del repo.
- [ ] Una vez verificado, en **Sitemaps** enviar:
      `https://aimanganell.com/sitemap.xml`
      (ya existe, se genera solo en cada build — ver README.md).

## 6. Opcional, no bloqueante

- [x] Analítica: GA4 activo (`gaId` en `src/config.ts`). Meta Pixel sigue
      vacío (`metaPixelId`): si se quiere, pasar el ID.
- [ ] Foto real para el bloque de autor de los posts (de momento usa
      el símbolo de la marca).
- [ ] Iconos de redes sociales en el footer (hueco preparado, vacío
      hasta que haya perfiles públicos que enlazar).

## A tener en cuenta: el blog depende de un PC encendido

El workflow de n8n que escribe y publica los posts corre en local, en el
PC de Álvaro. Si ese PC está apagado o n8n cerrado, no se publica nada
(no hay error visible en la web: simplemente no salen posts nuevos). Si
algún día se quiere que publique sin depender del PC, hay que mover n8n a
un servidor (n8n Cloud o un VPS). La generación de las páginas no tiene
este problema: la hace GitHub Actions en la nube tras cada push.

## Ya resuelto, no hace falta tocar

- RLS de Supabase en la tabla `leads` — verificado, solo permite
  `INSERT` con la clave pública.
- `sitemap.xml` / `robots.txt` / `blog/rss.xml` — se generan solos en
  cada build, no hay que crearlos a mano ni mantenerlos.
- `ffmpeg` en CI — el workflow de GitHub Actions lo instala solo en
  cada ejecución (hace falta para las variantes de imagen del blog).
  En local ya está instalado en esta máquina.
- Teléfono: decisión final del usuario, sin publicarlo en ningún
  sitio — ni en el footer ni en el JSON-LD de la home
  (`ProfessionalService`). El JSON-LD tampoco lleva correo ya:
  ni `email` ni `contactPoint`. El contacto comercial va por
  formulario, calendario y `contacto@aimanganell.com` en el footer; `legal@aimanganell.com`
  vive solo dentro de las tres páginas legales.
- El footer **ya no muestra** "Responsable: AI MANGANELL · Canarias,
  España" — esos datos identificativos viven solo dentro del aviso
  legal y la política de privacidad, que es donde corresponde
  legalmente. Decisión explícita del usuario, no un olvido.
