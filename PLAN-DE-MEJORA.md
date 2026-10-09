# Plan de mejora — porfatolio-personal

Origen: auditoría técnica del 2026-10-08 sobre `main` @ `90c3e70`.
Estado: **Fases 1, 2 y 3 implementadas (2026-10-08), sin commit** (el usuario pidió no tocar Git). Pendiente: renombrar el repo. La CI no se ha ejecutado nunca.

Convenciones:
- Cada fase se entrega como un PR pequeño e independiente, en el orden indicado.
- Cada tarea tiene criterio de verificación; una tarea no se cierra sin cumplirlo.
- No se introducen frameworks, build steps ni dependencias de runtime.
- Marcar `[ ]` → `[x]` al completar. Anotar fecha y commit en "Registro".

---

## Fase 1 — Robustez (P1)

Objetivo: eliminar los modos de fallo visibles sin cambiar el diseño.
Estimación: 2–3 h. Riesgo: bajo.

### 1.1 `color-scheme` en tema claro — [x]
- **Problema (H3):** el selector `:root[data-theme='light'] html, html:has(:root[data-theme='light'])` nunca coincide; scrollbars y controles nativos quedan oscuros en tema claro.
- **Cambio:** sustituir por `:root[data-theme='light'] { color-scheme: light; }`.
- **Archivos:** `css/base.css` (líneas 7-8).
- **Verificación:** con tema claro, `getComputedStyle(document.documentElement).colorScheme === 'light'`.

### 1.2 Acceso seguro a `localStorage` — [x]
- **Problema (H2):** `localStorage` se lee en la primera línea de `theme.js` e `i18n.js`; si lanza (`SecurityError`), el script entero aborta y los toggles quedan muertos.
- **Cambio:** helper `get/set` con `try/catch` en cada archivo (sin crear un sexto script). Degradar a "no persistir".
- **Archivos:** `js/theme.js`, `js/i18n.js`.
- **Verificación:** en consola, antes de cargar: `Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})`; recargar y comprobar que ambos toggles funcionan.

### 1.3 Contenido visible sin JavaScript — [x]
- **Problema (H1):** `.reveal { opacity: 0 }` es incondicional; sin JS la página queda vacía.
- **Cambio:** script inline en `<head>` que añade la clase `js` a `<html>`; cambiar selectores a `.js .reveal` / `.js .reveal-stagger`.
- **Archivos:** `index.html`, `css/animations.css`.
- **Verificación:** desactivar JS en DevTools y ver todo el contenido; con JS, el reveal sigue funcionando.
- **Depende de:** nada (pero el script inline se comparte con 1.4).

### 1.4 Tema sin flash (FOUC) — [x]
- **Problema (H6):** `theme.js` corre al final del `body`; usuarios con preferencia clara ven fondo oscuro 1 frame + transición de 450 ms.
- **Cambio:** mover la detección (`localStorage` → `matchMedia` → `data-theme`) al mismo script inline de 1.3, antes de los `<link rel=stylesheet>`. `theme.js` solo lee el atributo y gestiona el toggle. Opcional: clase `preload` que anula transiciones hasta el primer `requestAnimationFrame`.
- **Archivos:** `index.html`, `js/theme.js`, `css/base.css`.
- **Verificación:** emular `prefers-color-scheme: light` en DevTools, grabar la carga (Performance) y confirmar que el primer frame ya es claro.
- **Depende de:** 1.2 (reutiliza el helper), 1.3 (mismo script inline).

### 1.5 Header móvil sin desborde — [x]
- **Problema (H4):** a 375 px el `.nav-toggle` termina en x = 375 px; el contenedor termina en 351 px. El botón se ve recortado.
- **Cambio:** en `@media (max-width: 480px)`: reducir `gap` de `.nav-actions`, ocultar el texto del logo (dejar `.logo-mark`) y/o compactar el lang-toggle.
- **Archivos:** `css/layout.css` (bloque 480px), `css/components.css` (`.nav-actions`, `.logo`, `.lang-toggle`).
- **Verificación:** a 320 px y 375 px ningún elemento del header supera el borde derecho del `.container`; `document.documentElement.scrollWidth === innerWidth`.
- **Nota de implementación:** la causa raíz real era `.nav-inner { width: 100% }` en `components.css`, que anulaba el gutter de `.container`: el contenido del header tocaba los bordes de la pantalla en **todos** los anchos, no solo en móvil. Se eliminó esa regla y además se compactó el header (<480 px) y se oculta el texto del logo (<380 px).

