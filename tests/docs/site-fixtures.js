// Generador de un sitio de documentacion fixture valido en memoria (Spec 005, plan seccion 3.6).
// Cada opcion rompe una regla concreta; los tests afirman el codigo de problema que corresponde.
import { Window } from 'happy-dom';
import { checkDocsSite } from '../../tools/docs-check/site-check.js';
import { componentUrl } from '../../tools/docs-check/site-model.js';

// La carpeta de artefactos se arma por partes: ningun archivo de tests puede contener esa ruta literal
const DIST = 'dist';
const Q = "'";

export const FIXTURE_PACKAGE = {
  name: 'semiotic-ui',
  version: '1.2.3',
  main: `./${DIST}/semiotic-ui.umd.js`,
  module: `./${DIST}/semiotic-ui.es.js`,
  exports: {
    '.': { import: `./${DIST}/semiotic-ui.es.js`, require: `./${DIST}/semiotic-ui.umd.js` },
    './css': `./${DIST}/semiotic-ui.css`,
  },
};

export const FIXTURE_DESIGN = [
  '# Fixture',
  '',
  '<!-- design-check:inventory -->',
  '',
  '| Pieza | Tipo | Estado |',
  '| :--- | :--- | :--- |',
  '| `.sm-code-tag` | Clase CSS | Disponible |',
  '| `.sm-btn` | Clase CSS | Disponible |',
  '| `.sm-card` | Clase CSS | Disponible |',
  '| `.sm-sidebar` | Clase CSS | Disponible |',
  '| `<semiotic-alert>` | Web Component | Disponible |',
  '| Reset (`body`) | CSS global en capa | Disponible |',
  '',
  '### Button',
  '',
  '| Clase | Uso |',
  '| :--- | :--- |',
  '| `.sm-btn` | Base |',
  '| `.sm-btn--primary` | Primary |',
  '| `.sm-btn--ghost` | Ghost |',
  '',
  '### Card',
  '',
  '| Clase | Uso |',
  '| :--- | :--- |',
  '| `.sm-card` | Base |',
  '| `.sm-card-header` | Header |',
  '| `.sm-card--info` | Info |',
  '',
  '### Alert',
  '',
  '| Custom Element | Uso |',
  '| :--- | :--- |',
  '| `<semiotic-alert>` | Alert |',
  '',
  '| Atributo | Propiedad | Tipo | Defecto |',
  '| :--- | :--- | :--- | :--- |',
  '| `variant` | `variant` | `info` \\| `warning` | `info` |',
  '| `dismissible` | `dismissible` | booleano | ausente |',
  '',
  '### Sidebar',
  '',
  '| Clase | Uso |',
  '| :--- | :--- |',
  '| `.sm-sidebar` | Nav |',
  '| `.sm-sidebar-item` | Item |',
  '',
  '<!-- /design-check:inventory -->',
  '',
].join('\n');

export const FIXTURE_BOOT =
  "try { if (window.localStorage.getItem('sm-docs-theme') === 'dark') document.documentElement.setAttribute('data-sm-theme', 'dark'); } catch (error) {}";

export const FIXTURE_STYLESHEET =
  ".sm-sidebar-item{display:block}:root[data-sm-theme='dark']{color-scheme:dark}.doc-main{min-width:0}";

export const FIXTURE_SCRIPT = [
  "const key='sm-docs-theme';document.getElementById('theme-toggle');",
  "customElements.define('semiotic-alert',class extends HTMLElement{});",
  "document.getElementById('restore-alerts');document.getElementById('event-log');",
  "addEventListener('sm-dismiss',()=>{});addEventListener('sm-show',()=>{});",
].join('');

const CDN = 'https://cdn.jsdelivr.net/npm/semiotic-ui@1.2.3';

const SIDEBAR_DEMO =
  '<div class="sm-sidebar-layout"><nav class="sm-sidebar" aria-label="Ship systems">' +
  '<div class="sm-sidebar-menu"><h3 class="sm-sidebar-label" id="demo-ops">Operations</h3>' +
  '<ul aria-labelledby="demo-ops"><li><a class="sm-sidebar-item" href="#a" aria-current="page">Console</a></li></ul></div>' +
  '<div class="sm-sidebar-menu"><h3 class="sm-sidebar-label" id="demo-maint">Maintenance</h3>' +
  '<ul aria-labelledby="demo-maint"><li><a class="sm-sidebar-item" aria-disabled="true">Reactor</a></li></ul></div>' +
  '</nav><div class="sm-card"><div class="sm-card-body"><p>Main</p></div></div></div>';

const SIDEBAR_THYMELEAF =
  '<nav class="sm-sidebar" aria-label="Ship systems"><ul th:attr="aria-labelledby=${group.id}">' +
  '<a class="sm-sidebar-item" th:href="@{/x}" th:attr="aria-current=${page}">A</a>' +
  '<a class="sm-sidebar-item" aria-disabled="true">B</a></ul></nav>';

