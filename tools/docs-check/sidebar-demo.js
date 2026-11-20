// Chequeo de la demo del Sidebar en el sitio de documentacion (Spec 004): funcion pura sobre un Document

const ITEM = '.sm-sidebar-item';

function accessibleName(element) {
  const label = element.getAttribute('aria-label');
  if (label && label.trim()) return label.trim();
  const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
  const owner = element.ownerDocument;
  return ids.map((id) => owner.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim();
}

/**
 * Revisa un marcado de Sidebar (demo en vivo o snippet parseado) y agrega los codigos de problema.
 */
function checkMarkup(root, add) {
  const layouts = [...root.querySelectorAll('.sm-sidebar-layout')];
  const nav = layouts
    .map((layout) => layout.firstElementChild)
    .find((child) => child && child.matches('nav.sm-sidebar') && accessibleName(child));
  if (!nav) {
    add('demo-markup-invalid', 'falta un nav.sm-sidebar con nombre accesible como primer hijo de .sm-sidebar-layout');
    return;
  }
  const menus = [...nav.querySelectorAll('.sm-sidebar-menu')];
  if (menus.length < 2) add('demo-markup-invalid', `se esperaban al menos 2 .sm-sidebar-menu y hay ${menus.length}`);
  if (!nav.querySelector(`${ITEM}[aria-current="page"]`)) add('demo-markup-invalid', 'falta un item con aria-current="page"');
  const disabled = [...nav.querySelectorAll(`${ITEM}[aria-disabled="true"]`)];
  if (disabled.length === 0) add('demo-markup-invalid', 'falta un item con aria-disabled="true"');
  if (disabled.some((item) => item.hasAttribute('href'))) add('demo-markup-invalid', 'un item deshabilitado conserva href');
  for (const menu of menus) {
    const label = menu.querySelector('.sm-sidebar-label');
    if (!label) continue;
    const list = menu.querySelector('ul, ol');
    if (!label.id || !list || list.getAttribute('aria-labelledby') !== label.id) {
      add('label-not-associated', `la etiqueta "${label.textContent.trim()}" no nombra a su lista`);
    }
  }
}

function classifySnippet(text) {
  if (text.includes('th:')) return 'thymeleaf';
  if (text.includes('className=')) return 'react';
  if (text.includes('class="sm-sidebar')) return 'html';
  return null;
}

const FRAMEWORK_ATTRIBUTES = ['aria-label', 'aria-labelledby', 'aria-disabled="true"', 'aria-current'];

/**
 * Devuelve la lista de problemas de la pagina: [{ code, detail }]. Lista vacia = demo valida.
 * stylesheets: textos de las hojas enlazadas por la pagina.
 */
export function checkSidebarDemo(document, stylesheets = []) {
  const problems = [];
  const add = (code, detail) => problems.push({ code, detail });

  checkMarkup(document, add);

  // Un snippet renderizado como marcado no muestra sus clases en textContent: se detecta tambien por descendientes
  const snippets = [...document.querySelectorAll('pre code')].filter(
    (code) => code.textContent.includes('sm-sidebar') || code.querySelector('[class*="sm-sidebar"]')
  );
  for (const code of snippets) {
    if (code.children.length > 0) add('snippet-not-literal', 'un snippet del Sidebar contiene elementos en lugar de texto');
  }
  const byKind = new Map();
  for (const code of snippets) {
    const kind = classifySnippet(code.textContent);
    if (kind && !byKind.has(kind)) byKind.set(kind, code.textContent);
  }
  for (const kind of ['html', 'thymeleaf', 'react']) {
    if (!byKind.has(kind)) add('snippet-missing', `falta el snippet ${kind} del Sidebar`);
  }

  if (byKind.has('html')) {
    const parsed = document.implementation.createHTMLDocument('snippet');
    parsed.body.innerHTML = byKind.get('html');
    const nested = [];
    checkMarkup(parsed, (code, detail) => nested.push(`${code}: ${detail}`));
    for (const detail of nested) add('a11y-markup-invalid', `snippet html: ${detail}`);
  }
  for (const kind of ['thymeleaf', 'react']) {
    if (!byKind.has(kind)) continue;
    for (const attribute of FRAMEWORK_ATTRIBUTES) {
      if (!byKind.get(kind).includes(attribute)) add('a11y-markup-invalid', `snippet ${kind} sin ${attribute}`);
    }
  }

  const inline = [...document.querySelectorAll('style')].map((style) => style.textContent);
  if (![...stylesheets, ...inline].some((css) => css.includes(ITEM))) {
    add('stylesheet-missing', 'ninguna hoja de la pagina contiene .sm-sidebar-item');
  }
  return problems;
}
