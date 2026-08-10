# Checklist de publicación — AI MANGANELL

Todo lo de este documento lo tienes que hacer tú (cuenta de GitHub,
DNS, Search Console) — nada de esto lo puede hacer Claude Code por ti.

## 🚫 BLOQUEANTE — no publicar con el formulario activo

El **Aviso legal** y la **Política de privacidad** tienen los datos
identificativos del responsable marcados como huecos sin rellenar:

```
NIF [NIF PENDIENTE]
Domicilio [DOMICILIO PENDIENTE]
```

No están inventados a propósito — hay que esperar al alta de
autónomo para tener NIF y domicilio fiscal reales. Pero **mientras
falten, el sitio no puede recoger datos de nadie**: el formulario de
contacto trata datos personales (RGPD/LOPDGDD) y la LSSI-CE exige que
el aviso legal identifique de verdad al responsable del sitio. Un
aviso legal con placeholders visibles es peor que no tener aviso
legal — muestra que el sitio no cumple.

**Antes de publicar con el formulario activo:**
1. Dar de alta como autónomo (o la figura que corresponda).
2. Pasarme NIF y domicilio fiscal.
3. Sustituyo los dos huecos en `legal/aviso-legal/index.html` y
   `legal/privacidad/index.html` (aparecen dos veces cada uno: en su
   propio contenido y en el modal legal que se repite en cada página
   del sitio — lo hago yo, no hay que tocarlo a mano en varios
   sitios).

Si quieres publicar el sitio *antes* de tener el alta (por ejemplo,
para enseñarlo o probarlo), la única forma segura es con el
formulario desactivado — dímelo si llega ese caso y vemos cómo.

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
  sitio. Contacto solo por formulario y `hola@aimanganell.com` — ni
  en el footer ni en el JSON-LD de la home (`ProfessionalService`).
- El footer **ya no muestra** "Responsable: AI MANGANELL · Canarias,
  España" — esos datos identificativos viven solo dentro del aviso
  legal y la política de privacidad, que es donde corresponde
  legalmente. Decisión explícita del usuario, no un olvido.
