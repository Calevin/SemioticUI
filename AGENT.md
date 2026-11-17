# AGENT.md - Constitución Técnica de Semiotic UI

Este archivo define las reglas arquitectónicas, estéticas y operativas permanentes para el desarrollo y mantenimiento de **semiotic-ui**. Todo agente o desarrollador que trabaje sobre este repositorio debe respetar estas directrices sin excepción.

---

## 1. Visión y Estética (Semiotic Standard)

**semiotic-ui** es un Design System de estilo **Neo-Brutalista industrial**, inspirado en el sistema de señalética *Semiotic Standard* diseñado por Ron Cobb para la nave Nostromo (ciencia ficción técnica de finales de los años 70 y 80).

### Reglas Visuales Estrictas
- **Bordes:** Sólidos de `2px` (`--sm-border-width: 2px`) como estándar de componentes, y `3px` (`--sm-border-width-heavy`) o franjas de acento laterales de `6px`–`8px` para paneles estructurales y alertas. Nunca usar bordes difusos ni gradientes decorativos.
- **Radios:** `0px` (`--sm-radius: 0px`) en todos los contenedores, botones y controles. Geometría estrictamente ortogonal.
- **Sombras:** Sombras duras sin difuminado (`blur: 0`), definidas mediante desplazamiento sólido:
  - `--sm-shadow-sm: 2px 2px 0 0 var(--sm-border-color)`
  - `--sm-shadow-md: 4px 4px 0 0 var(--sm-border-color)`
  - `--sm-shadow-lg: 6px 6px 0 0 var(--sm-border-color)`
- **Tipografía:**
  - Monoespaciada (`--sm-font-mono`) obligatoria para encabezados, botones, códigos de identificación, badges y etiquetas de estado, normalmente en `uppercase` con `letter-spacing` abierto (`0.04em` a `0.08em`).
  - Sans geométrica (`--sm-font-sans`) para cuerpo de texto y descripciones extensas.
- **Paleta y Etiquetas Técnicas:**
  - Alto contraste entre superficies de papel técnico / mamparo (`--sm-palette-ivory-*`) y tinta de chasis (`--sm-palette-carbon-*`), con soporte para tema oscuro CRT (`[data-sm-theme="dark"]` / `.sm-theme-dark`).
  - Colores de estado funcionales y codificados semánticamente: `info` (cian telemetría), `success` (verde nominal), `warning` (ámbar industrial), `danger` (rojo emergencia).
  - Uso sistemático de códigos identificadores cortos (`.sm-code-tag` o atributo `code="..."`, ej. `SEC-04`, `WARN-702`, `HULL-911`) como anclas visuales de lectura rápida.

---

## 2. Arquitectura Agnóstica y Compatibilidad SSR

### Por qué NO usamos React ni Tailwind en el core
- **Cero dependencias en runtime:** El paquete core (`src/`) debe ejecutarse en cualquier navegador moderno sin frameworks, virtual DOM ni motores de utilidades CSS en tiempo de compilación.
- **Distribución dual:** Un mismo código fuente debe consumirse tanto por bundlers modernos (`dist/semiotic-ui.es.js` en React, Astro, Vite) como mediante etiquetas `<script>` y `<link>` tradicionales (`dist/semiotic-ui.umd.js` y `dist/semiotic-ui.css`) en aplicaciones renderizadas en servidor.

### Reglas de Compatibilidad con Java Thymeleaf y HTMX
1. **CSS-First para componentes sin estado:** Botones, tarjetas, badges e inputs estáticos deben implementarse exclusivamente con CSS y clases semánticas `.sm-*` sobre elementos HTML nativos. No envolver elementos simples en Custom Elements innecesarios.
2. **Atributos HTML estándar en Web Components:** Todo Web Component (`<semiotic-*>`) debe configurarse mediante atributos HTML primitivos (strings y booleanos por presencia de atributo, nunca objetos JSON complejos como único mecanismo), garantizando compatibilidad directa con `th:attr`, `th:text` y atributos `hx-*` de HTMX.
3. **Upgrade seguro sobre HTML SSR:** Los Web Components no deben depender de ejecutarse antes de que el DOM exista. `connectedCallback` debe ser idempotente (puede dispararse más de una vez si HTMX o `moveBefore` reubican nodos) y leer siempre los atributos y slots ya renderizados por el servidor.
4. **Eventos DOM estándar:** Toda interacción relevante debe emitir `CustomEvent` con `{ bubbles: true, composed: true }` y prefijo `sm-` (ej. `sm-dismiss`, `sm-show`) para poder interceptarse desde JS nativo, React o `hx-on:sm-*` / `hx-trigger` en HTMX.
5. **Seguridad en SSR:** Nunca referenciar `window`, `document` o `HTMLElement` en el ámbito de módulo sin guardas (`typeof HTMLElement !== 'undefined'`), para que importar la librería en Astro SSR o Node no lance `ReferenceError`.

