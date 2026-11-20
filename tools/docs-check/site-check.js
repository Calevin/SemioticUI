// Chequeo del sitio de documentacion compilado (Spec 005): funcion pura sobre documentos ya parseados.
// Contrato de codigos de problema: plan de la Spec 005, seccion 3.5.
import { checkSidebarDemo } from './sidebar-demo.js';
import { SPEC_CATALOG, componentUrl, deriveCatalog, packageReferences } from './site-model.js';

const INTRODUCTION = { label: 'Introduction', url: '/' };
const INSTALLATION = { label: 'Installation', url: '/installation/' };
const NOT_FOUND_URL = '404';
const SECTION_ORDER = ['title', 'description', 'preview', 'code', 'variants'];
const CODE_FORMATS = ['html', 'thymeleaf', 'react'];
const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, iframe, [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
const RESOURCE_ATTRIBUTES = [
  ['script', 'src'],
  ['link', 'href'],
  ['img', 'src'],
  ['img', 'srcset'],
  ['source', 'src'],
  ['source', 'srcset'],
  ['iframe', 'src'],
  ['video', 'src'],
  ['video', 'poster'],
  ['audio', 'src'],
  ['embed', 'src'],
  ['object', 'data'],
];
const REMOTE = /^\s*(?:https?:|\/\/)/i;
const REMOTE_IN_CSS = /(?:url\(\s*["']?|@import\s+["'])\s*(?:https?:|\/\/)/i;
const SITE_NAV_SELECTOR = /(?:\.sm-sidebar(?:-menu|-item)?|\[data-doc-nav\])(?![\w-])/;
const HIDING_DECLARATION = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|position\s*:\s*(?:fixed|sticky))\b/i;
const IMPORT_SPECIFIER = /(?:\bimport\s+(?:[^'";]*?\bfrom\s+)?|\bfrom\s+|\brequire\(\s*)["']([^"']+)["']/g;
const URL_IN_TEXT = /https?:\/\/[^\s"'<>`]+/g;
const QUOTE = "'";

const text = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

function accessibleName(element) {
  const label = element.getAttribute('aria-label');
  if (label && label.trim()) return label.trim();
  const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  return ids
    .map((id) => text(element.ownerDocument.getElementById(id)))
    .join(' ')
    .trim();
}

function followsInDocument(first, second) {
  // DOCUMENT_POSITION_FOLLOWING = 4
  return Boolean(first.compareDocumentPosition(second) & 4);
}

/**
 * Normaliza el marcado para comparar snippet y preview: colapsa espacios y los quita junto a las etiquetas.
 */
function normalizeMarkup(html) {
  return html
    .replace(/\s+/g, ' ')
    .replace(/\s*(<[^>]*>)\s*/g, '$1')
    .trim();
}

function serializeSnippet(document, snippet) {
  const container = document.createElement('div');
  container.innerHTML = snippet;
  return container.innerHTML;
}

/**
 * Reglas CSS planas (selector y declaraciones) de una hoja, incluidas las anidadas en @layer, @media o @container.
 */
function cssRules(css) {
  const rules = [];
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.push({ selector: match[1].trim(), declarations: match[2] });
  }
  return rules;
}

function hasPublishedImport(snippet, refs) {
  return [...snippet.matchAll(IMPORT_SPECIFIER)].some((match) => refs.specifiers.has(match[1]));
}

/**
 * Nombre visible y URL esperados de cada pieza del catalogo derivado de DESIGN.md.
 * Las piezas de SPEC_CATALOG usan su nombre fijo; las demas, el titulo de su ficha si existe.
 */
function expectedEntries(catalog, fichasByPiece) {
  return catalog.map((entry) => {
    const spec = SPEC_CATALOG.find((candidate) => candidate.piece === entry.piece);
    const ficha = fichasByPiece.get(entry.piece);
    const name = spec?.name ?? ficha?.name ?? null;
    return { ...entry, spec, name, url: name ? componentUrl(name) : null };
  });
}

function findFichas(pages) {
  const fichas = new Map();
  for (const page of pages) {
    const article = page.document.querySelector('main article.doc-component[data-piece]');
    if (!article) continue;
    const piece = article.getAttribute('data-piece');
    if (!fichas.has(piece)) {
      fichas.set(piece, { page, article, name: text(article.querySelector('[data-doc-section="title"]')) });
    }
  }
  return fichas;
}

// ---------------------------------------------------------------------------
// Reglas comunes a todas las paginas
// ---------------------------------------------------------------------------

function checkLayout(page, add) {
  const { document } = page;
  const layout = [...document.querySelectorAll('.sm-sidebar-layout')].find((candidate) => {
    const [first, second] = candidate.children;
    return (
      first?.matches('nav.sm-sidebar[data-doc-nav]') && accessibleName(first) && second?.matches('main#main-content')
    );
  });
  if (!layout) {
    add('layout-invalid', 'falta .sm-sidebar-layout con nav.sm-sidebar[data-doc-nav] nombrado y main#main-content');
  }
  const headings = [...document.querySelectorAll('h1')];
  const main = document.querySelector('main#main-content');
  if (headings.length !== 1 || !main || !main.contains(headings[0])) {
    add('layout-invalid', `se esperaba exactamente un h1 dentro de main y hay ${headings.length}`);
  }
  return layout ?? null;
}

function checkHeader(page, layout, refs, add) {
  const header = page.document.querySelector('header.doc-header');
  if (!header) {
    add('header-invalid', 'falta header.doc-header');
    return;
  }
  if (layout && !followsInDocument(header, layout)) add('header-invalid', 'la cabecera no precede al layout');
  const tags = [...header.querySelectorAll('.sm-code-tag')];
  if (!tags.some((tag) => text(tag).includes(`V${refs.version}`))) {
    add('header-invalid', `la etiqueta tecnica no muestra V${refs.version}`);
  }
  if (!text(header).includes('SEMIOTIC UI')) add('header-invalid', 'la cabecera no nombra SEMIOTIC UI');
  if (!header.querySelector('button#theme-toggle[type="button"]')) add('header-invalid', 'falta button#theme-toggle');
  if (header.querySelector('h1')) add('header-invalid', 'la cabecera contiene un h1');
}

function checkSkipLink(page, add) {
  const first = page.document.body?.querySelector(FOCUSABLE);
  const valid = first?.matches('a[href="#main-content"]') && text(first) === 'Skip to content';
  if (!valid) add('skip-link-invalid', 'el primer elemento enfocable no es el enlace "Skip to content" a #main-content');
}

function checkThemeBoot(page, bootSource, add) {
  const expected = String(bootSource ?? '').trim();
  const inline = [...page.document.querySelectorAll('head script:not([src])')].filter((script) => {
    const type = (script.getAttribute('type') ?? '').trim().toLowerCase();
    return type === '' || type === 'text/javascript';
  });
  if (!expected || !inline.some((script) => script.textContent.trim() === expected)) {
    add('theme-boot-missing', 'el head no tiene el script clasico de arranque de tema identico a theme-boot.js');
  }
}

function checkThemeScript(page, add) {
  const scripts = page.scripts.join('\n');
  for (const literal of ['sm-docs-theme', 'theme-toggle']) {
    if (!scripts.includes(literal)) add('theme-script-missing', `los scripts de la pagina no contienen ${literal}`);
  }
}

function checkResources(page, add) {
  for (const [tag, attribute] of RESOURCE_ATTRIBUTES) {
    for (const element of page.document.querySelectorAll(`${tag}[${attribute}]`)) {
      const value = element.getAttribute(attribute);
      if (REMOTE.test(value) || value.split(',').some((part) => REMOTE.test(part))) {
        add('remote-resource', `${tag}[${attribute}] remoto: ${value}`);
      }
    }
  }
  if (page.stylesheets.some((css) => REMOTE_IN_CSS.test(css))) add('remote-resource', 'una hoja local referencia un recurso remoto');
}

function checkStylesheets(page, add) {
  const css = page.stylesheets.join('\n');
  if (!css.includes('.sm-sidebar-item')) add('stylesheet-missing', 'las hojas de la pagina no contienen .sm-sidebar-item');
  if (!css.includes('data-sm-theme')) add('stylesheet-missing', 'las hojas de la pagina no contienen los tokens oscuros (data-sm-theme)');
}

function checkLiteralSnippets(page, add) {
  if ([...page.document.querySelectorAll('pre code')].some((code) => code.children.length > 0)) {
    add('snippet-not-literal', 'un pre code contiene elementos en lugar de texto');
  }
}

function checkLinks(page, pageUrls, add) {
  for (const anchor of page.document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href').trim();
    if (/^javascript:/i.test(href)) {
      add('nav-link-invalid', `enlace javascript: ${href}`);
      continue;
    }
    if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
    if (!href.startsWith('/')) {
      add('nav-link-invalid', `enlace interno relativo: ${href}`);
      continue;
    }
    const path = href.split(/[?#]/)[0];
    if (!path.endsWith('/')) add('nav-link-invalid', `enlace interno sin barra final: ${href}`);
    else if (!pageUrls.has(path)) add('nav-link-invalid', `enlace interno a una pagina inexistente: ${href}`);
  }
}

// ---------------------------------------------------------------------------
// Sidebar del sitio
// ---------------------------------------------------------------------------

function menuItems(menu) {
  const label = menu.querySelector(':scope > .sm-sidebar-label');
  const list = menu.querySelector(':scope > ul, :scope > ol');
  const items = list ? [...list.querySelectorAll(':scope > li')] : [];
  return { label, list, items };
}

function checkNav(page, nav, expected, pagesByUrl, add) {
  const menus = [...nav.querySelectorAll(':scope > .sm-sidebar-menu')];
  if (menus.length !== 2) {
    add('nav-structure-invalid', `se esperaban 2 SidebarMenu y hay ${menus.length}`);
    return;
  }
  const [start, components] = menus.map(menuItems);
  for (const menu of [start, components]) {
    if (!menu.label || !menu.label.id || !menu.list || menu.list.getAttribute('aria-labelledby') !== menu.label.id) {
      add('nav-structure-invalid', `la etiqueta "${text(menu.label)}" no esta asociada a su lista`);
    }
  }

  const startLabels = start.items.map(text);
  if (text(start.label) !== 'Getting started' || startLabels.join('|') !== 'Introduction|Installation') {
    add('nav-structure-invalid', `primer menu "${text(start.label)}" con [${startLabels.join(', ')}]`);
  }

  const componentLabels = components.items.map(text);
  const sorted = [...componentLabels].sort((a, b) => a.localeCompare(b, 'en'));
  const known = expected.filter((entry) => entry.name);
  const missingNames = known.filter((entry) => !componentLabels.includes(entry.name)).map((entry) => entry.name);
  if (
    text(components.label) !== 'Components' ||
    componentLabels.length !== expected.length ||
    new Set(componentLabels).size !== componentLabels.length ||
    missingNames.length > 0 ||
    sorted.join('|') !== componentLabels.join('|')
  ) {
    add('nav-structure-invalid', `menu Components con [${componentLabels.join(', ')}]`);
  }
  for (const entry of expected) {
    if (!entry.name || !componentLabels.includes(entry.name)) {
      add('catalog-entry-missing', `la pieza ${entry.piece} no tiene item en Components`);
    }
  }

  // Destinos de cada item segun el esquema de URLs
  const targets = [
    ...start.items.map((li) => ({ li, url: { Introduction: INTRODUCTION.url, Installation: INSTALLATION.url }[text(li)] })),
    ...components.items.map((li) => ({ li, url: componentUrl(text(li)) })),
  ];
  for (const { li, url } of targets) {
    const anchor = li.querySelector(':scope > a.sm-sidebar-item[href]');
    const label = text(li);
    if (!anchor || !url || anchor.getAttribute('href') !== url) {
      add('nav-link-invalid', `el item "${label}" no enlaza a ${url ?? 'una URL del esquema'}`);
      continue;
    }
    if (anchor.hasAttribute('onclick') || /^javascript:/i.test(anchor.getAttribute('href'))) {
      add('nav-link-invalid', `el item "${label}" depende de JavaScript`);
    }
    const destination = pagesByUrl.get(url);
    if (destination && text(destination.document.querySelector('main h1')) !== label) {
      add('nav-link-invalid', `el h1 de ${url} no coincide con el item "${label}"`);
    }
  }

  // Item activo: exactamente el de la pagina actual; ninguno en la 404
  const active = [...nav.querySelectorAll('.sm-sidebar-item[aria-current="page"]')];
  if (page.url === NOT_FOUND_URL) {
    if (active.length > 0) add('nav-active-invalid', 'la pagina 404 marca un item activo');
  } else if (active.length !== 1 || active[0].getAttribute('href') !== page.url) {
    add('nav-active-invalid', `se esperaba un unico item activo con href ${page.url} y hay ${active.length}`);
  }
}

function checkNavVisibility(page, nav, add) {
  for (const element of [nav, ...nav.querySelectorAll('*')]) {
    for (const attribute of ['hidden', 'inert', 'style']) {
      if (element.hasAttribute(attribute)) add('nav-hidden', `un elemento del Sidebar del sitio tiene ${attribute}`);
    }
  }
  for (const css of page.stylesheets) {
    for (const rule of cssRules(css)) {
      if (SITE_NAV_SELECTOR.test(rule.selector) && HIDING_DECLARATION.test(rule.declarations)) {
        add('nav-hidden', `la regla "${rule.selector}" oculta o fija el Sidebar del sitio`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Getting started y 404
// ---------------------------------------------------------------------------

function checkIntroduction(page, add) {
  const main = page.document.querySelector('main');
  const intro = main?.querySelector('p.doc-intro');
  const channels = [...(main?.querySelectorAll('ul.doc-channels > li') ?? [])];
  const problems = [];
  if (text(main?.querySelector('h1')) !== 'Introduction') problems.push('h1 distinto de Introduction');
  if (!intro || !text(intro).includes('Semiotic Standard')) problems.push('p.doc-intro sin "Semiotic Standard"');
  if (channels.length !== 2) problems.push(`ul.doc-channels con ${channels.length} canales`);
  else {
    if (!text(channels[0]).toLowerCase().includes('bundler')) problems.push('el primer canal no menciona bundler');
    if (!text(channels[1]).toLowerCase().includes('script') || !text(channels[1]).includes('CDN')) {
      problems.push('el segundo canal no menciona script y CDN');
    }
  }
  for (const detail of problems) add('intro-content-invalid', detail);
}

function checkInstallation(page, refs, add) {
  const main = page.document.querySelector('main');
  const steps = [...(main?.querySelectorAll('ol.doc-steps > li') ?? [])];
  if (text(main?.querySelector('h1')) !== 'Installation') add('install-content-invalid', 'h1 distinto de Installation');
  if (steps.length === 0) add('install-content-invalid', 'falta ol.doc-steps con pasos');
  steps.forEach((step, index) => {
    const described = [...step.querySelectorAll('p')].some((paragraph) => text(paragraph));
    const snippet = [...step.querySelectorAll('pre code')].some((code) => code.textContent.trim());
    if (!described || !snippet) add('install-content-invalid', `el paso ${index + 1} no tiene descripcion y snippet`);
  });

  const snippets = [...(main?.querySelectorAll('pre code') ?? [])].map((code) => code.textContent);
  const all = snippets.join('\n');
  const name = refs.name;
  // Las sentencias se arman con la comilla aparte para que el control de dependencias no las lea como imports
  const statement = (specifier) => ['import', `${QUOTE}${specifier}${QUOTE};`].join(' ');
  const required = [
    [`npm install ${name}`, 'falta la instalacion desde npm'],
    [statement(name), `falta ${statement(name)}`],
    [statement(`${name}/css`), `falta ${statement(`${name}/css`)}`],
  ];
  for (const [literal, detail] of required) if (!all.includes(literal)) add('install-content-invalid', detail);
  const parsed = page.document.createElement('div');
  parsed.innerHTML = snippets.join('\n');
  const cdnLink = [...parsed.querySelectorAll('link[rel="stylesheet"][href]')].some(
    (link) => REMOTE.test(link.getAttribute('href')) && link.getAttribute('href').includes(`/${name}@`)
  );
  const cdnScript = [...parsed.querySelectorAll('script[src]')].some(
    (script) => REMOTE.test(script.getAttribute('src')) && script.getAttribute('src').includes(`/${name}@`)
  );
  if (!cdnLink) add('install-content-invalid', 'falta la hoja de estilos clasica desde CDN');
  if (!cdnScript) add('install-content-invalid', 'falta el script clasico desde CDN');

  // Solo referencias publicadas por package.json
  for (const snippet of snippets) {
    for (const match of snippet.matchAll(IMPORT_SPECIFIER)) {
      const specifier = match[1];
      if ((specifier === name || specifier.startsWith(`${name}/`)) && !refs.specifiers.has(specifier)) {
        add('install-reference-invalid', `especificador no publicado: ${specifier}`);
      }
    }
    for (const [url] of snippet.matchAll(URL_IN_TEXT)) {
      if (!url.includes(`/${name}@`)) continue;
      const prefix = `/${name}@${refs.version}/`;
      const artifact = url.includes(prefix) ? url.slice(url.indexOf(prefix) + prefix.length) : null;
      if (!artifact || !refs.artifacts.has(artifact)) add('install-reference-invalid', `URL de CDN invalida: ${url}`);
    }
  }
}

function checkNotFound(page, add) {
  if (text(page.document.querySelector('main h1')) !== 'Not found') add('not-found-invalid', 'la 404 no tiene h1 "Not found"');
}

// ---------------------------------------------------------------------------
// Fichas de componente
// ---------------------------------------------------------------------------

function previewSelectors(entry) {
  if (entry.kind === 'element') {
    const tag = entry.piece.replace(/^<|>$/g, '');
    return entry.piece === '<semiotic-alert>' ? [`${tag}[dismissible]`] : [tag];
  }
  const block = entry.piece.slice(1);
  switch (entry.piece) {
    case '.sm-btn':
      return [`.sm-btn:not([class*="sm-btn--"])`, 'button.sm-btn[disabled]'];
    case '.sm-card':
      return [`.sm-card:not([class*="sm-card--"])`];
    case '.sm-sidebar':
      return [
        '.sm-sidebar-layout > nav.sm-sidebar[aria-label]:first-child',
        'nav.sm-sidebar .sm-sidebar-menu ~ .sm-sidebar-menu',
        'nav.sm-sidebar .sm-sidebar-item[aria-current="page"]',
        'nav.sm-sidebar .sm-sidebar-item[aria-disabled="true"]:not([href])',
      ];
    default:
      return [`.${block}`];
  }
}

function variantSelector(entry, id) {
  if (entry.kind === 'element') return `${entry.piece.replace(/^<|>$/g, '')}[variant="${id}"]`;
  return `.${entry.piece.slice(1)}--${id}`;
}

function snippetOf(container) {
  const code = container?.querySelector('pre code');
  return code ? code.textContent : '';
}

function compareSnippet(document, preview, snippet, label, add) {
  if (!preview) return;
  if (normalizeMarkup(serializeSnippet(document, snippet)) !== normalizeMarkup(preview.innerHTML)) {
    add('snippet-mismatch', `el snippet HTML de ${label} no coincide con su preview`);
  }
}

function checkFicha(page, ficha, entry, refs, add) {
  const { document } = page;
  const { article } = ficha;
  const main = document.querySelector('main');

  // Estructura y orden de secciones
  const order = [...article.querySelectorAll('[data-doc-section]')].map((section) => section.getAttribute('data-doc-section'));
  const base = SECTION_ORDER.slice(0, 4);
  const validOrder =
    order.join('|') === base.join('|') || order.join('|') === SECTION_ORDER.join('|');
  if (!validOrder) add('ficha-structure-invalid', `secciones en orden [${order.join(', ')}]`);
  const title = article.querySelector('[data-doc-section="title"]');
  if (!title?.matches('h1') || (entry.name && text(title) !== entry.name)) {
    add('ficha-structure-invalid', `el titulo "${text(title)}" no es el nombre ${entry.name}`);
  }
  const description = article.querySelector('[data-doc-section="description"]');
  for (const part of ['what', 'when']) {
    if (!text(description?.querySelector(`[data-doc-part="${part}"]`))) {
      add('ficha-structure-invalid', `falta la descripcion "${part}"`);
    }
  }

  // Preview principal
  const previewSection = article.querySelector('[data-doc-section="preview"]');
  const preview = previewSection?.querySelector('.doc-preview');
  for (const selector of previewSelectors(entry)) {
    if (!preview?.querySelector(selector)) add('preview-invalid', `la preview principal no tiene ${selector}`);
  }

  // Codigo de la preview principal en los tres formatos
  const codeSection = article.querySelector('[data-doc-section="code"]');
  const figures = Object.fromEntries(
    CODE_FORMATS.map((format) => [format, codeSection?.querySelector(`figure[data-format="${format}"]`) ?? null])
  );
  for (const format of CODE_FORMATS) {
    if (!snippetOf(figures[format]).trim()) add('code-format-missing', `falta el snippet ${format}`);
  }
  if (figures.thymeleaf && !snippetOf(figures.thymeleaf).includes('th:')) {
    add('code-format-missing', 'el snippet Thymeleaf no usa th:');
  }
  if (figures.react && !hasPublishedImport(snippetOf(figures.react), refs)) {
    add('code-format-missing', 'el snippet React no importa un especificador publicado');
  }
  if (figures.html) compareSnippet(document, preview, snippetOf(figures.html), 'la preview principal', add);

  // Variantes derivadas de DESIGN.md
  const variantFigures = [...article.querySelectorAll('figure[data-variant]')];
  if (entry.variants.length === 0) {
    const headings = [...(main?.querySelectorAll('h1, h2, h3, h4, h5, h6') ?? [])].filter((heading) => text(heading) === 'Variants');
    if (main?.querySelector('[data-doc-section="variants"]') || headings.length > 0 || variantFigures.length > 0) {
      add('variant-section-empty', `${entry.piece} no tiene variantes y su ficha muestra la seccion`);
    }
  }
  for (const id of entry.variants) {
    const figure = variantFigures.find((candidate) => candidate.getAttribute('data-variant') === id);
    const variantPreview = figure?.querySelector('.doc-preview');
    const selector = variantSelector(entry, id);
    if (!figure || !variantPreview?.querySelector(selector) || !snippetOf(figure).trim()) {
      add('variant-missing', `falta la variante ${id} con preview ${selector} y snippet`);
      continue;
    }
    compareSnippet(document, variantPreview, snippetOf(figure), `la variante ${id}`, add);
  }
  for (const figure of variantFigures) {
    if (!entry.variants.includes(figure.getAttribute('data-variant'))) {
      add('variant-unexpected', `variante no derivada de DESIGN.md: ${figure.getAttribute('data-variant')}`);
    }
  }

  // Comportamiento de las alertas
  if (entry.piece === '<semiotic-alert>') {
    const scripts = page.scripts.join('\n');
    if (!main?.querySelector('.doc-preview semiotic-alert[dismissible]')) {
      add('alert-behavior-missing', 'ninguna preview tiene una alerta dismissible');
    }
    for (const literal of ['customElements', 'semiotic-alert']) {
      if (!scripts.includes(literal)) add('alert-behavior-missing', `los scripts de la pagina no contienen ${literal}`);
    }
    if (!document.querySelector('button#restore-alerts')) add('alert-console-missing', 'falta button#restore-alerts');
    if (!document.querySelector('#event-log[aria-live]')) add('alert-console-missing', 'falta #event-log con aria-live');
    for (const literal of ['restore-alerts', 'event-log', 'sm-dismiss', 'sm-show']) {
      if (!scripts.includes(literal)) add('alert-console-missing', `los scripts de la pagina no contienen ${literal}`);
    }
  }

  // Ficha del Sidebar: reutiliza el chequeo de la demo de la Spec 004 sobre el main de la ficha
  if (entry.piece === '.sm-sidebar' && main) {
    const isolated = document.implementation.createHTMLDocument('sidebar-ficha');
    isolated.body.innerHTML = main.outerHTML;
    const codes = [...new Set(checkSidebarDemo(isolated, page.stylesheets).map((problem) => problem.code))];
    if (codes.length > 0) add('sidebar-ficha-invalid', `checkSidebarDemo: ${codes.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

/**
 * Revisa el sitio compilado y devuelve la lista de problemas [{ code, url, detail }]; lista vacia = sitio valido.
 *   site:    { pages: Array<{ url, document, stylesheets: string[], scripts: string[] }> }
 *   context: { design: string, pkg: object, bootSource: string }
 */
export function checkDocsSite(site, context) {
  const problems = [];
  const pages = site?.pages ?? [];
  const catalog = deriveCatalog(context?.design ?? '');
  const refs = packageReferences(context?.pkg ?? {});
  const pagesByUrl = new Map(pages.map((page) => [page.url, page]));
  const pageUrls = new Set(pages.map((page) => page.url));
  const fichas = findFichas(pages);
  const expected = expectedEntries(catalog, fichas);
  const report = (url) => (code, detail) => problems.push({ code, url, detail });

  if (catalog.length === 0) report('-')('catalog-entry-missing', 'el inventario de DESIGN.md no declara piezas');

  // Paginas esperadas e inesperadas
  const required = [INTRODUCTION.url, INSTALLATION.url, NOT_FOUND_URL];
  for (const entry of expected) if (entry.spec) required.push(componentUrl(entry.spec.name));
  for (const url of required) if (!pageUrls.has(url)) report(url)('page-missing', `falta la pagina ${url}`);
  const allowed = new Set([INTRODUCTION.url, INSTALLATION.url, NOT_FOUND_URL]);
  for (const entry of expected) if (entry.url) allowed.add(entry.url);
  for (const [piece, ficha] of fichas) {
    if (catalog.some((entry) => entry.piece === piece)) allowed.add(ficha.page.url);
  }
  for (const page of pages) if (!allowed.has(page.url)) report(page.url)('page-unexpected', `pagina fuera del esquema: ${page.url}`);

  // Catalogo: nombres fijados por la spec, URLs y fichas presentes
  for (const entry of expected) {
    const ficha = fichas.get(entry.piece);
    if (!ficha) {
      report(entry.url ?? '-')('catalog-entry-missing', `la pieza ${entry.piece} no tiene ficha article[data-piece]`);
      continue;
    }
    if (entry.spec && ficha.name !== entry.spec.name) {
      report(ficha.page.url)('catalog-name-invalid', `la ficha de ${entry.piece} se llama "${ficha.name}" y no "${entry.spec.name}"`);
    }
    if (ficha.page.url !== componentUrl(ficha.name)) {
      report(ficha.page.url)('catalog-name-invalid', `la ficha "${ficha.name}" no vive en ${componentUrl(ficha.name)}`);
    }
  }

  // Titulos de documento distintos entre paginas
  const titles = new Map();
  for (const page of pages) {
    const title = text(page.document.querySelector('title'));
    titles.set(title, (titles.get(title) ?? 0) + 1);
  }

  for (const page of pages) {
    const add = report(page.url);
    const layout = checkLayout(page, add);
    checkHeader(page, layout, refs, add);
    checkSkipLink(page, add);
    const title = text(page.document.querySelector('title'));
    const pageName = text(page.document.querySelector('main h1'));
    if (!title || !pageName || !title.includes(pageName) || titles.get(title) > 1) {
      add('title-invalid', `titulo "${title}" vacio, repetido o sin el nombre "${pageName}"`);
    }
    checkThemeBoot(page, context?.bootSource, add);
    checkThemeScript(page, add);
    checkResources(page, add);
    checkStylesheets(page, add);
    checkLiteralSnippets(page, add);
    checkLinks(page, pageUrls, add);

    const nav = page.document.querySelector('nav.sm-sidebar[data-doc-nav]');
    if (nav) {
      checkNav(page, nav, expected, pagesByUrl, add);
      checkNavVisibility(page, nav, add);
    }

    if (page.url === INTRODUCTION.url) checkIntroduction(page, add);
    if (page.url === INSTALLATION.url) checkInstallation(page, refs, add);
    if (page.url === NOT_FOUND_URL) checkNotFound(page, add);

    const article = page.document.querySelector('main article.doc-component[data-piece]');
    const entry = article ? expected.find((candidate) => candidate.piece === article.getAttribute('data-piece')) : null;
    if (article && entry) checkFicha(page, { article }, entry, refs, add);
    else if (page.url.startsWith('/components/')) {
      add('ficha-structure-invalid', 'la pagina de componente no tiene una ficha article.doc-component[data-piece] del inventario');
    }
  }
  return problems;
}