### 1.6 Menú móvil accesible — [x]
- **Problema (H5):** sin scroll-lock, sin Escape, sin `aria-expanded`, enlaces tabulables estando cerrado (también en escritorio).
- **Cambio:**
  - HTML: `aria-expanded="false"`, `aria-controls="mobile-nav"` en `.nav-toggle`; `id="mobile-nav"` en el drawer.
  - CSS: `.mobile-nav` cerrado con `visibility: hidden` (+ `transition: visibility`), y `display: none` en `min-width: 769px`.
  - JS: alternar `aria-expanded`, `inert`, `document.body.style.overflow`, cerrar con Escape, devolver el foco al botón al cerrar.
- **Archivos:** `index.html`, `js/main.js`, `css/layout.css`, `css/components.css`.
- **Verificación:** con menú abierto `scrollBy(0,400)` no mueve el fondo; Escape cierra; `aria-expanded` alterna; en escritorio, Tab desde el header no entra en el drawer.

**Cierre de fase:** PR "Fase 1 — robustez". Revisar en Chrome escritorio, Chrome Android (o emulación) y, si es posible, Safari iOS.

---

## Fase 2 — Calidad percibida (P2)

Objetivo: accesibilidad, i18n completa, SEO y peso del CV.
Estimación: 4–6 h. Riesgo: bajo-medio (cambios visuales en tokens).

### 2.1 Contraste WCAG AA — [x]
- **Problema (H10):** `--text-muted` (3,7–4,2:1), `--primary-2` claro (3,44:1) y blanco sobre gradiente (3,5–3,7:1) fallan AA en texto pequeño.
- **Cambio:** ajustar tokens: `--text-muted` ≈ `#7d87a8` (oscuro) / `#5f6885` (claro); `--primary-2` claro `#0e7490`; botones a `--step-0` o gradiente un paso más oscuro.
- **Archivos:** `css/tokens.css`, `css/components.css`.
- **Verificación:** recalcular ratios (todos ≥ 4,5:1 para texto < 18,66 px bold / 24 px normal) en ambos temas.
- **Nota de implementación:** `--text-muted` oscuro `#808aab`, claro `#5f6885`; `--primary-2` claro `#0e7490`. Para los elementos con texto blanco (botón primario, logo, idioma activo) se creó `--gradient-action` (oscuro: `#3b5fe0 → #9333ea → #db2777`, mínimo 4,6:1; en claro reutiliza el degradado de marca, mínimo 5,17:1). El gradiente de marca original se conserva para el resto de usos.

### 2.2 i18n completa — [x]
- **Problema (H8, H13):** en EN quedan en español `title`, `meta description`, `aria-label`s (nav, menú, tema), meses de la timeline y títulos de proyectos secundarios.
- **Cambio:** diccionario `{ es: {...}, en: {...} }` en `i18n.js` aplicado en `apply()` para `title`, `meta[name=description]`, `aria-label`s; marcar meses y títulos de proyectos con `data-i18n-es/en`; `theme.js` lee el label del idioma activo.
- **Archivos:** `index.html`, `js/i18n.js`, `js/theme.js`.
- **Verificación:** en EN, `document.body.innerText` y los `aria-label` no contienen texto en español; en ES, lo inverso.

### 2.3 Jerarquía de encabezados — [x]
- **Problema (H13):** secuencia `H1 → H2 → H4` (salta H3); "Formación académica" es un `<p>`.
- **Cambio:** tarjetas de dominio, timeline, educación y proyectos secundarios pasan a `<h3>`; "Formación académica" pasa a `<h3>` con la clase visual actual. Ajustar tamaños vía clases, no vía etiqueta.
- **Archivos:** `index.html`, `css/base.css` o `css/components.css`.
- **Verificación:** listado `[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>h.tagName)` sin saltos de nivel.