---

## 3. Convenciones de Código y Estándares Web

### Nomenclatura
- **CSS Custom Properties:** Prefijo `--sm-` para tokens públicos (`--sm-bg-surface`, `--sm-color-warning`, `--sm-shadow-md`). Los alias internos dentro de componentes o Shadow DOM usan `--_`.
- **Clases CSS:** Prefijo `.sm-` (`sm-btn`, `sm-card`, `sm-code-tag`). Subcomponentes con guion simple (`.sm-card-header`, `.sm-card-body`) y modificadores con doble guion (`.sm-btn--warning`, `.sm-btn--sm`).
- **Web Components:** Etiquetas en kebab-case con prefijo `semiotic-` (`<semiotic-alert>`, `<semiotic-modal>`, `<semiotic-tabs>`). Clases JS en PascalCase con prefijo `Semiotic` (`SemioticAlert`).

### Reglas Técnicas de CSS y Web Components
- **Capas de Cascada (`@layer`):** Toda hoja de estilos pública debe ubicarse dentro de `@layer sm.reset`, `@layer sm.tokens`, `@layer sm.base` o `@layer sm.components`.
- **Sin resets globales (`*`):** Prohibido aplicar reglas sobre `*` en `base.css`, ya que interfieren con la herencia y los Shadow DOM de terceros. Usar `:where(...)` sobre selectores explícitos.
- **Sin sobre-coincidencia en estados:** Escribir `:hover:not(:disabled, [aria-disabled='true'])` en lugar de depender del orden de reglas.
- **Shadow DOM y Theming:** Usar `attachShadow({ mode: 'open' })`. Prohibido `:host-context()` (sin soporte en Firefox/Safari); el theming debe fluir mediante CSS Custom Properties heredables `--sm-*` y `::part(...)`. Definir siempre `:host([hidden]) { display: none; }`.
- **Controles dentro de Shadow DOM:** Todo `<button>` o control de formulario encapsulado debe declarar explícitamente `font: inherit; color: inherit;`.
- **Accesibilidad:** Utilizar `ElementInternals` para roles y estados ARIA por defecto (con fallback defensivo a atributos solo si `ElementInternals` no está disponible). No recrear botones o controles nativos con `<div>`.
- **Idioma del Código:** Sintaxis, nombres de archivos, clases, variables y literales de la librería en **inglés**. Comentarios explicativos dentro del código estrictamente en **español**. **Prohibido el uso de emojis** en cualquier archivo o bloque de código.
- **Política de Soporte de Navegadores:** Apuntar a características *Baseline Widely Available*; cualquier API más reciente (como `ElementInternals` ARIA mixin o `CustomStateSet`) debe acompañarse de degradación elegante defensiva sin dependencias externas.

---

## 4. Flujo Obligatorio de Creación de Componentes

Cada vez que se solicite añadir un nuevo componente al Design System, se deben completar en orden los siguientes 4 pasos:

1. **Implementar en `/src`:**
   - Si es sin estado: crear/actualizar el archivo CSS correspondiente en `src/css/` dentro de `@layer sm.components`.
   - Si requiere estado o comportamiento interactivo: crear el Web Component Vanilla JS en `src/components/semiotic-<nombre>.js` siguiendo las reglas de reflexión atributo/propiedad, SSR-safety y accesibilidad.
2. **Exportar e importar en `src/index.js`:**
   - Importar la hoja CSS nueva en `src/index.js`, o exportar la clase y función `registerSemiotic<Nombre>()` incluyéndola dentro de `registerAll()`.
3. **Documentar en `/docs`:**
   - Añadir la demostración interactiva y las variantes del componente en Astro (`/docs/src/pages/`), incluyendo ejemplos listos para copiar en HTML/Thymeleaf/HTMX y React/Astro.
4. **Verificar el build completo:**
   - Ejecutar `npm run build` (Vite Library Mode) y `npm run docs:build` (Astro) verificando que se generen sin errores `dist/semiotic-ui.es.js`, `dist/semiotic-ui.umd.js` y `dist/semiotic-ui.css`.

---

## 5. Comandos Clave

El repositorio incluye un entorno reproducible NixOS mediante `flake.nix` (Node.js 22).

```bash
# Entrar al entorno reproducible con Node.js y npm (NixOS)
nix develop

# Instalar dependencias del workspace (libreria core + docs Astro)
npm install

# Desarrollo de la libreria en modo watch (regenera /dist al editar /src)
npm run dev

# Compilacion de produccion de la libreria (ES, UMD y CSS unificado en /dist)
npm run build

# Levantar el sitio de documentacion Astro en modo desarrollo
npm run docs:dev

# Compilar el sitio de documentacion Astro para produccion
npm run docs:build
```
