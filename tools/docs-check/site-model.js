// Modelo del sitio de documentacion (Spec 005): catalogo esperado, URLs y referencias publicadas del paquete.
// Funciones puras sin I/O; el catalogo se deriva del inventario de DESIGN.md y no de los datos del sitio.
import { findRegions, isInsideRegion, parseTables, readCodeSpans } from '../design-doc/markdown-model.js';

// Nombres visibles y URLs fijados por la spec (005, seccion 4). Se aplican solo por inclusion:
// una pieza nueva del inventario exige su ficha sin romper esta tabla.
export const SPEC_CATALOG = [
  { piece: '.sm-btn', name: 'Buttons', slug: 'buttons' },
  { piece: '.sm-card', name: 'Cards', slug: 'cards' },
  { piece: '.sm-code-tag', name: 'Code Tags', slug: 'code-tags' },
  { piece: '<semiotic-alert>', name: 'Interactive Alerts', slug: 'interactive-alerts' },
  { piece: '.sm-sidebar', name: 'Sidebar', slug: 'sidebar' },
];

// Tipos de la tabla Pieza | Tipo | Estado que generan ficha; el reset global queda fuera por su tipo
const PIECE_KINDS = { 'Clase CSS': 'class', 'Web Component': 'element' };

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstSpans(row) {
  return readCodeSpans(row.cells[0] ?? '').spans;
}

function classVariants(piece, tables) {
  const pattern = new RegExp(`^${escapeRegExp(piece)}--([a-z0-9-]+)$`);
  const variants = [];
  for (const table of tables) {
    for (const row of table.rows) {
      for (const span of firstSpans(row)) {
        const match = span.match(pattern);
        if (match && !variants.includes(match[1])) variants.push(match[1]);
      }
    }
  }
  return variants;
}

function elementVariants(piece, tables) {
  const owner = tables.find(
    (table) => table.headers[0] === 'Custom Element' && table.rows.some((row) => firstSpans(row).includes(piece))
  );
  if (!owner) return [];
  const sameHeading = (table) => (table.heading?.line ?? null) === (owner.heading?.line ?? null);
  const attributes = tables.find((table) => sameHeading(table) && table.headers[0] === 'Atributo');
  if (!attributes) return [];
  const typeColumn = attributes.headers.indexOf('Tipo');
  const row = attributes.rows.find((candidate) => firstSpans(candidate).includes('variant'));
  if (typeColumn < 0 || !row) return [];
  return [...new Set(readCodeSpans(row.cells[typeColumn] ?? '').spans)];
}

/**
 * Deriva del inventario de DESIGN.md las piezas que necesitan ficha y sus variantes.
 * Devuelve [{ piece, kind: 'class' | 'element', variants: string[] }]; sin inventario, lista vacia.
 */
export function deriveCatalog(designMarkdown) {
  const region = findRegions(designMarkdown).inventory;
  if (!region) return [];
  const tables = parseTables(designMarkdown).filter((table) => isInsideRegion(table.line, region));
  const pieces = [];
  for (const table of tables) {
    if (table.headers[0] !== 'Pieza' || table.headers[1] !== 'Tipo') continue;
    for (const row of table.rows) {
      const kind = PIECE_KINDS[(row.cells[1] ?? '').trim()];
      const [piece] = firstSpans(row);
      if (!kind || !piece || pieces.some((entry) => entry.piece === piece)) continue;
      const variants = kind === 'class' ? classVariants(piece, tables) : elementVariants(piece, tables);
      pieces.push({ piece, kind, variants });
    }
  }
  return pieces;
}

/**
 * Convierte un nombre visible en el segmento de URL: 'Interactive Alerts' -> 'interactive-alerts'.
 */
export function kebabCase(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * URL de la ficha de un componente segun el esquema de la spec.
 */
export function componentUrl(name) {
  return `/components/${kebabCase(name)}/`;
}

function collectTargets(value, targets) {
  if (typeof value === 'string') targets.add(value.replace(/^\.\//, ''));
  else if (value && typeof value === 'object') for (const nested of Object.values(value)) collectTargets(nested, targets);
}

/**
 * Referencias que el paquete publica: especificadores de importacion y artefactos servibles por CDN.
 */
export function packageReferences(pkg) {
  const name = pkg?.name ?? '';
  const version = pkg?.version ?? '';
  const exportsField = pkg?.exports ?? {};
  const specifiers = new Set();
  const artifacts = new Set();
  const entries = typeof exportsField === 'string' ? { '.': exportsField } : exportsField;
  for (const [key, target] of Object.entries(entries)) {
    specifiers.add(key === '.' ? name : `${name}${key.replace(/^\./, '')}`);
    collectTargets(target, artifacts);
  }
  for (const field of ['main', 'module', 'style']) collectTargets(pkg?.[field], artifacts);
  return { name, version, specifiers, artifacts };
}

/**
 * URL publica de un HTML compilado a partir de su ruta relativa al directorio del sitio.
 * 'index.html' -> '/', 'a/b/index.html' -> '/a/b/', '404.html' -> '404'; otro archivo conserva su ruta.
 */
export function pageUrlFromFile(relativePath) {
  const path = String(relativePath ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (path === '404.html') return '404';
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
}
