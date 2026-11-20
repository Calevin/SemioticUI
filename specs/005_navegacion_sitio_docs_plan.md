# Plan Técnico — navegacion_sitio_docs (Spec 005)

- **Spec Origen:** `specs/005_navegacion_sitio_docs_spec.md`
- **Verificador Asociado:** `specs/005_navegacion_sitio_docs_verificador.md`
- **Estado:** `PLANIFICADO`
- **Dependencias:** `004` (`componente_sidebar`), verificada en `.seb/seb.lock` (`verified: true`, `commit_hash` `4178cb8`).
- **Línea base de comparación:** commit `28acdc7` (HEAD al planificar, incluye la Spec 004). Los controles de dependencias, API y librería se comparan contra él.
- **Precondición de ejecución:** todos los comandos, `.seb/bin/seb verify` incluido, se ejecutan dentro del dev shell (`nix develop` o direnv), con `npm install` ya ejecutado (`MEMORY.md` sección 3).
- **Fuente única de verificación:** la tabla de `specs/005_navegacion_sitio_docs_verificador.md`, ejecutada por `.seb/bin/seb verify navegacion_sitio_docs`. Esta tarea no crea, modifica ni configura hooks (`MEMORY.md` D-03).
- **Efecto colateral conocido y aceptado (spec, sección 8):** `004-CHK-11` y `004-CHK-12` pasan a `[FALLA]` en cuanto la raíz deja de tener la demo del Sidebar. No se tocan; su resellado es una Operación One-Off del humano.

## 1. Resumen Arquitectónico y Aislamiento de Lógica

**Sitio estático multipágina en Astro, sin cambios en la librería.** Cada destino es un documento HTML generado en la compilación: `/` (Introduction), `/installation/`, `/components/<slug>/` (una ficha por componente, con ruta dinámica `getStaticPaths`) y `404.html`. La navegación usa enlaces `<a href>` comunes; no hay enrutador en el cliente. `src/`, `DESIGN.md`, los manifiestos y la configuración de Vite no cambian (`005-RNF-02`, `005-RNF-05`).

**Separación datos / presentación / comportamiento:**

1. **Datos del catálogo (`docs/src/catalog/`):** módulos JS puros, uno por componente, con nombre, slug, pieza del inventario, textos y snippets. La preview en vivo y el snippet HTML salen de la **misma cadena**: la preview se renderiza con `set:html` y el snippet con interpolación de texto (`{...}`), que Astro escapa. Así se cumple `005-RF-20` por construcción y `005-RF-21` por el escapado.
2. **Presentación (`docs/src/layouts/`, `docs/src/components/`, `docs/src/pages/`):** un layout de documentación común (cabecera, enlace de salto, Sidebar del sitio y región principal) y una plantilla de ficha que fija el orden de secciones de `005-RF-16`.
3. **Comportamiento del cliente (`docs/src/scripts/`):** tres archivos chicos con la lógica aislada para poder probarla en happy-dom (`005-RNF-06`):
   - `theme-boot.js`: script clásico que se inserta en línea en el `<head>` y aplica el tema guardado antes del primer pintado.
   - `theme.js`: módulo ESM con el control de tema.
   - `alert-console.js`: módulo ESM con la restauración de alertas y el registro de eventos.

**Verificación en tres capas** (mismo patrón que la Spec 004, `MEMORY.md` sección 3):

1. **Herramienta de chequeo del sitio compilado (`tools/docs-check/`):** carga cada HTML de `docs/dist` con el `DOMParser` de happy-dom, sin ejecutar scripts ni cargar recursos, y valida el contrato de marcado de la sección 3.1. Deriva el catálogo y las variantes esperadas de `DESIGN.md` (no de los datos del sitio), así un componente nuevo en el inventario sin ficha hace fallar la verificación (`005-CL-01`). Queda fuera de Vitest por el presupuesto de 30 s de `003-CHK-10`.
2. **Tests en Vitest:** la lógica pura de la herramienta se prueba con fixtures HTML (un fixture por código de problema) y los scripts del cliente se ejecutan aislados en happy-dom.
3. **Controles de caja negra en el verificador:**
   - Mutan una **copia** de `docs/dist` o de `DESIGN.md` con `sed` y exigen que la herramienta falle con el código esperado.
   - Mutan una **copia** de los scripts del cliente y exigen que el test falle con el mensaje esperado.
   - Nunca modifican archivos del repositorio.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción | Responsabilidad Técnica | Requisitos Cubiertos |
