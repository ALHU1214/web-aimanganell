# Checklist de publicación — AI MANGANELL

Todo lo de este documento lo tienes que hacer tú (cuenta de GitHub,
DNS, Search Console) — nada de esto lo puede hacer Claude Code por ti.

## 🚫 BLOQUEANTE — el aviso legal no identifica al responsable

*Revisado el 2026-08-25. Este bloqueante sigue abierto, pero por la mitad
que queda, no por la que ya se resolvió.*

**Resuelto:** los huecos visibles `[NIF PENDIENTE]` y `[DOMICILIO PENDIENTE]`
ya no están, ni en el repositorio ni en producción. Eso era lo que el
texto anterior llamaba "peor que no tener aviso legal".

**Sigue pendiente:** el aviso legal no publica NIF ni domicilio fiscal. Hoy
en producción solo dice *"este sitio web es titularidad de AI MANGANELL,
con domicilio en Tenerife (Canarias, España)"*, que no identifica a nadie
en el sentido que pide la ley.

El formulario de contacto trata datos personales (RGPD/LOPDGDD) y la
LSSI-CE exige que el aviso legal identifique de verdad al responsable del
sitio. Mientras falten NIF y domicilio fiscal, esa exigencia no se cumple.
Nada de esto es asesoramiento legal: es la condición que este mismo
documento se puso, y no está cumplida.

**Para cerrarlo:**
1. Dar de alta como autónomo (o la figura que corresponda).
2. Pasarme NIF y domicilio fiscal.
3. Los añado en `legal/aviso-legal/index.html` y `legal/privacidad/index.html`
   (en su propio contenido y en el modal legal que se repite en cada página
   del sitio — lo hago yo, no hay que tocarlo a mano en varios sitios), y
   además en el JSON-LD de la portada: `vatID` para el NIF y `streetAddress`
   dentro de `address`, que hoy solo llega a nivel de localidad.

Si quieres publicar *antes* del alta —para enseñarlo o probarlo— la única
forma segura es con el formulario desactivado.

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

## 4. Dominio propio (aimanganell.com) — ⏳ falta el DNS, lo único que queda de infraestructura

El archivo `CNAME` con `aimanganell.com` ya está en el repo — GitHub
ya lo detectó (`"cname":"aimanganell.com"` en la configuración de
Pages). **Falta lo único que no puedo hacer yo: el DNS.**

- [ ] En tu proveedor de DNS, registros **A** del dominio raíz
      (`aimanganell.com`) apuntando a las 4 IPs de GitHub Pages:
      ```
      185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153
      ```
- [ ] Una vez el DNS resuelva (puede tardar de minutos a horas):
      Settings → Pages → verás que "Enforce HTTPS" pasa a estar
      disponible — actívalo en cuanto aparezca. GitHub emite el
      certificado automáticamente al verificar el dominio, no hay
      que pedirlo aparte.
- Mientras tanto, el sitio ya es visible en
  `https://alhu1214.github.io/web-aimanganell/`, aunque esa URL
  redirige automáticamente a `aimanganell.com` (por el `CNAME`), así
  que hasta que el DNS resuelva no vas a poder verlo cargar del todo
  desde ningún sitio — es normal, no es que algo esté roto.

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

- [ ] Analítica: `config.js` tiene `gaId`/`metaPixelId` vacíos. Si
      quieres analítica en producción, hace falta una propiedad GA4
      (o Meta Pixel) tuya — pásame el ID y lo pongo.
- [ ] Foto real para el bloque de autor de los posts (de momento usa
      el símbolo de la marca).
- [ ] Iconos de redes sociales en el footer (hueco preparado, vacío
      hasta que haya perfiles públicos que enlazar).

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
