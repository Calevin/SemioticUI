// Modelo CSS de la Spec 004: parser puro de reglas con contexto de at-rules, resolucion de tokens y contraste
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseTokenSheet, stripCssComments } from '../../../tools/design-doc/css-model.js';

// Las rutas se resuelven desde este archivo, nunca desde el directorio de trabajo
const repoRoot = resolve(import.meta.dirname, '../../..');
export const SIDEBAR_PATH = join(repoRoot, 'src', 'css', 'sidebar.css');
export const TOKENS_PATH = join(repoRoot, 'src', 'css', 'tokens.css');
export const COMPONENTS_DIR = join(repoRoot, 'src', 'components');
export const COMPONENT_LAYER = '@layer sm.components';

/**
 * Normaliza un selector: espacios colapsados, comillas simples y separadores uniformes.
 */
export function normalizeSelector(selector) {
  return String(selector)
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

/**
 * Normaliza el preludio de una at-rule (espacios colapsados).
 */
export function normalizeAtRule(prelude) {
  return String(prelude).replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

/**
 * Divide un texto por un separador ignorando lo que esta entre parentesis.
 */
function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of text) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseDeclarations(body) {
  const declarations = new Map();
  for (const chunk of splitTopLevel(body, ';')) {
    const colon = chunk.indexOf(':');
    if (colon === -1) continue;
    const property = chunk.slice(0, colon).trim().toLowerCase();
    const value = chunk.slice(colon + 1).replace(/\s+/g, ' ').trim();
    if (property) declarations.set(property, value);
  }
  return declarations;
}

/**
 * Parsea una hoja y devuelve sus reglas con el selector normalizado y la cadena de at-rules que las contiene.
 * Las sentencias terminadas en punto y coma fuera de una regla (por ejemplo @layer a, b;) se descartan.
 */
export function parseRules(css) {
  const text = stripCssComments(css);
  const rules = [];
  let index = 0;

  function readBody() {
    // Lee el cuerpo de una regla de estilo hasta su llave de cierre
    let depth = 1;
    const start = index;
    while (index < text.length && depth > 0) {
      if (text[index] === '{') depth += 1;
      if (text[index] === '}') depth -= 1;
      index += 1;
    }
    return text.slice(start, index - 1);
  }

  function parseList(context) {
    let prelude = '';
    while (index < text.length) {
      const char = text[index];
      index += 1;
      if (char === ';') {
        prelude = '';
      } else if (char === '}') {
        return;
      } else if (char === '{') {
        const head = prelude.trim();
        prelude = '';
        if (head.startsWith('@')) {
          parseList([...context, normalizeAtRule(head)]);
        } else {
          rules.push({ selector: normalizeSelector(head), context, declarations: parseDeclarations(readBody()) });
        }
      } else {
        prelude += char;
      }
    }
  }

  parseList([]);
  return rules;
}

function ruleKey(context, selector) {
  return `${context.join(' / ')} | ${selector}`;
}

/**
 * Fusiona las reglas con igual selector y contexto en orden de aparicion: la ultima declaracion gana.
 */
export function mergeRules(rules) {
  const merged = new Map();
  for (const rule of rules) {
    const key = ruleKey(rule.context, rule.selector);
    if (!merged.has(key)) merged.set(key, new Map());
    const target = merged.get(key);
    for (const [property, value] of rule.declarations) target.set(property, value);
  }
  return merged;
}

/**
 * Devuelve las declaraciones efectivas de un selector exacto en un contexto exacto.
 */
export function findRule(merged, selector, context = [COMPONENT_LAYER]) {
  return merged.get(ruleKey(context.map(normalizeAtRule), normalizeSelector(selector)));
}

/**
 * Lista las entradas fusionadas como objetos con contexto y selector separados.
 */
export function listMerged(merged) {
  return [...merged.entries()].map(([key, declarations]) => {
    const separator = key.indexOf(' | ');
    const contextText = key.slice(0, separator);
    return {
      context: contextText ? contextText.split(' / ') : [],
      selector: key.slice(separator + 3),
      declarations,
    };
  });
}

export function readSidebarCss() {
  return existsSync(SIDEBAR_PATH) ? readFileSync(SIDEBAR_PATH, 'utf8') : null;
}

/**
 * Modelo fusionado de la hoja del Sidebar (Map vacio si la hoja no existe).
 */
export function loadSidebarModel() {
  const css = readSidebarCss();
  return mergeRules(parseRules(css ?? ''));
}

/**
 * Tokens del tema claro y del oscuro; el oscuro hereda del claro lo que no redefine.
 */
export function loadThemes() {
  const { light, dark } = parseTokenSheet(readFileSync(TOKENS_PATH, 'utf8'));
  return { light, dark: new Map([...light, ...dark]) };
}

function findVarCall(value) {
  const start = value.indexOf('var(');
  if (start === -1) return null;
  let depth = 0;
  for (let index = start + 3; index < value.length; index += 1) {
    if (value[index] === '(') depth += 1;
    if (value[index] === ')') {
      depth -= 1;
      if (depth === 0) return { start, end: index + 1, inner: value.slice(start + 4, index) };
    }
  }
  return null;
}

/**
 * Resuelve var(--x) y var(--x, fallback) de forma recursiva contra un tema.
 */
export function resolveValue(value, theme) {
  let result = String(value ?? '');
  for (let guard = 0; guard < 50; guard += 1) {
    const call = findVarCall(result);
    if (!call) return result.replace(/\s+/g, ' ').trim();
    const [name, ...fallback] = splitTopLevel(call.inner, ',');
    const token = name.trim();
    const replacement = theme.has(token) ? theme.get(token) : fallback.join(',').trim();
    if (!theme.has(token) && fallback.length === 0) {
      throw new Error(`unresolved token ${token}`);
    }
    result = result.slice(0, call.start) + replacement + result.slice(call.end);
  }
  throw new Error(`token resolution did not converge for ${value}`);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Relacion de contraste WCAG 2.x entre dos colores hexadecimales.
 */
export function contrastRatio(hexA, hexB) {
  const [high, low] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

export function isHexColor(value) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value).trim());
}

/**
 * Lee una longitud simple (numero y unidad).
 */
export function parseLength(value) {
  const match = /^(-?\d*\.?\d+)([a-z%]*)$/i.exec(String(value).trim());
  return match ? { number: Number(match[1]), unit: match[2].toLowerCase() } : null;
}

/**
 * Extrae los nombres de token --sm-* referenciados con var() en una hoja.
 */
export function referencedTokens(css) {
  return [...stripCssComments(css ?? '').matchAll(/var\(\s*(--sm-[a-z0-9-]+)/g)].map((match) => match[1]);
}