### 2.4 Hero en 769–1024 px — [x]
- **Problema (H7):** a 1024×768 el `h1` queda fuera del viewport.
- **Cambio:** breakpoint intermedio: `.hero-3d` a 45 % de ancho o `max-height: 38vh`, o texto antes que visual.
- **Archivos:** `css/layout.css`.
- **Verificación:** `h1` visible sin scroll a 1024×768 y 834×1194.
- **Nota de implementación:** `.hero-3d` pasa a `width: min(60%, 42vh)`. El `h1` queda visible en 1024×768, 834×1194 y 375×812; el botón "Ver proyectos" sigue bajo el borde inferior en tablets.

### 2.5 CV ligero y con metadatos — [x]
- **Problema (H11):** 4,2 MB por fuente `SegoeUIEmoji` embebida; `Author = "Un-named"`, `Title` vacío.
- **Cambio:** quitar emojis del documento Word o exportar en "tamaño mínimo"; o comprimir con Ghostscript (`-dPDFSETTINGS=/ebook`). Rellenar título y autor. Mantener el nombre `cv.pdf`.
- **Archivos:** `assets/cv.pdf`.
- **Verificación:** tamaño < 500 KB; se abre en Chrome, Edge y un visor móvil; revisar manualmente que no exponga cédula, dirección ni fecha de nacimiento.
- **Nota de implementación:** sin acceso al .docx original ni a `fontTools`, los 4 iconos de contacto (única causa de la fuente de emojis de 3,77 MB) se convirtieron en imágenes y se eliminó la fuente. Resultado: 4,2 MB → 380 KB. Texto idéntico, páginas 2 y 3 idénticas pixel a pixel, enlace de LinkedIn conservado, diferencias solo en los 4 iconos. El original sigue en el historial de Git. Título y autor ahora completos. El texto del CV no contiene cédula, dirección ni fecha de nacimiento (solo teléfono y correo). **Pendiente del autor:** el subtítulo del CV dice "Software Enginner" (falta una *e*); conviene corregirlo en el Word y re-exportar.

### 2.6 SEO y previsualización al compartir — [x]
- **Problema (H9):** sin Open Graph/Twitter Card, `canonical`, `theme-color`, `apple-touch-icon`, JSON-LD.
- **Cambio:** añadir `og:title/description/image/url/type`, `twitter:card`, `<link rel=canonical>`, `theme-color` (uno por esquema), PNG 180×180 como `apple-touch-icon`, JSON-LD `Person` con `sameAs`. Crear `assets/og-image.png` (1200×630).
- **Archivos:** `index.html`, `assets/`.
- **Verificación:** LinkedIn Post Inspector y Facebook Sharing Debugger muestran título, descripción e imagen.
- **Nota de implementación:** `og-image.png` (1200×630) y `apple-touch-icon.png` (180×180) generados con PyMuPDF y fuentes locales; `canonical`/`og:url` usan la URL actual (`.../porfatolio-personal/`) y deben actualizarse si se hace la tarea 3.5. **La validación en LinkedIn/Facebook solo es posible tras publicar**, porque las imágenes se sirven desde la URL de producción.

### 2.7 Correcciones en `neural-bg.js` — [x]
- **Problema (H12):** `mouseleave` en `window` nunca dispara; `resize` regenera nodos sin debounce; `setInterval` sin limpieza; evento `themechange` sin consumidor.
- **Cambio:** `document.addEventListener('mouseleave', …)`; debounce de resize que reescala posiciones existentes; guardar y limpiar el interval; eliminar `themechange` de `theme.js`.
- **Archivos:** `js/neural-bg.js`, `js/theme.js`.
- **Verificación:** al sacar el cursor de la ventana desaparecen las líneas; al redimensionar los nodos no saltan.
- **Nota de implementación:** se conserva el evento `themechange` (en lugar de eliminarlo) porque ahora lo consume `neural-bg.js` para repintar el fotograma estático con `prefers-reduced-motion`. En movimiento reducido ya no hay `setInterval`: un solo fotograma, redibujado al cambiar tema o tamaño.

