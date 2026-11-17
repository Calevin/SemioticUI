# Prompt de Inicialización: Semiotic UI Kit

Copia y pega el siguiente prompt en tu agente de código (Cursor, Windsurf, Claude Code, Cline, etc.) dentro de una carpeta vacía llamada `semiotic-ui`:

---

```text
Actúa como un Arquitecto Frontend Senior especializado en Design Systems agnósticos, Web Components nativos, CSS moderno y Astro.

Vamos a inicializar el proyecto `semiotic-ui`, un UI Kit personal de estilo Neo-Brutalista inspirado en el "Semiotic Standard" de Ron Cobb (iconografía industrial de ciencia ficción de los años 70/80, alto contraste, bordes sólidos, sombras duras sin difuminado, tipografía monoespaciada, etiquetas técnicas/numéricas y paleta industrial con colores de advertencia).

### Objetivo de la Arquitectura
El sistema debe ser **100% agnóstico al framework** para poder consumirse sin fricción en:
1. Aplicaciones modernas con bundlers (React, Astro, Vite) vía paquete NPM / GitHub Packages.
2. Aplicaciones renderizadas en servidor (Java Thymeleaf, HTMX, HTML plano) mediante archivos estáticos compilados (`semiotic-ui.min.css` y `semiotic-ui.min.js`) servidos por CDN.

### Requerimientos Técnicos
1. **Estructura del Proyecto:**
   - `/src/css/`: Tokens de diseño (`tokens.css`), reset mínimo (`base.css`) y estilos de componentes sin estado (`buttons.css`, `cards.css`, `badges.css`, `forms.css`).
   - `/src/components/`: Web Components nativos en Vanilla JS (sin dependencias externas) para elementos interactivos (ej. `<semiotic-alert>`, `<semiotic-modal>`, `<semiotic-tabs>`).
   - `/src/index.js`: Punto de entrada que importa los estilos base y registra los Custom Elements.
   - `/docs/`: Sitio de documentación construido con **Astro** (usando Markdown/MDX para mostrar ejemplos en vivo, variantes y snippets listos para copiar en HTML/Thymeleaf y React).
   - `/dist/`: Carpeta de salida generada por el bundler.

2. **Tooling y Empaquetado (Build):**
   - Configura **Vite** en *Library Mode* en la raíz del proyecto para empaquetar `/src/index.js` y todos los CSS en:
     - `dist/semiotic-ui.es.js` (ES Modules para React/Astro)
     - `dist/semiotic-ui.umd.js` (Script clásico auto-ejecutable para `<script>` en Thymeleaf/HTMX)
     - `dist/semiotic-ui.css` (CSS unificado y minificado)
   - Configura los scripts en el `package.json` raíz para desarrollar, compilar la librería y levantar la documentación de Astro.

3. **Reglas de Diseño y Código:**
   - **Cero dependencias en runtime** para la librería core.
   - **CSS-First:** Si un componente no requiere estado ni eventos complejos (ej. tarjetas, botones, inputs, alertas estáticas), debe resolverse únicamente con clases CSS semánticas bajo el prefijo `.sm-` (ej. `.sm-btn`, `.sm-card`, `.sm-badge`).
   - **Web Components:** Para componentes interactivos, usa `HTMLElement` nativo. Asegúrate de que funcionen bien con atributos HTML estándar (para compatibilidad con `th:attr` de Thymeleaf y atributos de HTMX) y emitan `CustomEvent` estándar.

### Tareas a Ejecutar Ahora

**Tarea 1: Scaffolding del Proyecto**
Crea la estructura de carpetas, el `package.json` raíz, `vite.config.js`, los tokens iniciales en `src/css/tokens.css` (inspirados en la paleta de la Nostromo / Semiotic Standard), un primer componente CSS (`.sm-btn` y `.sm-card`), un primer Web Component (`<semiotic-alert>`), y la configuración básica de Astro en `/docs` con una página inicial que renderice ambos ejemplos.

**Tarea 2: Generación del archivo `AGENT.md`**
Crea un archivo `AGENT.md` en la raíz del repositorio que servirá como constitución y guía de contexto permanente para futuras sesiones de desarrollo asistido por IA. El `AGENT.md` debe documentar estrictamente:
- **Visión y Estética:** Reglas visuales del Semiotic Standard (valores de bordes, sombras, radios, tipografía y uso de etiquetas técnicas).
- **Arquitectura Agnóstica:** Por qué no usamos React/Tailwind en el core y cómo garantizar compatibilidad con Thymeleaf y HTMX.
- **Convenciones de Código:** Nomenclatura de CSS Custom Properties (`--sm-*`), clases (`.sm-*`), y etiquetas de Web Components (`<semiotic-*>`).
- **Flujo de Creación de Componentes:** Pasos obligatorios cada vez que se pida un nuevo componente (1. Implementar en `/src`, 2. Exportar en `index.js`, 3. Documentar con ejemplo interactivo en `/docs`, 4. Verificar build con Vite).
- **Comandos clave:** Build, dev de librería y dev de documentación.

Comienza ejecutando la Tarea 1 y la Tarea 2 de forma ordenada, explicando brevemente las decisiones tomadas al finalizar.
```