| :--- | :--- | :--- | :--- |
| `docs/astro.config.mjs` | `MODIFICAR` | Agregar `trailingSlash: 'always'`, `build.format: 'directory'` (explícito) y `build.inlineStylesheets: 'never'`. El alias `semiotic-ui` no cambia | `005-RNF-01`, `005-CL-04`, `005-CL-05` |
| `docs/src/styles/docs.css` | `CREAR` | Todos los estilos propios del sitio (clases `doc-*`), solo con tokens Tier 2. Reemplaza el `<style>` de la página actual | `005-CL-03`, `005-CL-04` |
| `docs/src/layouts/BaseLayout.astro` | `MODIFICAR` | `<head>` con título, el script de arranque de tema en línea (`theme-boot.js?raw`) y `docs.css`. Script de cliente con `import 'semiotic-ui'` y la inicialización del control de tema | `005-RF-04`, `005-RF-10`, `005-RF-11`, `005-RF-22` |
| `docs/src/layouts/DocsLayout.astro` | `CREAR` | Enlace de salto, cabecera, `.sm-sidebar-layout` con el Sidebar del sitio y `main#main-content`. Props: `title`, `currentPath` (`null` en la 404) | `005-RF-01` a `005-RF-04`, `005-RF-08`, `005-RF-24` |
| `docs/src/components/SiteHeader.astro` | `CREAR` | Cabecera con marca, etiqueta técnica `DOC-00 // V<versión de package.json>` y `button#theme-toggle` | `005-RF-02`, `005-RF-10` |
| `docs/src/components/SiteNav.astro` | `CREAR` | Sidebar del sitio con los dos SidebarMenu (sección 3.1) y `aria-current` según `currentPath` | `005-RF-05` a `005-RF-09` |
| `docs/src/components/CodeBlock.astro` | `CREAR` | `<pre class="doc-pre"><code>{code}</code></pre>`: un snippet como texto literal | `005-RF-21` |
| `docs/src/components/ComponentPage.astro` | `CREAR` | Plantilla de ficha: título, descripción, preview, código y variantes (opcional), con los atributos `data-doc-section` de la sección 3.1 | `005-RF-16` a `005-RF-21` |
| `docs/src/catalog/buttons.js`, `cards.js`, `code-tags.js`, `interactive-alerts.js`, `sidebar.js` | `CREAR` | Datos de cada ficha según la sección 3.2. Los snippets del Sidebar reutilizan los de la Spec 004 | `005-RF-16` a `005-RF-20` |
| `docs/src/catalog/index.js` | `CREAR` | `CATALOG`: lista de las cinco fichas en orden alfabético por `name` y `componentUrl(slug)` | `005-RF-06`, `005-RF-07` |
| `docs/src/pages/index.astro` | `MODIFICAR` (reescritura) | Página "Introduction". Se eliminan las secciones `MOD-01` a `MOD-05`, la sección "Integration Snippets" y el `<style>` local | `005-RF-09`, `005-RF-13` |
| `docs/src/pages/installation.astro` | `CREAR` | Guía paso a paso para consumidores (sección 3.3) | `005-RF-14`, `005-RF-15` |
| `docs/src/pages/components/[slug].astro` | `CREAR` | `getStaticPaths` sobre `CATALOG`, renderiza `ComponentPage`. En la ficha "Interactive Alerts" agrega el control de restaurar y el registro de eventos, e inicializa `alert-console.js` | `005-RF-16` a `005-RF-23` |
| `docs/src/pages/404.astro` | `CREAR` | Página "Not found" con `DocsLayout` y `currentPath = null` | `005-RF-24` |
| `docs/src/scripts/theme-boot.js` | `CREAR` | Script clásico (sin `import` ni `export`) que aplica el tema guardado (sección 3.4) | `005-RF-11`, `005-RF-12` |
| `docs/src/scripts/theme.js` | `CREAR` | Módulo del control de tema (sección 3.4) | `005-RF-10` a `005-RF-12` |
| `docs/src/scripts/alert-console.js` | `CREAR` | Módulo de restauración de alertas y registro de eventos (sección 3.4) | `005-RF-23`, `005-CL-02` |
| `tools/docs-check/site-model.js` | `CREAR` | Derivación del catálogo y de las variantes desde `DESIGN.md`, referencias publicadas del paquete y URLs (sección 3.5) | `005-RF-06`, `005-RF-15`, `005-RF-18`, `005-CL-01` |
| `tools/docs-check/site-check.js` | `CREAR` | Función pura `checkDocsSite(site, context)` que devuelve la lista de problemas (sección 3.5) | `005-RF-01` a `005-RF-24`, `005-RNF-01`, `005-RNF-04`, `005-CL-01`, `005-CL-03`, `005-CL-05` |
| `tools/docs-check/check-docs-site.js` | `CREAR` | CLI: lee el sitio compilado y sus hojas y scripts locales, imprime `codigo: detalle` por línea y sale con `1` si hay problemas | Igual que `site-check.js` |
| `tests/docs/site-fixtures.js` | `CREAR` | Generador de un sitio fixture válido en memoria, con opciones para romper cada regla (no es `.test.js`) | Soporte |
| `tests/docs/site-model.test.js` | `CREAR` | Derivación del catálogo y de las variantes con fixtures de `DESIGN.md` y con el `DESIGN.md` real | `005-RF-06`, `005-RF-18`, `005-CL-01` |
| `tests/docs/site-structure.test.js` | `CREAR` | Códigos de estructura, tema estático, 404 y recursos remotos | `005-RF-01` a `005-RF-04`, `005-RF-10`, `005-RF-11`, `005-RF-24`, `005-RNF-01`, `005-RNF-04`, `005-RNF-07` |
| `tests/docs/site-navigation.test.js` | `CREAR` | Códigos de navegación | `005-RF-05` a `005-RF-09`, `005-CL-01`, `005-CL-03`, `005-CL-05` |
| `tests/docs/site-getting-started.test.js` | `CREAR` | Códigos de Introduction e Installation | `005-RF-13` a `005-RF-15` |
| `tests/docs/site-component-pages.test.js` | `CREAR` | Códigos de fichas, variantes, snippets y alertas | `005-RF-16` a `005-RF-23` |
| `tests/docs/theme.test.js` | `CREAR` | Ejecuta `theme-boot.js` y `theme.js` en happy-dom con almacenamiento simulado | `005-RF-10` a `005-RF-12` |
| `tests/docs/alert-console.test.js` | `CREAR` | Ejecuta `alert-console.js` en happy-dom con `<semiotic-alert>` real | `005-RF-23`, `005-CL-02` |
| `MEMORY.md` | `MODIFICAR` | Entradas registradas por el planificador; el implementador solo agrega hallazgos nuevos con `seb memory-add` | Constitución, sección F |