**Cierre de fase:** PR "Fase 2 — accesibilidad, i18n y SEO". Puede dividirse en dos PR (2.1–2.4 y 2.5–2.7) si se prefiere.

---

## Fase 3 — Mantenibilidad (P3)

Objetivo: limpieza, tooling y red de seguridad.
Estimación: 3–5 h. Riesgo: bajo.

### 3.1 Limpieza de CSS y HTML — [x]
- **Problema (H14, H20, H21):** selectores muertos (`.scroll-cue`, `.now-card`, `.now-dot`, `pulse-glow`, `.visually-hidden`), 24 estilos inline, reduced-motion duplicado, email partido en tarjetas de 220 px, anclas acopladas al padding.
- **Cambio:** borrar CSS sin uso; inline → clases (`.edu-title`, `.contact-label`, etc.); unificar reduced-motion en `tokens.css` y añadir `scroll-behavior: auto`; `html { scroll-padding-top: var(--header-h) }`; contacto `minmax(240px, 1fr)` y `word-break: normal`.
- **Archivos:** `css/*.css`, `index.html`.
- **Verificación:** `grep` de clases definidas vs usadas sin huérfanas; `document.querySelectorAll('[style]').length === 0`; email entero en una línea a 1024 px.
- **Nota de implementación:** eliminados `.scroll-cue`, `.now-card`, `.now-dot`, `pulse-glow` y `.visually-hidden`; 22 `style=""` convertidos en clases (`.edu-title`, `.edu-meta`, `.contact-label`, `.contact-value`, `.eyebrow-tight`, `.section-head--spaced`, `.skills-section`). Las anclas se desacoplaron con el token `--section-pad` y `scroll-margin-top` (el contenido queda 16 px bajo el header en todas las secciones, antes 20 px en escritorio y 0 en móvil). Los dos bloques de movimiento reducido (`tokens.css` y `animations.css`) resultaron complementarios, no duplicados (uno anula tokens, el otro duraciones literales), así que se conservaron con comentarios; se añadió `scroll-behavior: auto` y el marquee pasa a ser desplazable a mano sin animación. Email en una línea con 4 columnas gracias a un `<wbr>` antes de `@` y relleno lateral menor en las tarjetas de contacto.

### 3.2 `tilt.js` opt-in y guardas en `main.js` — [x]
- **Problema (H15, H16):** tilt sobre todas las `.card` (texto largo y enlaces); `will-change` permanente; `header`/`mobileNav` sin null-check.
- **Cambio:** clase `.tilt` solo en project cards y domain cards; `will-change` solo en `:hover`; guardas con `?.` o `if (!el) return`.
- **Archivos:** `js/tilt.js`, `js/main.js`, `css/components.css`, `index.html`.
- **Verificación:** la tarjeta de About y las de contacto no se inclinan; sin errores en consola si se elimina `.mobile-nav`.
- **Nota de implementación:** `.tilt` en 4 tarjetas de dominio y 9 de proyecto (13 en total); `will-change` solo en `.tilt:hover`; al salir se quita el `transform` en línea. Verificado con `requestAnimationFrame` síncrono: solo inclinan las `.tilt` y quedan limpias al salir.

### 3.3 Tooling y CI mínima — [x] (parcial: ver nota)
- **Problema (H19):** sin validación, lint ni CI; README y `launch.json` discrepan en el puerto; sin LICENSE.
- **Cambio:** `package.json` (solo devDependencies: `html-validate`, opcional `stylelint`); workflow `.github/workflows/ci.yml` con validación HTML y Lighthouse CI; README con el puerto 5173; `LICENSE` (MIT o la que se decida); `.gitignore` con `node_modules/`.
- **Archivos:** nuevos `package.json`, `.github/workflows/ci.yml`, `LICENSE`; `README.md`, `.gitignore`.
- **Verificación:** el workflow pasa en verde en el primer push; Lighthouse ≥ 90 en Performance, Accessibility, Best Practices y SEO.
- **Nota de implementación:** creados `package.json` (solo `html-validate` como devDependency), `.htmlvalidate.json`, `lighthouserc.json`, `.github/workflows/ci.yml`, `scripts/check-site.mjs` (sin dependencias; ids, anclas, ARIA, recursos locales, pares ES/EN, sin estilos inline, hash del CSP), README actualizado (puerto 5173, comprobaciones, cómo editar) y `.gitignore`. **No ejecutados:** `html-validate`, el workflow de GitHub Actions y Lighthouse CI (no se instalaron dependencias ni hay push); la primera ejecución puede requerir ajustar reglas. Lighthouse sube los informes solo como artefacto, no a almacenamiento público. **LICENSE (MIT, 2026, a nombre del autor) creada a petición del usuario**; también referenciada en `package.json` y README. El README añade una cláusula que reserva los derechos del contenido personal (textos, CV, imágenes, nombre y datos de contacto) y deja las fuentes bajo OFL; `LICENSE` se mantiene como MIT estándar.