const SIDEBAR_REACT =
  `import ${Q}semiotic-ui${Q};\n` +
  '<nav className="sm-sidebar" aria-label="Ship systems"><ul aria-labelledby={id}>' +
  '<a className="sm-sidebar-item" aria-current="page">A</a><a className="sm-sidebar-item" aria-disabled="true">B</a></ul></nav>';

const DEFAULT_THYMELEAF = '<button class="sm-btn" type="button" th:text="#{action}">Run</button>';
const DEFAULT_REACT = `import ${Q}semiotic-ui${Q};\nexport const Demo = () => <button className="sm-btn">Run</button>;`;

// Fichas validas del sitio fixture, alineadas con FIXTURE_DESIGN
export function defaultFichas() {
  return [
    {
      piece: '.sm-btn',
      name: 'Buttons',
      preview:
        '<button class="sm-btn" type="button">Base</button> <button class="sm-btn" type="button" disabled>Off</button>',
      variants: [
        { id: 'primary', html: '<button class="sm-btn sm-btn--primary" type="button">Primary</button>' },
        { id: 'ghost', html: '<button class="sm-btn sm-btn--ghost" type="button">Ghost</button>' },
      ],
    },
    {
      piece: '.sm-card',
      name: 'Cards',
      preview: '<article class="sm-card">\n  <div class="sm-card-body"><p>Body</p></div>\n</article>',
      variants: [{ id: 'info', html: '<article class="sm-card sm-card--info"><div class="sm-card-body"><p>Info</p></div></article>' }],
    },
    { piece: '.sm-code-tag', name: 'Code Tags', preview: '<span class="sm-code-tag">SEC-04</span>', variants: [] },
    {
      piece: '<semiotic-alert>',
      name: 'Interactive Alerts',
      preview: '<semiotic-alert variant="warning" code="TEMP-404" heading="Thermal" dismissible>Body</semiotic-alert>',
      variants: [
        { id: 'info', html: '<semiotic-alert variant="info" code="NAV-09">Info</semiotic-alert>' },
        { id: 'warning', html: '<semiotic-alert variant="warning" code="WARN-12">Warn</semiotic-alert>' },
      ],
      controls: true,
    },
    {
      piece: '.sm-sidebar',
      name: 'Sidebar',
      preview: SIDEBAR_DEMO,
      thymeleaf: SIDEBAR_THYMELEAF,
      react: SIDEBAR_REACT,
      variants: [],
    },
  ];
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function codeBlock(text) {
  return `<pre class="doc-pre"><code>${escapeHtml(text)}</code></pre>`;
}

function navHtml(currentUrl, fichas) {
  const item = (label, href) =>
    `<li><a class="sm-sidebar-item" href="${href}"${href === currentUrl ? ' aria-current="page"' : ''}>${label}</a></li>`;
  const components = [...fichas]
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map((ficha) => item(ficha.name, componentUrl(ficha.name)))
    .join('');
  return (
    '<nav class="sm-sidebar" aria-label="Documentation" data-doc-nav>' +
    '<div class="sm-sidebar-menu"><h2 class="sm-sidebar-label" id="nav-getting-started">Getting started</h2>' +
    `<ul aria-labelledby="nav-getting-started">${item('Introduction', '/')}${item('Installation', '/installation/')}</ul></div>` +
    '<div class="sm-sidebar-menu"><h2 class="sm-sidebar-label" id="nav-components">Components</h2>' +
    `<ul aria-labelledby="nav-components">${components}</ul></div>` +
    '</nav>'
  );
}

function pageHtml(url, pageName, mainHtml, fichas) {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    `<title>${pageName} // Semiotic UI</title><script>${FIXTURE_BOOT}</script>` +
    '<link rel="stylesheet" href="/_astro/site.css"></head><body>' +
    '<a class="doc-skip-link" href="#main-content">Skip to content</a>' +
    '<header class="doc-header"><span class="sm-code-tag">DOC-00 // V1.2.3</span><p class="doc-brand">SEMIOTIC UI SYSTEM</p>' +
    '<button id="theme-toggle" class="sm-btn" type="button">Toggle Theme</button></header>' +
    `<div class="sm-sidebar-layout doc-layout">${navHtml(url, fichas)}` +
    `<main id="main-content" tabindex="-1" class="doc-main">${mainHtml}</main></div>` +
    '<script type="module" src="/_astro/page.js"></script></body></html>'
  );
}

const INTRO_MAIN =
  '<h1>Introduction</h1><p class="doc-intro">A UI kit inspired by the Semiotic Standard.</p>' +
  '<ul class="doc-channels"><li>Applications with a bundler.</li><li>Classic script tags from a CDN or your server.</li></ul>' +
  '<p>Continue with <a href="/installation/">Installation</a>.</p>';