**No se modifican:** `src/`, `DESIGN.md`, `package.json`, `package-lock.json`, `docs/package.json`, `vite.config.js`, `vitest.config.js`, `stylelint.config.js`, `tools/design-doc/`, `tools/stylelint/`, `tools/docs-check/sidebar-demo.js`, `tools/docs-check/check-sidebar-demo.js`, los tests existentes, `docs/constitution.md`, `docs/use-cases/` ni `.agents/`.

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 Contrato de marcado de cada página compilada

Toda página (las siete de documentación y la 404) tiene esta estructura. Los nombres en inglés son literales:

```html
<html lang="en">
  <head>
    <title>{pageName} // Semiotic UI</title>
    <script>/* contenido exacto de docs/src/scripts/theme-boot.js */</script>
    <!-- hojas locales de /_astro/: tokens, base, componentes y docs.css -->
  </head>
  <body>
    <a class="doc-skip-link" href="#main-content">Skip to content</a>
    <header class="doc-header">
      <span class="sm-code-tag">DOC-00 // V0.1.0</span>   <!-- V + version de package.json -->
      <p class="doc-brand">SEMIOTIC UI SYSTEM</p>        <!-- sin h1 en la cabecera -->
      <button id="theme-toggle" class="sm-btn sm-btn--primary sm-btn--sm" type="button">Toggle Theme</button>
    </header>
    <div class="sm-sidebar-layout doc-layout">
      <nav class="sm-sidebar" aria-label="Documentation" data-doc-nav>
        <div class="sm-sidebar-menu">
          <h2 class="sm-sidebar-label" id="nav-getting-started">Getting started</h2>
          <ul aria-labelledby="nav-getting-started">
            <li><a class="sm-sidebar-item" href="/" aria-current="page">Introduction</a></li>
            <li><a class="sm-sidebar-item" href="/installation/">Installation</a></li>
          </ul>
        </div>
        <div class="sm-sidebar-menu">
          <h2 class="sm-sidebar-label" id="nav-components">Components</h2>
          <ul aria-labelledby="nav-components">
            <li><a class="sm-sidebar-item" href="/components/buttons/">Buttons</a></li>
            <!-- Cards, Code Tags, Interactive Alerts, Sidebar -->
          </ul>
        </div>
      </nav>
      <main id="main-content" tabindex="-1" class="doc-main">
        <h1>{pageName}</h1>
        <!-- contenido de la pagina -->
      </main>
    </div>
  </body>
</html>
```

- `pageName`: `Introduction`, `Installation`, el nombre visible de la ficha o `Not found`. El `<h1>` de `main` coincide con el texto del item del Sidebar (`005-RF-07`). Cada página tiene exactamente un `<h1>`, dentro de `main`.
- `aria-current="page"` aparece en un solo item del Sidebar del sitio: el de `currentPath`. En la 404 no aparece en ninguno (`005-RF-08`, `005-RF-09`, `005-RF-24`).
- Los atributos de cada item del Sidebar del sitio se escriben en este orden: `class`, `href` y, si corresponde, `aria-current`. El verificador muta el HTML con `sed` contando con ese orden.
- Ningún elemento del Sidebar del sitio lleva `hidden`, `inert` ni `style`, y ninguna regla de las hojas de la página oculta o fija `.sm-sidebar`, `.sm-sidebar-menu` o `.sm-sidebar-item` (`005-CL-03`).
- Todo `a[href]` interno empieza con `/`, termina en `/` antes de un `#` o de un `?` y apunta a una página compilada que existe. Los enlaces a anclas locales (`#...`) también son válidos (`005-CL-05`).
- Ninguna etiqueta `script[src]`, `link[href]`, `img[src]`, `source[src]`, `iframe[src]`, `video[src]`, `audio[src]` ni ninguna hoja local apunta a `http:`, `https:` o `//` (`005-RNF-04`).

**Ficha de componente** (dentro de `main`, generada por `ComponentPage.astro`):

```html
<article class="doc-component" data-piece=".sm-btn">        <!-- pieza exacta del inventario -->
  <h1 data-doc-section="title">Buttons</h1>
  <div data-doc-section="description">
    <p data-doc-part="what">...</p>
    <p data-doc-part="when">...</p>
  </div>
  <section data-doc-section="preview" aria-labelledby="preview-title">
    <h2 id="preview-title">Preview</h2>
    <div class="doc-preview"><!-- set:html de preview.html --></div>
  </section>
  <section data-doc-section="code" aria-labelledby="code-title">
    <h2 id="code-title">Code</h2>
    <figure data-format="html">...<pre class="doc-pre"><code>{preview.html}</code></pre></figure>
    <figure data-format="thymeleaf">...</figure>
    <figure data-format="react">...</figure>
  </section>
  <section data-doc-section="variants" aria-labelledby="variants-title">  <!-- solo si hay variantes -->
    <h2 id="variants-title">Variants</h2>
    <figure class="doc-variant" data-variant="primary">
      <div class="doc-preview"><!-- set:html --></div>
      <pre class="doc-pre"><code>{html}</code></pre>
    </figure>
  </section>
</article>
```

