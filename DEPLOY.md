# Checklist de publicación — AI MANGANELL

Todo lo de este documento lo tienes que hacer tú (cuenta de GitHub,
DNS, Search Console) — nada de esto lo puede hacer Claude Code por ti.

## 1. Repositorio en GitHub

- [ ] Crear el repositorio en GitHub (vacío, sin README/gitignore
      generados por GitHub, ya los tenemos).
- [ ] `git remote add origin https://github.com/TU-USUARIO/TU-REPO.git`
- [ ] `git push -u origin master`

## 2. Permisos de GitHub Actions

- [ ] Settings → Actions → General → **Workflow permissions** →
      marcar **"Read and write permissions"**.
      Sin esto, el workflow que genera el blog (`build-blog.yml`) no
      podrá hacer `git push` de las páginas generadas y fallará.

## 3. GitHub Pages

- [ ] Settings → Pages → **Source = "Deploy from a branch"**, rama
      `master`, carpeta `/ (root)`.
      **Importante: NO elijas "GitHub Actions" como source.** Ya
      tenemos nuestro propio workflow que comitea archivos estáticos
      a `master` — Pages solo tiene que servir esa rama tal cual, no
      ejecutar su propio build.

## 4. Dominio propio (aimanganell.com)

- [ ] En tu proveedor de DNS, registros **A** del dominio raíz
      (`aimanganell.com`) apuntando a las 4 IPs de GitHub Pages:
      ```
      185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153
      ```
- [ ] Avisar para que añada el archivo `CNAME` en la raíz del repo
      con el dominio — lo hago yo en cuanto el DNS esté listo.
- [ ] Una vez el DNS resuelva: Settings → Pages → **Custom domain**
      → escribir `aimanganell.com` → esperar a que GitHub emita el
      certificado (puede tardar un rato) → activar **"Enforce HTTPS"**.

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
- [ ] Teléfono público, si quieres que aparezca en el schema de la
      home (`ProfessionalService`) — de momento no hay ninguno.

## Ya resuelto, no hace falta tocar

- RLS de Supabase en la tabla `leads` — verificado, solo permite
  `INSERT` con la clave pública.
- `sitemap.xml` / `robots.txt` / `blog/rss.xml` — se generan solos en
  cada build, no hay que crearlos a mano ni mantenerlos.
- `ffmpeg` en CI — el workflow de GitHub Actions lo instala solo en
  cada ejecución (hace falta para las variantes de imagen del blog).
  En local ya está instalado en esta máquina.
