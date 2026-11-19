// Modelo CSS puro para la comprobacion de coherencia de DESIGN.md (Spec 002): sin I/O ni dependencias

const DARK_THEME_SELECTOR = ":root[data-sm-theme='dark']";
const TOKEN_DECLARATION = /(--sm-[a-z0-9-]+)\s*:\s*([^;]+);/g;
const CLASS_IN_SELECTOR = /\.(sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?)/g;

/**
 * Elimina los comentarios de bloque de una hoja de estilos.
 */
export function stripCssComments(css) {
  return String(css ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Recorre los bloques mas internos de la hoja y devuelve su preludio y su cuerpo.
 * El preludio descarta sentencias previas terminadas en punto y coma (por ejemplo @layer a, b;).
 */
function listInnermostBlocks(css) {
  const blocks = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    const raw = match[1];
    const prelude = raw.slice(raw.lastIndexOf(';') + 1).trim();
    blocks.push({ prelude, body: match[2] });
  }
  return blocks;
}

function normalizeSelector(selector) {
  return selector.trim().replace(/\s+/g, ' ').replace(/"/g, "'");
}

function readTokenDeclarations(body, target) {
  // Se agrega un punto y coma final para aceptar la ultima declaracion sin terminador
  const text = `${body};`;
  for (const match of text.matchAll(TOKEN_DECLARATION)) {
    target.set(match[1], match[2].trim());
  }
}

/**
 * Extrae los tokens del tema claro (:root) y del tema oscuro de la hoja de tokens.
 */
export function parseTokenSheet(css) {
  const light = new Map();
  const dark = new Map();
  for (const { prelude, body } of listInnermostBlocks(stripCssComments(css))) {
    const selectors = prelude.split(',').map(normalizeSelector);
    if (selectors.length === 1 && selectors[0] === ':root') {
      readTokenDeclarations(body, light);
    } else if (selectors.includes(DARK_THEME_SELECTOR)) {
      readTokenDeclarations(body, dark);
    }
  }
  return { light, dark };
}

/**
 * Devuelve el conjunto de clases sm-* definidas en los selectores de las hojas publicas (sin el punto).
 */
export function collectDefinedClasses(stylesheets) {
  const classes = new Set();
  for (const sheet of stylesheets ?? []) {
    for (const { prelude } of listInnermostBlocks(stripCssComments(sheet.css))) {
      for (const match of prelude.matchAll(CLASS_IN_SELECTOR)) {
        classes.add(match[1]);
      }
    }
  }
  return classes;
}