- El contenedor de cada preview es exactamente `<div class="doc-preview">`, una sola clase y sin otros atributos, porque el verificador lo muta con `sed`.
- Los estilos del sitio viven solo en `docs/src/styles/docs.css`. Ningún `.astro` tiene un bloque `<style>`, para que Astro no agregue atributos `data-astro-cid-*`.
- `docs.css` no contiene el carácter `#`: no usa selectores de id ni colores literales. Solo usa tokens `var(--sm-*)` Tier 2 y no declara custom properties (`005-CL-04`).
- `docs/astro.config.mjs` fija `build.inlineStylesheets: 'never'`. Así todas las hojas llegan como `link[rel=stylesheet]` locales, que la herramienta lee y el verificador puede quitar.
- En la ficha "Interactive Alerts", después del `article`, va `<div class="doc-controls">` con `button#restore-alerts[type=button]` y `span#event-log[aria-live="polite"]`.

### 3.2 Modelo de datos del catálogo (`docs/src/catalog/<slug>.js`)

```js
// Cada modulo exporta por defecto la descripcion de una ficha
export default {
  name: 'Buttons',              // nombre visible (tabla de la spec, seccion 4)
  slug: 'buttons',              // kebab-case del nombre
  piece: '.sm-btn',             // pieza exacta del inventario de DESIGN.md
  what: '...',                  // que es
  when: '...',                  // cuando usarlo
  preview: { html: '...', thymeleaf: '...', react: '...' },
  variants: [{ id: 'primary', html: '...' }],   // vacio en Code Tags y Sidebar
};
```

| Ficha | `piece` | Variantes (`id`) | La preview principal incluye |
| :--- | :--- | :--- | :--- |
| Buttons | `.sm-btn` | `primary`, `info`, `success`, `warning`, `danger`, `ghost`, `sm`, `lg` | un `.sm-btn` sin modificador y un `button.sm-btn[disabled]` |
| Cards | `.sm-card` | `info`, `success`, `warning`, `danger`, `compact` | un `.sm-card` sin modificador |
| Code Tags | `.sm-code-tag` | ninguna | un `.sm-code-tag` |
| Interactive Alerts | `<semiotic-alert>` | `info`, `success`, `warning`, `danger` | un `semiotic-alert[dismissible]` |
| Sidebar | `.sm-sidebar` | ninguna | la demo de la Spec 004: `.sm-sidebar-layout` > `nav.sm-sidebar[aria-label]` con dos menús, un item activo y uno deshabilitado sin `href` |

- La preview de una variante de clase contiene un elemento con `.sm-<bloque>--<id>`. La de una variante de atributo contiene `<semiotic-alert variant="<id>">`.
- Los snippets Thymeleaf usan `th:` y escapan las expresiones `\${...}` dentro de los template literals. Los snippets React importan un especificador publicado (`'semiotic-ui'` o `'semiotic-ui/css'`) y usan `className` cuando hay clases.
- Las alertas de las previews no llevan el atributo `dismissed` (`005-CL-02`).
- Los `id` de la demo del Sidebar no chocan con los del sitio (`nav-getting-started`, `nav-components`, `main-content`, `preview-title`, `code-title`, `variants-title`).

### 3.3 Contenido de Getting started

- **Introduction (`/`):** `<h1>Introduction</h1>`; un `<p class="doc-intro">` que describe el propósito de la librería y nombra literalmente "Semiotic Standard"; un `<ul class="doc-channels">` con exactamente dos `<li>`. El primero contiene "bundler"; el segundo contiene "script" y "CDN".
- **Installation (`/installation/`):** `<h1>Installation</h1>` y un `<ol class="doc-steps">`. Cada `<li>` tiene al menos un `<p>` con la descripción y al menos un `pre code`. Entre todos los snippets de la página aparecen:
  - `npm install semiotic-ui`.
  - `import 'semiotic-ui';` e `import 'semiotic-ui/css';`.
  - Un `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semiotic-ui@<versión>/dist/semiotic-ui.css">`.
  - Un `<script src="https://cdn.jsdelivr.net/npm/semiotic-ui@<versión>/dist/semiotic-ui.umd.js"></script>`.
- `<versión>` y los nombres salen de `package.json` en la compilación (import JSON en el frontmatter), nunca escritos a mano.

### 3.4 Scripts del cliente

