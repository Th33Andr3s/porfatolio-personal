# porfatolio-personal

Portafolio personal de Andres Felipe Olaya Cadena — publicado con GitHub Pages.

## Stack

Sitio estático, sin frameworks ni build step: se abre `index.html` y ya funciona.

- **HTML5** — estructura semántica, contenido bilingüe (ES/EN) mediante atributos `data-i18n-es` / `data-i18n-en`.
- **CSS3** puro, dividido por responsabilidad:
  - `css/tokens.css` — design tokens: paleta de color (modo claro/oscuro), escala tipográfica fluida de 9 pasos, espaciados, duraciones y curvas de animación.
  - `css/base.css` — reset y estilos base.
  - `css/layout.css` — estructura de secciones y reglas responsive.
  - `css/components.css` — botones, tarjetas, nav, badges, timeline, utilidades de texto.
  - `css/animations.css` — keyframes, animaciones de aparición al hacer scroll y `prefers-reduced-motion`.
- **JavaScript vanilla** (sin dependencias externas):
  - `js/theme.js` — toggle claro/oscuro, persistido en `localStorage` (tolera storage bloqueado).
  - `js/i18n.js` — toggle de idioma ES/EN, `aria-label` y meta descripción por idioma.
  - `js/neural-bg.js` — fondo animado de red neuronal dibujado en `<canvas>`.
  - `js/tilt.js` — efecto de inclinación 3D en los elementos con clase `.tilt` y en el visual del hero.
  - `js/main.js` — scroll reveal (IntersectionObserver), menú móvil accesible y estado del header.
- **Fuentes autoalojadas** (`css/fonts.css`, `assets/fonts/`): Space Grotesk (títulos), Inter (cuerpo) y JetBrains Mono (etiquetas/datos), en WOFF2 variable con el subconjunto latino. Licencia SIL OFL 1.1 (`assets/fonts/OFL-*.txt`). No hay peticiones a terceros.

## Estructura

```
index.html
css/
  fonts.css  tokens.css  base.css  layout.css  components.css  animations.css
js/
  theme.js  i18n.js  neural-bg.js  tilt.js  main.js
assets/
  cv.pdf  og-image.png  apple-touch-icon.png
  fonts/                  fuentes WOFF2 y sus licencias OFL
  img/projects/           miniaturas 800x500 de las herramientas web
scripts/
  check-site.mjs          comprobaciones estáticas (sin dependencias)
.github/workflows/ci.yml  validación y Lighthouse en cada push / PR
.htmlvalidate.json        reglas de html-validate
lighthouserc.json         umbrales de Lighthouse CI
```

## Desarrollo local

No requiere instalación. Basta con servir la carpeta como archivos estáticos:

```bash
python -m http.server 5173
```

y abrir `http://localhost:5173`.

## Comprobaciones

Sin dependencias (solo Node 18 o superior):

```bash
node scripts/check-site.mjs
```

Verifica ids únicos, anclas y referencias ARIA, que existan los archivos locales enlazados, que haya el mismo número de textos `es` y `en`, que no queden `style=""` en línea, que no haya referencias a Google Fonts y que el CSP coincida con los scripts en línea.

Con las herramientas de desarrollo instaladas (`npm install`), `npm run check` además valida el HTML con [html-validate](https://html-validate.org/).

## Cómo editar

- **Texto bilingüe:** escribe siempre los dos `<span data-i18n-es>` y `<span data-i18n-en>`. Para un `aria-label` traducible usa `data-aria-es` y `data-aria-en` junto al `aria-label` inicial.
- **Estilos:** sin `style=""` en línea (el CSP los bloquea). Usa las clases de `css/components.css`.
- **Inclinación 3D:** añade la clase `tilt` a la tarjeta que deba inclinarse.
- **Herramientas web** (sección Proyectos): todos los enlaces van directamente a los sitios publicados en `th33andr3s.github.io/projects/` (no al repositorio de GitHub); el enlace general abre `th33andr3s.github.io/projects/index.html`. Las miniaturas de `assets/img/projects/` son capturas 800×500 (16:10) de cada sitio publicado; si una aplicación cambia mucho, vuelve a capturarla con el mismo tamaño. `Libro de vida` es privado (login con Supabase): su enlace abre solo la pantalla de acceso y usa una ilustración en lugar de una captura.
- **Script en línea de `<head>`** (marca `.js` y fija el tema antes del primer pintado): está permitido por hash en el `<meta>` de Content-Security-Policy. Si lo modificas, ejecuta `node scripts/check-site.mjs --print-hash` y actualiza el hash en `script-src`; de lo contrario el navegador lo bloqueará.
- **Nuevos orígenes externos** (analítica, etc.): añádelos al `<meta http-equiv="Content-Security-Policy">`. Hoy la política solo permite recursos propios.
- **Fuentes:** para añadir caracteres fuera del subconjunto latino (p. ej. cirílico) hay que descargar el subconjunto correspondiente y declararlo en `css/fonts.css`. La flecha `→` no está en ninguna de las tres y usa la fuente del sistema.

## Despliegue

Pensado para GitHub Pages: al publicar la rama (`main` o `gh-pages`) con la carpeta raíz, el sitio queda disponible directamente — no requiere pasos de compilación.

Las URLs absolutas de `canonical`, `og:url`, `og:image` y `twitter:image` en `index.html` apuntan a la dirección actual del sitio; si cambias el nombre del repositorio o el dominio, actualízalas.

## Licencia

Este repositorio combina tres cosas con condiciones distintas:

1. **Código — licencia MIT** ([LICENSE](LICENSE)). Estructura HTML, hojas de estilo, scripts de `js/` y `scripts/`, y archivos de configuración. Puedes usarlo, copiarlo y modificarlo libremente, conservando el aviso de copyright.
2. **Contenido personal — todos los derechos reservados** © 2026 Andres Felipe Olaya Cadena. La licencia MIT **no** cubre:
   - los textos de `index.html` (presentación, experiencia, formación, descripciones de proyectos), incluidos los metadatos y el bloque JSON-LD;
   - el CV (`assets/cv.pdf`) y las imágenes `assets/og-image.png` y `assets/apple-touch-icon.png`;
   - el nombre, los datos de contacto, los enlaces a perfiles y la identidad visual "AO";
   - cualquier otro dato personal que se añada al sitio.

   Este contenido no puede copiarse, publicarse ni reutilizarse sin permiso por escrito del autor.
3. **Fuentes — SIL Open Font License 1.1.** Los archivos de `assets/fonts/` conservan su propia licencia (ver `OFL-*.txt`).

Si usas este sitio como plantilla, sustituye todo el contenido personal por el tuyo y elimina el CV, las imágenes y los datos de contacto del autor.

*English summary:* code is MIT-licensed; the personal content (page text, CV, images, name, contact details and branding) is all rights reserved and may not be reused without written permission; the bundled fonts keep their SIL OFL 1.1 license.