const INSTALL_MAIN =
  '<h1>Installation</h1><ol class="doc-steps">' +
  `<li><p>Install the package.</p>${codeBlock('npm install semiotic-ui')}</li>` +
  `<li><p>Import it from a bundler.</p>${codeBlock(`import ${Q}semiotic-ui${Q};\nimport ${Q}semiotic-ui/css${Q};`)}</li>` +
  `<li><p>Or load it from a CDN.</p>${codeBlock(
    `<link rel="stylesheet" href="${CDN}/${DIST}/semiotic-ui.css">\n<script src="${CDN}/${DIST}/semiotic-ui.umd.js"></script>`
  )}</li></ol>`;

const NOT_FOUND_MAIN = '<h1>Not found</h1><p>Go back to <a href="/">Introduction</a>.</p>';

export function fichaMain(ficha) {
  const variants = ficha.variants.length
    ? '<section data-doc-section="variants"><h2>Variants</h2>' +
      ficha.variants
        .map(
          (variant) =>
            `<figure class="doc-variant" data-variant="${variant.id}"><div class="doc-preview">${variant.html}</div>${codeBlock(variant.html)}</figure>`
        )
        .join('') +
      '</section>'
    : '';
  const controls = ficha.controls
    ? '<div class="doc-controls"><button id="restore-alerts" type="button">Restore</button>' +
      '<span id="event-log" aria-live="polite">EVENT LOG: IDLE</span></div>'
    : '';
  return (
    `<article class="doc-component" data-piece="${escapeHtml(ficha.piece)}">` +
    `<h1 data-doc-section="title">${ficha.name}</h1>` +
    '<div data-doc-section="description"><p data-doc-part="what">What it is.</p><p data-doc-part="when">When to use it.</p></div>' +
    `<section data-doc-section="preview"><h2>Preview</h2><div class="doc-preview">${ficha.preview}</div>${controls}</section>` +
    '<section data-doc-section="code"><h2>Code</h2>' +
    `<figure data-format="html">${codeBlock(ficha.preview)}</figure>` +
    `<figure data-format="thymeleaf">${codeBlock(ficha.thymeleaf ?? DEFAULT_THYMELEAF)}</figure>` +
    `<figure data-format="react">${codeBlock(ficha.react ?? DEFAULT_REACT)}</figure>` +
    `</section>${variants}</article>`
  );
}

// Ventana propia sin carga de recursos ni ejecucion de scripts, igual que el CLI
const PARSER_WINDOW = new Window({
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});

function parse(html) {
  return new PARSER_WINDOW.DOMParser().parseFromString(html, 'text/html');
}

/**
 * Arma el sitio fixture. Opciones:
 *  - fichas(list): transforma la lista de fichas (nombres, variantes, previews)
 *  - mutate: { [url]: (html) => html } reescribe el HTML de una pagina
 *  - drop: urls a eliminar; extra: [{ url, html }] paginas adicionales
 *  - stylesheets / scripts: { [url]: string[] } reemplazan los recursos de una pagina
 *  - design, pkg, boot: reemplazan el contexto
 */
export function buildSite(options = {}) {
  const fichas = (options.fichas ?? ((list) => list))(defaultFichas());
  const entries = [
    { url: '/', html: pageHtml('/', 'Introduction', INTRO_MAIN, fichas) },
    { url: '/installation/', html: pageHtml('/installation/', 'Installation', INSTALL_MAIN, fichas) },
    { url: '404', html: pageHtml('404', 'Not found', NOT_FOUND_MAIN, fichas) },
    ...fichas.map((ficha) => {
      const url = componentUrl(ficha.name);
      return { url, html: pageHtml(url, ficha.name, fichaMain(ficha), fichas) };
    }),
    ...(options.extra ?? []),
  ].filter((entry) => !(options.drop ?? []).includes(entry.url));
  const pages = entries.map(({ url, html }) => {
    const finalHtml = options.mutate?.[url] ? options.mutate[url](html) : html;
    return {
      url,
      document: parse(finalHtml),
      stylesheets: options.stylesheets?.[url] ?? [FIXTURE_STYLESHEET],
      scripts: options.scripts?.[url] ?? [FIXTURE_BOOT, FIXTURE_SCRIPT],
    };
  });
  const context = {
    design: options.design ?? FIXTURE_DESIGN,
    pkg: options.pkg ?? FIXTURE_PACKAGE,
    bootSource: options.boot ?? FIXTURE_BOOT,
  };
  return { site: { pages }, context };
}

/**
 * Codigos de problema (sin repetir y ordenados) del sitio fixture con las opciones dadas.
 */
export function codesFor(options = {}) {
  const { site, context } = buildSite(options);
  return [...new Set(checkDocsSite(site, context).map((problem) => problem.code))].sort();
}

/**
 * Problemas completos, para depurar un fixture que no da el resultado esperado.
 */
export function problemsFor(options = {}) {
  const { site, context } = buildSite(options);
  return checkDocsSite(site, context);
}