```js
// docs/src/scripts/theme-boot.js — script clasico, sin import ni export.
// Solo usa window.localStorage y document.documentElement; todo dentro de try/catch.
// Si el valor guardado bajo 'sm-docs-theme' es 'dark', fija data-sm-theme="dark"; en cualquier otro caso no hace nada.

// docs/src/scripts/theme.js
export const THEME_STORAGE_KEY = 'sm-docs-theme';
export function readStoredTheme(getStorage) // -> 'dark' | 'light'; 'light' si falla o el valor es desconocido
export function applyTheme(root, theme)     // 'dark' fija data-sm-theme="dark"; otro valor lo elimina
export function toggleTheme(root, getStorage) // alterna segun root, aplica y persiste con storage.setItem(THEME_STORAGE_KEY, next) en try/catch; devuelve next
export function initThemeToggle(button, root, getStorage) // click -> toggleTheme; devuelve una funcion que quita el listener

// docs/src/scripts/alert-console.js
export function formatEventLog(type, detail) // -> 'EVENT LOG: SM-DISMISS (warning // TEMP-404)'; sin codigo usa 'NO-CODE'
export function initAlertConsole({ root, restoreButton, eventLog }) // escucha 'sm-dismiss' y 'sm-show' en root;
//   el boton llama a .show() sobre cada root.querySelectorAll('semiotic-alert[dismissed]'); devuelve una funcion de limpieza
```

- `getStorage` es una función (`() => window.localStorage`) porque en algunos navegadores leer `window.localStorage` ya lanza una excepción.
- `theme-boot.js` se inserta con `import bootSource from '../scripts/theme-boot.js?raw'` y `<script is:inline set:html={bootSource} />` en el `<head>`. El texto compilado es idéntico al archivo; la herramienta lo compara con `trim()`.
- Las cadenas `'sm-docs-theme'`, `'theme-toggle'`, `'sm-dismiss'`, `'sm-show'`, `'restore-alerts'` y `'event-log'` aparecen como literales en el código del cliente, así que sobreviven a la minificación y sirven de evidencia estática.
- `alert-console.js` no usa `localStorage` ni `sessionStorage` (`005-CL-02`).

### 3.5 Herramienta de chequeo (`tools/docs-check/`)

```js
// site-model.js
export const SPEC_CATALOG; // [{ piece: '.sm-btn', name: 'Buttons', slug: 'buttons' }, ... las cinco filas de la spec]
export function deriveCatalog(designMarkdown) // -> [{ piece, kind: 'class' | 'element', variants: string[] }]
export function kebabCase(name)               // 'Interactive Alerts' -> 'interactive-alerts'
export function componentUrl(name)            // -> '/components/<kebab>/'
export function packageReferences(pkg)        // -> { name, version, specifiers: Set, artifacts: Set }
export function pageUrlFromFile(relativePath) // 'index.html' -> '/', 'a/b/index.html' -> '/a/b/', '404.html' -> '404'

// site-check.js
export function checkDocsSite(site, context) // -> Array<{ code, url, detail }>; lista vacia = sitio valido
//   site:    { pages: Array<{ url, document, stylesheets: string[], scripts: string[] }> }
//   context: { design: string, pkg: object, bootSource: string }
```

**Reglas de derivación (`deriveCatalog`)** sobre la región `design-check:inventory`, reutilizando `parseTables`, `readCodeSpans` y `findRegions` de `tools/design-doc/markdown-model.js`:

- Las piezas son las filas de la tabla `Pieza | Tipo | Estado` con tipo `Clase CSS` (`kind: 'class'`) o `Web Component` (`kind: 'element'`). El reset global queda fuera por su tipo.
- Variantes de una clase `.sm-x`: los code spans de la primera columna de las tablas de la región que cumplen `^\.sm-x--[a-z0-9-]+$`, sin repetir y en orden de aparición.
- Variantes de un elemento `<tag>`: dentro del mismo encabezado `###` que la tabla `Custom Element` que lista `<tag>`, son los code spans de la columna `Tipo` en la fila `variant` de la tabla `Atributo`.

**CLI:** `node tools/docs-check/check-docs-site.js <site-dir> [--design <ruta>] [--package <ruta>] [--boot <ruta>]`. Por defecto usa `DESIGN.md`, `package.json` y `docs/src/scripts/theme-boot.js` de la raíz del repositorio, resueltos desde `import.meta.dirname`. Recorre todos los `*.html` de `<site-dir>`, salvo `_astro/`. Lee las hojas `link[rel=stylesheet]` locales y los scripts `script[src]` locales desde `<site-dir>`, y suma los `<style>` y `<script>` en línea. happy-dom se configura como en `check-sidebar-demo.js`, sin ejecutar JavaScript ni cargar archivos.

**Códigos de problema** (contrato con el verificador; el CLI imprime `codigo: detalle`):

