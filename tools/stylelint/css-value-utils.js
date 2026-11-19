// Funciones puras de analisis de valores CSS para las reglas semiotic/* (Spec 001).
// Sin dependencias: el tokenizado es propio para no acoplarse a paquetes transitivos.

const LENGTH_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:[a-z]+|%)?$/i;
const MATH_FUNCTION_PATTERN = /^(?:calc|min|max|clamp)\(/i;
const VAR_FUNCTION_PATTERN = /^var\(/i;
const DROP_SHADOW_PATTERN = /^drop-shadow\(/i;
const HEX_COLOR_PATTERN = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;

/**
 * Recorre el valor caracter a caracter llevando la profundidad de parentesis y el estado de comillas.
 * Invoca onChar(char, index, depth, quoted) para cada caracter.
 */
function scan(value, onChar) {
  let depth = 0;
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      onChar(char, index, depth, true);
      if (char === '\\') {
        // Caracter escapado dentro de la cadena
        index += 1;
        if (index < value.length) onChar(value[index], index, depth, true);
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      onChar(char, index, depth, true);
      continue;
    }
    if (char === ')') depth = Math.max(0, depth - 1);
    onChar(char, index, depth, false);
    if (char === '(') depth += 1;
  }
}

/**
 * Divide un valor por un separador de nivel superior (fuera de parentesis y comillas).
 * Con separator === ' ' se divide por cualquier espacio en blanco.
 */
export function splitTopLevel(value, separator) {
  const parts = [];
  let current = '';
  scan(String(value), (char, _index, depth, quoted) => {
    const isSeparator = separator === ' ' ? /\s/.test(char) : char === separator;
    if (!quoted && depth === 0 && isSeparator) {
      parts.push(current);
      current = '';
      return;
    }
    current += char;
  });
  parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/**
 * Tokeniza un valor por espacios de nivel superior; una funcion completa es un unico token.
 */
export function tokenize(value) {
  return splitTopLevel(value, ' ');
}

export function isLengthToken(token) {
  return LENGTH_PATTERN.test(String(token).trim());
}

export function isZeroLength(token) {
  return isLengthToken(token) && Number.parseFloat(token) === 0;
}

/**
 * Devuelve el indice del primer separador de nivel superior, o -1 si no existe.
 */
function indexOfTopLevel(value, separator) {
  let found = -1;
  scan(value, (char, index, depth, quoted) => {
    if (found === -1 && !quoted && depth === 0 && char === separator) found = index;
  });
  return found;
}

/**
 * Devuelve el indice del parentesis que cierra al abierto en openIndex, o -1 si no cierra.
 */
function findClosingParen(value, openIndex) {
  let closing = -1;
  const offset = openIndex + 1;
  const rest = value.slice(offset);
  let depth = 0;
  scan(rest, (char, index, _depth, quoted) => {
    if (closing !== -1 || quoted) return;
    if (char === '(') depth += 1;
    if (char === ')') {
      if (depth === 0) closing = offset + index;
      else depth -= 1;
    }
  });
  return closing;
}

/**
 * Devuelve el contenido entre los parentesis externos de una funcion token (ej. "var(--a, b)" -> "--a, b").
 */
function functionArguments(token) {
  const open = token.indexOf('(');
  const close = token.lastIndexOf(')');
  if (open === -1 || close < open) return '';
  return token.slice(open + 1, close);
}

/**
 * Devuelve el fallback de un token var(), o null si no tiene.
 */
function varFallback(token) {
  const args = functionArguments(token);
  const comma = indexOfTopLevel(args, ',');
  if (comma === -1) return null;
  const fallback = args.slice(comma + 1).trim();
  return fallback.length > 0 ? fallback : null;
}

/**
 * Devuelve las capas de sombra difuminadas (blur distinto de 0) de un valor de box-shadow/text-shadow.
 * Recorre recursivamente los fallbacks de var(). Un blur expresado con calc()/min()/max()/clamp()
 * se considera difuminado; un var() se trata como color porque su rol no es deducible del valor.
 */
export function findBlurredShadows(value) {
  const normalized = String(value).trim();
  if (normalized.length === 0 || /^none$/i.test(normalized)) return [];

  const blurred = [];
  for (const layer of splitTopLevel(normalized, ',')) {
    const tokens = tokenize(layer);
    const lengths = [];

    for (const token of tokens) {
      if (VAR_FUNCTION_PATTERN.test(token)) {
        const fallback = varFallback(token);
        if (fallback !== null) blurred.push(...findBlurredShadows(fallback));
        continue;
      }
      if (isLengthToken(token) || MATH_FUNCTION_PATTERN.test(token)) lengths.push(token);
    }

    // El tercer valor de longitud es el radio de difuminado; omitido equivale a 0
    if (lengths.length >= 3 && !isZeroLength(lengths[2])) blurred.push(layer);
  }
  return blurred;
}

/**
 * Extrae los argumentos de cada drop-shadow() de un valor de filter/backdrop-filter, incluidos fallbacks de var().
 */
export function extractDropShadows(value) {
  const shadows = [];
  for (const token of tokenize(String(value))) {
    if (DROP_SHADOW_PATTERN.test(token)) {
      shadows.push(functionArguments(token).trim());
    } else if (VAR_FUNCTION_PATTERN.test(token)) {
      const fallback = varFallback(token);
      if (fallback !== null) shadows.push(...extractDropShadows(fallback));
    }
  }
  return shadows;
}

/**
 * Elimina los fallbacks de var(), el contenido de url() y las cadenas entre comillas,
 * dejando solo las partes del valor donde un color literal estaria fuera de lugar.
 */
function stripIgnoredSegments(value) {
  let output = '';
  let index = 0;
  while (index < value.length) {
    const char = value[index];
    if (char === '"' || char === "'") {
      // Saltamos la cadena completa respetando escapes
      let end = index + 1;
      while (end < value.length && value[end] !== char) end += value[end] === '\\' ? 2 : 1;
      output += ' ';
      index = end + 1;
      continue;
    }
    const rest = value.slice(index);
    const functionMatch = /^(var|url)\(/i.exec(rest);
    if (functionMatch) {
      const openIndex = index + functionMatch[1].length;
      const closeIndex = findClosingParen(value, openIndex);
      if (closeIndex === -1) {
        output += ' ';
        break;
      }
      if (functionMatch[1].toLowerCase() === 'var') {
        const args = value.slice(openIndex + 1, closeIndex);
        const comma = indexOfTopLevel(args, ',');
        output += `var(${comma === -1 ? args : args.slice(0, comma)})`;
      } else {
        output += 'url()';
      }
      index = closeIndex + 1;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

/**
 * Devuelve los colores hexadecimales literales que aparecen fuera del fallback de un var().
 */
export function findHexOutsideVarFallback(value) {
  return stripIgnoredSegments(String(value)).match(HEX_COLOR_PATTERN) ?? [];
}