### 3.4 Fuentes autoalojadas y CSP (opcional) — [x]
- **Problema (H17, H18):** dependencia de Google Fonts; sin CSP.
- **Cambio:** WOFF2 en `assets/fonts/`, `@font-face` + `font-display: swap`, `preload` de las dos críticas; `<meta http-equiv="Content-Security-Policy">` que permita `self`, `data:` para imágenes e inline donde lo exija 1.3/1.4.
- **Archivos:** `index.html`, `css/tokens.css`, `assets/fonts/`.
- **Verificación:** sin peticiones a `googleapis`/`gstatic`; sin violaciones CSP en consola.
- **Nota de implementación:** CSP añadido como `<meta>` sin `unsafe-inline` en scripts: el script de `<head>` se permite por hash, comprobado por `node scripts/check-site.mjs`. Verificado en el navegador: 0 violaciones, fuentes de Google cargan, tema/idioma/menú/canvas funcionan. **Fuentes autoalojadas (hecho tras aprobación del usuario):** descargados de Google Fonts los subconjuntos latinos WOFF2 variables de Space Grotesk (22 KB), Inter (48 KB) y JetBrains Mono (31 KB) más sus licencias OFL, en `assets/fonts/`; `css/fonts.css` con `unicode-range` y rangos de peso 500–700 / 400–600 / 400–500; `preload` de las tres; eliminados `preconnect` y la hoja de Google; CSP cerrado a `style-src 'self'; font-src 'self'`. Verificado: 0 peticiones a terceros, tres familias cargadas, pesos reales (la tinta crece con el peso), 0 errores de consola. Solo `→` (8 apariciones) queda fuera del subconjunto y ya usaba la fuente del sistema. `check-site.mjs` ahora falla si reaparece una referencia a Google Fonts.

### 3.5 Renombrar repositorio (opcional) — [ ] no ejecutada
- **Problema (H19):** typo "porfatolio" en la URL pública.
- **Cambio:** renombrar a `portafolio-personal` (GitHub redirige el nombre antiguo) o migrar al sitio de usuario `th33andr3s.github.io`. Actualizar `canonical`, `og:url`, README y enlaces en CV/LinkedIn.
- **Verificación:** URL nueva responde 200 y la antigua redirige.
- **Nota:** no ejecutada; el renombrado se hace en GitHub (Settings → General) y requeriría Git. Tras renombrar hay que actualizar `canonical`, `og:url`, `og:image`, `twitter:image` en `index.html`, `jsonLd.url`, y volver a ejecutar `node scripts/check-site.mjs`.

---

## Dependencias entre tareas

```
1.1  (independiente)
1.2 ──► 1.4
1.3 ──► 1.4
1.5  (independiente)
1.6  (independiente)
2.1 … 2.7  (independientes entre sí; 2.2 antes que 2.3 para no editar los mismos encabezados dos veces)
3.1 después de la Fase 2 (toca los mismos archivos CSS)
3.4 después de 1.3/1.4 (la CSP debe contemplar los scripts inline)
3.5 después de 2.6 (canonical / og:url)
```

## Fuera de alcance (no recomendado ahora)

- Migrar la i18n a páginas separadas con `hreflang`.
- Introducir un framework, bundler o preprocesador CSS.
- Reescribir el historial de git para quitar el CV antiguo.

## Registro