| Código | Condición de fallo | Requisitos |
| :--- | :--- | :--- |
| `page-missing` | Falta `/`, `/installation/`, `404` o la ficha de una pieza de `SPEC_CATALOG` presente en el inventario | `005-RNF-01`, `005-RNF-07` |
| `page-unexpected` | Hay un HTML que no es `/`, `/installation/`, `404` ni la ficha de una pieza del inventario | `005-RNF-01` |
| `layout-invalid` | Falta `.sm-sidebar-layout` cuyo primer hijo es `nav.sm-sidebar[data-doc-nav]` con nombre accesible y cuyo segundo hijo es `main#main-content` | `005-RF-01` |
| `header-invalid` | Falta `header.doc-header` antes del layout, con `.sm-code-tag` que contenga `V<versión>`, el texto `SEMIOTIC UI` y `button#theme-toggle[type=button]`, o la cabecera tiene un `h1` | `005-RF-02`, `005-RF-10` |
| `skip-link-invalid` | El primer elemento enfocable no es `a[href="#main-content"]` con el texto `Skip to content` | `005-RF-03` |
| `title-invalid` | `<title>` vacío, sin el nombre de la página o repetido en otra página | `005-RF-04` |
| `theme-boot-missing` | El `<head>` no tiene un `<script>` clásico en línea idéntico (con `trim`) a `theme-boot.js` | `005-RF-11`, `005-RF-12` |
| `theme-script-missing` | Los scripts de la página no contienen `sm-docs-theme` y `theme-toggle` | `005-RF-10` |
| `nav-structure-invalid` | Los menús del Sidebar del sitio no son exactamente `Getting started` (`Introduction`, `Installation`) y `Components` (un item por pieza, en orden alfabético), o las etiquetas no están asociadas a sus listas | `005-RF-05`, `005-RF-06` |
| `nav-link-invalid` | Un item no es `a.sm-sidebar-item[href]` con la URL del esquema; tiene `onclick` o `javascript:`; el `h1` de su destino no coincide con su texto; o un enlace interno no termina en `/` o apunta a una página inexistente | `005-RF-07`, `005-CL-05` |
| `nav-active-invalid` | Cantidad de `aria-current="page"` en el Sidebar del sitio distinta de 1, o en un item que no es el de la página. En la 404, alguno | `005-RF-08`, `005-RF-09`, `005-RF-24` |
| `nav-hidden` | El Sidebar del sitio o sus items tienen `hidden`, `inert` o `style`, o una regla los oculta (`display: none`, `visibility: hidden`) o los fija (`position: fixed` o `sticky`) | `005-CL-03` |
| `catalog-entry-missing` | Una pieza del inventario no tiene item en `Components` o no tiene una ficha `article[data-piece]` | `005-CL-01` |
| `catalog-name-invalid` | Una pieza de `SPEC_CATALOG` tiene otro nombre visible u otra URL, o una ficha no vive en `componentUrl(name)` | `005-RF-06`, `005-RF-07` |
| `not-found-invalid` | La 404 no tiene `h1` con `Not found` | `005-RF-24` |
| `intro-content-invalid` | Introduction no cumple la sección 3.3 | `005-RF-13` |
| `install-content-invalid` | Installation no tiene la lista ordenada con descripción y snippet en cada paso, o le falta alguno de los cuatro contenidos de la sección 3.3 | `005-RF-14` |
| `install-reference-invalid` | Un especificador `semiotic-ui...` no está publicado en `package.json#exports`, o una URL de un snippet no contiene `/semiotic-ui@<versión>/` seguido de un artefacto publicado | `005-RF-15` |
| `ficha-structure-invalid` | Los `[data-doc-section]` del `article` no siguen el orden `title`, `description`, `preview`, `code`, `variants` (este último opcional); el título no es el nombre; o falta `what` o `when` con texto | `005-RF-16` |
| `preview-invalid` | La preview principal no tiene la pieza base o los estados de la tabla de la sección 3.2 | `005-RF-16` |
| `code-format-missing` | Falta `figure[data-format]` `html`, `thymeleaf` o `react` con snippet no vacío; el de Thymeleaf no contiene `th:`; o el de React no importa un especificador publicado | `005-RF-17` |
| `variant-missing` | Una variante derivada de `DESIGN.md` no tiene `figure[data-variant]` con preview que contenga la clase o el atributo, y su snippet | `005-RF-18` |
| `variant-unexpected` | Hay un `figure[data-variant]` que no corresponde a ninguna variante derivada | `005-RF-18` |
| `variant-section-empty` | Una pieza sin variantes tiene un `[data-doc-section="variants"]` o un encabezado `Variants` dentro de `main` | `005-RF-19` |
| `snippet-mismatch` | El snippet HTML de la preview principal (`figure[data-format="html"]`) o de una variante, parseado y serializado, no coincide con el `innerHTML` de su `.doc-preview` después de normalizar los espacios en blanco (colapsar espacios y quitarlos entre etiquetas) | `005-RF-20` |
| `snippet-not-literal` | Algún `pre code` de la página tiene elementos hijos | `005-RF-21` |
| `alert-behavior-missing` | La ficha de `<semiotic-alert>` no tiene una alerta con `dismissible` en una preview, o sus scripts no contienen `customElements` y `semiotic-alert` | `005-RF-22` |
| `alert-console-missing` | La ficha de `<semiotic-alert>` no tiene `button#restore-alerts`, `#event-log[aria-live]`, o sus scripts no contienen `restore-alerts`, `event-log`, `sm-dismiss` y `sm-show` | `005-RF-23` |
| `sidebar-ficha-invalid` | `checkSidebarDemo` de la Spec 004, aplicado a un documento armado solo con el `main` de la ficha Sidebar y las hojas de la página, devuelve algún problema. El detalle lista sus códigos | `005-RF-16`, `005-RF-18` (de la 004) |
| `remote-resource` | Un recurso de la página o una hoja local apunta a `http:`, `https:` o `//` | `005-RNF-04` |
| `stylesheet-missing` | Las hojas de la página no contienen `.sm-sidebar-item` ni `data-sm-theme` (la hoja de la librería con los tokens oscuros) | `005-RF-01`, `005-CL-04` |

### 3.6 Tests y mensajes de aserción (contrato con el verificador)

