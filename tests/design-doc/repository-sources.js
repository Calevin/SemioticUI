// Recolector de la Spec 002: lee los archivos reales y arma el modelo de la libreria en happy-dom
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Las rutas se resuelven desde este archivo, nunca desde el directorio de trabajo
const repoRoot = resolve(import.meta.dirname, '../..');
const EVENT_CREATION = /new\s+(?:Custom)?Event\(\s*(['"`])(sm-[a-z0-9-]+)\1/g;

let cachedModel = null;

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

/**
 * Lee DESIGN.md (null si no existe), la hoja de tokens, las hojas publicas y la version del paquete.
 */
export function loadRepositorySources() {
  const designPath = join(repoRoot, 'DESIGN.md');
  const cssDir = join(repoRoot, 'src/css');
  const stylesheets = readdirSync(cssDir)
    .filter((file) => file.endsWith('.css'))
    .sort()
    .map((file) => ({ path: `src/css/${file}`, css: readFileSync(join(cssDir, file), 'utf8') }));
  return {
    markdown: existsSync(designPath) ? readFileSync(designPath, 'utf8') : null,
    tokenSheetCss: readFileSync(join(cssDir, 'tokens.css'), 'utf8'),
    stylesheets,
    packageVersion: JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version,
    readComponentSource(name) {
      const path = join(repoRoot, 'src/components', `${name}.js`);
      return existsSync(path) ? readFileSync(path, 'utf8') : null;
    },
  };
}

/**
 * Extrae los nombres literales de evento sm-* creados en la fuente de un componente.
 */
export function extractEventNames(source) {
  return uniqueSorted([...String(source ?? '').matchAll(EVENT_CREATION)].map((match) => match[2]));
}

function describeElement(name, sources) {
  const constructor = customElements.get(name);
  const observed = Array.isArray(constructor?.observedAttributes) ? constructor.observedAttributes : [];
  const shadowRoot = document.createElement(name).shadowRoot;
  const parts = shadowRoot
    ? [...shadowRoot.querySelectorAll('[part]')].flatMap((node) => node.getAttribute('part').split(/\s+/))
    : [];
  const slots = shadowRoot
    ? [...shadowRoot.querySelectorAll('slot[name]')].map((node) => node.getAttribute('name'))
    : [];
  const source = sources.readComponentSource(name);
  const element = {
    name,
    attributes: uniqueSorted(observed),
    events: extractEventNames(source),
    parts: uniqueSorted(parts.filter(Boolean)),
    slots: uniqueSorted(slots),
  };
  if (source === null) element.sourceMissing = true;
  return element;
}

/**
 * Construye el modelo de la libreria. Requiere entorno happy-dom.
 * Intercepta customElements.define antes del import para enumerar los elementos registrados.
 */
export async function collectLibraryModel(sources = loadRepositorySources()) {
  if (cachedModel) return structuredClone(cachedModel);
  const defined = [];
  const originalDefine = customElements.define;
  customElements.define = function recordDefinition(name, ...rest) {
    defined.push(name);
    return originalDefine.call(this, name, ...rest);
  };
  let entryModule;
  try {
    entryModule = await import('../../src/index.js');
    entryModule.registerAll();
  } finally {
    customElements.define = originalDefine;
  }
  cachedModel = {
    version: sources.packageVersion,
    elements: uniqueSorted(defined).map((name) => describeElement(name, sources)),
    exports: Object.keys(entryModule).sort(),
  };
  return structuredClone(cachedModel);
}

/**
 * Arma la entrada de checkDesignDoc a partir de las fuentes y el modelo.
 */
export function buildCheckInput(sources, library) {
  return {
    markdown: sources.markdown,
    tokenSheetCss: sources.tokenSheetCss,
    stylesheets: sources.stylesheets,
    library,
  };
}