| Fecha | Tarea | Commit | Notas |
|---|---|---|---|
| 2026-10-08 | 1.1 color-scheme | pendiente | `css/base.css`. Verificado: `colorScheme` = `light` con tema claro. |
| 2026-10-08 | 1.2 localStorage seguro | pendiente | `js/theme.js`, `js/i18n.js`. Verificado con `localStorage` lanzando `SecurityError`: toggles funcionan, 0 errores de consola. |
| 2026-10-08 | 1.3 contenido sin JS | pendiente | `index.html`, `css/animations.css`, `js/main.js` (fallback sin `IntersectionObserver`). Verificado sin scripts: 0 de 24 `.reveal` ocultos. |
| 2026-10-08 | 1.4 tema sin FOUC | pendiente | Script inline en `<head>` antes de las hojas de estilo. Verificado con `prefers-color-scheme: light` y storage vacío. El primer fotograma no se pudo medir. |
| 2026-10-08 | 1.5 header móvil | pendiente | `css/components.css`, `css/layout.css`, `index.html`. Verificado a 375 y 320 px: sin desborde ni solape, `scrollWidth` = ancho de ventana. |
| 2026-10-08 | 1.6 menú móvil | pendiente | `index.html`, `js/main.js`, `css/layout.css`. Verificado: `aria-expanded`, `inert`, `visibility`, Escape con foco devuelto, cierre al pulsar enlace, drawer oculto en escritorio. Bloqueo de scroll real (rueda/táctil) y cierre al ensanchar: no verificables en el panel emulado, que no emite eventos `resize`; el bloqueo está limitado a ≤768 px por CSS como protección. |
| 2026-10-08 | 2.1 contraste | pendiente | `css/tokens.css`, `css/components.css`. Verificado en el DOM: 0 textos bajo AA en oscuro (151) y claro (147); degradados calculados aparte (≥ 4,6:1). |
| 2026-10-08 | 2.2 i18n completa | pendiente | `index.html`, `js/i18n.js`, `js/theme.js`. Verificado en EN y ES: title/meta/aria/meses/títulos/label del tema/`aria-pressed` coherentes con el idioma. |
| 2026-10-08 | 2.3 encabezados | pendiente | `index.html`, `css/components.css`, `css/layout.css`. Secuencia H1→H2→H3→H4 sin saltos; aspecto visual conservado (capturas). |
| 2026-10-08 | 2.4 hero tablets | pendiente | `css/layout.css`. `h1` visible a 1024×768 (top 529 px), 834×1194 y 375×812; escritorio sin cambios. |
| 2026-10-08 | 2.5 CV | pendiente | `assets/cv.pdf` 4,2 MB → 380 KB. Texto idéntico, enlace conservado, diferencias solo en los 4 iconos. |
| 2026-10-08 | 2.6 SEO | pendiente | `index.html`, nuevos `assets/og-image.png` y `assets/apple-touch-icon.png`. Metadatos y JSON-LD válidos; imágenes sirven 200. Validación en redes: pendiente de publicar. |
| 2026-10-08 | 2.7 neural-bg | pendiente | `js/neural-bg.js`, `js/theme.js`. Verificado: líneas al cursor 876 → 0 px tras `mouseleave`; nodos conservados tras `resize` (100 %). Movimiento reducido no emulable aquí. |
| 2026-10-08 | 3.1 limpieza | pendiente | CSS/HTML/anclas/email. `style=""` en línea: 22 → 0. Anclas a 16 px bajo el header en escritorio y móvil (descontando la animación de reveal). |
| 2026-10-08 | 3.2 tilt opt-in | pendiente | `js/tilt.js`, `js/main.js`, `index.html`. Solo 13 tarjetas `.tilt` se inclinan y se limpian al salir. |
| 2026-10-08 | 3.3 tooling/CI | pendiente | Archivos creados; `check-site.mjs` ejecutado (8/8 OK). `html-validate`, Actions y Lighthouse sin ejecutar. YAML sin validar (sin PyYAML). |
| 2026-10-08 | 3.4 CSP y fuentes | pendiente | `<meta>` CSP con hash del script en línea y solo orígenes propios; fuentes autoalojadas (~100 KB en 3 archivos), 0 peticiones a terceros, 0 violaciones. |