- Los tests de la herramienta (`site-*.test.js`) usan `@vitest-environment happy-dom`, arman el sitio con `tests/docs/site-fixtures.js` y afirman `expect(codes, '<codigo>').toContain('<codigo>')` en cada fixture roto. También afirman que el fixture válido no tiene problemas. Cada código de la sección 3.5 tiene al menos un test y figura literalmente en el archivo de su grupo.
- Ningún archivo de `tests/` contiene la cadena `dist/` (`001-CHK-05`). Las URLs de CDN de los fixtures se arman con `['dist', 'semiotic-ui.css'].join('/')`.
- `theme.test.js` evalúa `theme-boot.js` con `new Function('window', 'document', source)` sobre un `window` simulado cuyo `localStorage` devuelve un valor, falla o lanza al leerse. También espía `console.error` y `console.warn`. Mensajes:

  | Mensaje | Significa |
  | :--- | :--- |
  | `theme-not-applied` | El arranque con `dark` o el alternado no fijan o quitan `data-sm-theme` |
  | `theme-not-persisted` | `toggleTheme` no guarda el tema nuevo bajo `sm-docs-theme` |
  | `theme-storage-unsafe` | Un almacenamiento que lanza hace lanzar al arranque, a `readStoredTheme` o a `toggleTheme`, o escribe en la consola |
  | `theme-default-invalid` | Un valor ausente o desconocido no deja el tema claro |

- `alert-console.test.js` importa `src/index.js` (registro real) y crea alertas `dismissible`. Mensajes:

  | Mensaje | Significa |
  | :--- | :--- |
  | `alert-restore-failed` | El botón no reabre las alertas descartadas |
  | `event-log-invalid` | El registro no muestra el último `sm-dismiss` o `sm-show` con el formato de `formatEventLog` |
  | `alert-state-persisted` | El módulo menciona `Storage` (lectura de su propio código fuente) |

- Umbrales mínimos de tests por archivo (los fija el verificador): `site-model` 6, `site-structure` 10, `site-navigation` 10, `site-getting-started` 6, `site-component-pages` 14, `theme` 8, `alert-console` 5.

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: páginas estáticas con `getStaticPaths` y enlaces comunes.** Cumple `005-RF-07` sin JavaScript y genera un HTML por URL (`005-RNF-01`).
  - _Alternativa descartada:_ una página única con vistas ocultas y `hashchange`. Rompe "una URL por item" y depende de JavaScript.
  - _Alternativa descartada:_ View Transitions o `ClientRouter` de Astro. Agrega un enrutador en el cliente que la spec no pide e interfiere con el arranque de tema.
- **Decisión 2: una sola cadena para preview y snippet HTML.** `set:html` renderiza la preview y `{...}` muestra el mismo texto escapado. La coincidencia de `005-RF-20` queda garantizada por construcción, y la herramienta igual la comprueba sobre el resultado compilado.
  - _Alternativa descartada:_ el componente `<Code>` de Astro, que usa Shiki, o un resaltador. Mete marcado dentro de `code`, lo que choca con el chequeo literal de `005-RF-21` y con `snippet-not-literal` de la Spec 004. La spec permite el resaltado, pero no lo exige, así que no se incluye.
- **Decisión 3: tema con script en línea en el `<head>` más un módulo.** Los scripts `type="module"` son diferidos y aplicarían el tema después del primer pintado. El script clásico en línea evita el parpadeo (`005-RF-11`). El archivo fuente es el mismo que prueba Vitest y que la herramienta compara con el HTML, así que lo probado es lo publicado.
  - _Alternativa descartada:_ una cookie y lectura en el servidor. El sitio es estático.
- **Decisión 4: el catálogo esperado sale de `DESIGN.md`, no de los datos del sitio.** El inventario ya está bajo verificación de coherencia con el CSS (Spec 002). Usarlo como referencia independiente hace que `005-CL-01` falle cuando aparece una pieza sin ficha. `SPEC_CATALOG` fija solo los nombres y las URLs de las cinco piezas actuales y se aplica por inclusión, así que un componente nuevo no lo rompe.
  - _Alternativa descartada:_ comparar contra una lista fija de ocho HTML. Repite el patrón de controles que fijan el estado del árbol (`001-CHK-25`, `004-CHK-11`), que la memoria registra como deuda.
- **Decisión 5: contrato de marcado con atributos `data-doc-*`.** Desacopla la herramienta del texto visible y de las clases de estilo, y le da al verificador anclas estables para las mutaciones con `sed`.
- **Decisión 6: estilos del sitio en una hoja global sin `<style>` en los `.astro`.** Evita los atributos `data-astro-cid-*`, que cambiarían el `innerHTML` de las previews y las anclas de `sed`, y concentra en un solo archivo el chequeo de tokens de `005-CL-04`. No se le aplica el Stylelint del proyecto, que exige el prefijo `.sm-` y valida la librería, no el sitio.
- **Decisión 7: reutilizar `checkSidebarDemo` de la Spec 004 sobre el `main` de la ficha Sidebar.** Conserva para la ficha nueva las garantías de accesibilidad de la demo de la 004 sin duplicar reglas y sin tocar los archivos de la 004.
- **Decisión 8: CDN de ejemplo jsDelivr con versión exacta.** La spec exige nombre y versión, y jsDelivr sirve paquetes npm por ruta `/npm/<nombre>@<versión>/`. La URL es solo texto (`005-RNF-04`).
- **Riesgo conocido y aceptado:** `004-CHK-11` y `004-CHK-12` fallan a partir de la tarea T8, como prevé la spec. `tests/docs/sidebar-demo-check.test.js` sigue en verde porque prueba la herramienta con fixtures.
- **Riesgo conocido, fuera de esta tarea:** `001-CHK-25` ya falla en una reverificación de la 001 desde la Spec 004 (`MEMORY.md`). Esta tarea no cambia el CSS de la librería, así que no lo agrava.
- **Estado de partida (honestidad del ciclo TDD):** la herramienta sobre la compilación actual falla con `page-missing`, `layout-invalid` y otros códigos. Los tests de los scripts del cliente fallan porque los módulos no existen todavía.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: ejecuta UNA tarea a la vez en orden. Está prohibido editar `docs/constitution.md`, `specs/005_*_spec.md` y `specs/005_*_verificador.md`, y debilitar un test para que pase. Ningún archivo bajo `tests/` puede contener la cadena `dist/`._

