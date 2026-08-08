# porfatolio-personal

Portafolio personal de Andrés Felipe Olaya Cadena — publicado con GitHub Pages.

## Stack

Sitio estático, sin frameworks ni build step: se abre `index.html` y ya funciona.

- **HTML5** — estructura semántica, contenido bilingüe (ES/EN) mediante atributos `data-i18n-es` / `data-i18n-en`.
- **CSS3** puro, dividido por responsabilidad:
  - `css/tokens.css` — design tokens: paleta de color (modo claro/oscuro), escala tipográfica fluida de 9 pasos, espaciados, duraciones y curvas de animación.
  - `css/base.css` — reset y estilos base.
  - `css/layout.css` — estructura de secciones y reglas responsive.
  - `css/components.css` — botones, tarjetas, nav, badges, timeline.
  - `css/animations.css` — keyframes y animaciones de aparición al hacer scroll.
- **JavaScript vanilla** (sin dependencias externas):
  - `js/theme.js` — toggle claro/oscuro, persistido en `localStorage`.
  - `js/i18n.js` — toggle de idioma ES/EN, persistido en `localStorage`.
  - `js/neural-bg.js` — fondo animado de red neuronal dibujado en `<canvas>`.
  - `js/tilt.js` — efecto de inclinación 3D en tarjetas y en el visual del hero, según la posición del mouse.
  - `js/main.js` — scroll reveal (IntersectionObserver), menú móvil y estado del header.
- **Google Fonts**: Space Grotesk (títulos), Inter (cuerpo), JetBrains Mono (etiquetas/datos).

## Estructura

```
index.html
css/
  tokens.css
  base.css
  layout.css
  components.css
  animations.css
js/
  theme.js
  i18n.js
  neural-bg.js
  tilt.js
  main.js
assets/
  cv.pdf
```

## Desarrollo local

No requiere instalación. Basta con servir la carpeta como archivos estáticos, por ejemplo:

```bash
python -m http.server 5500
```

y abrir `http://localhost:5500`.

## Despliegue

Pensado para GitHub Pages: al publicar la rama (`main` o `gh-pages`) con la carpeta raíz, el sitio queda disponible directamente — no requiere pasos de compilación.