- [ ] **T1. Modelo del sitio derivado de `DESIGN.md`** (`005-RF-06`, `005-RF-15`, `005-RF-18`, `005-CL-01`)
  - _Archivos:_ `tests/docs/site-model.test.js` (primero en rojo) y `tools/docs-check/site-model.js`.
  - _Hecho cuando:_ el test pasa y, con el `DESIGN.md` real, `deriveCatalog` devuelve las cinco piezas con las variantes de la sección 3.2.
- [ ] **T2. Herramienta de chequeo y fixtures** (`005-RF-01` a `005-RF-24`, `005-RNF-01`, `005-RNF-04`, `005-CL-03`, `005-CL-05`)
  - _Archivos:_ `tests/docs/site-fixtures.js`, los cuatro `tests/docs/site-*.test.js` (primero en rojo), `tools/docs-check/site-check.js` y `tools/docs-check/check-docs-site.js`.
  - _Hecho cuando:_ los cuatro archivos de test pasan con sus umbrales y el CLI sobre la compilación actual sale con `1` (rojo esperado).
- [ ] **T3. Scripts de tema** (`005-RF-10` a `005-RF-12`)
  - _Archivos:_ `tests/docs/theme.test.js` (primero en rojo), `docs/src/scripts/theme-boot.js` y `docs/src/scripts/theme.js`.
  - _Hecho cuando:_ la parte de tests y cajas negras del comando `005-CHK-05` devuelve exit code `0`.
- [ ] **T4. Consola de alertas** (`005-RF-23`, `005-CL-02`)
  - _Archivos:_ `tests/docs/alert-console.test.js` (primero en rojo) y `docs/src/scripts/alert-console.js`.
  - _Hecho cuando:_ el test pasa con su umbral y la caja negra de `.show()` de `005-CHK-09` lo hace fallar con `alert-restore-failed`.
- [ ] **T5. Layout del sitio, cabecera, navegación, estilos y 404** (`005-RF-01` a `005-RF-12`, `005-RF-24`, `005-CL-03` a `005-CL-05`)
  - _Archivos:_ `docs/astro.config.mjs`, `docs/src/styles/docs.css`, `BaseLayout.astro`, `DocsLayout.astro`, `SiteHeader.astro`, `SiteNav.astro`, `docs/src/catalog/index.js` (con las cinco entradas mínimas) y `docs/src/pages/404.astro`.
  - _Hecho cuando:_ `npm run docs:build` termina con `0` y el CLI ya no reporta `layout-invalid`, `header-invalid`, `skip-link-invalid`, `theme-boot-missing`, `theme-script-missing` ni `nav-structure-invalid` en las páginas que existen.
- [ ] **T6. Getting started** (`005-RF-09`, `005-RF-13` a `005-RF-15`)
  - _Archivos:_ `docs/src/pages/index.astro` (reescritura) y `docs/src/pages/installation.astro`.
  - _Hecho cuando:_ el comando `005-CHK-06` devuelve exit code `0`.
- [ ] **T7. Datos del catálogo** (`005-RF-16` a `005-RF-20`)
  - _Archivos:_ los cinco `docs/src/catalog/<slug>.js`, migrando a cada ficha el contenido de las secciones `MOD-01` a `MOD-05` y los snippets de la Spec 004.
  - _Hecho cuando:_ cada módulo cumple la sección 3.2 y sus variantes coinciden con `deriveCatalog` (lo comprueba la herramienta en T8).
- [ ] **T8. Plantilla de ficha, ruta dinámica y ficha de alertas** (`005-RF-16` a `005-RF-23`)
  - _Archivos:_ `docs/src/components/CodeBlock.astro`, `docs/src/components/ComponentPage.astro` y `docs/src/pages/components/[slug].astro`.
  - _Hecho cuando:_ los comandos `005-CHK-01` a `005-CHK-04` y `005-CHK-07` a `005-CHK-10` devuelven exit code `0`.
- [ ] **T9. Requisitos no funcionales y no regresión** (`005-RNF-01` a `005-RNF-07`)
  - _Archivos:_ ninguno nuevo. Si algún control falla, se corrige el código o los tests sin relajarlos, y los hallazgos se registran con `seb memory-add`.
  - _Hecho cuando:_ los comandos `005-CHK-11` a `005-CHK-15` y `005-CHK-99` devuelven exit code `0` y `.seb/bin/seb verify navegacion_sitio_docs` reporta el 100 % en `[PASA]`.
