// Modelo Markdown puro para la comprobacion de coherencia de DESIGN.md (Spec 002): sin I/O ni dependencias

export const REGION_MARKERS = {
  inventory: ['<!-- design-check:inventory -->', '<!-- /design-check:inventory -->'],
  nonexistent: ['<!-- design-check:nonexistent -->', '<!-- /design-check:nonexistent -->'],
};

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^#{1,6}\s+(.*)$/;
const SEPARATOR_CELL = /^:?-{3,}:?$/;
const TOKEN_MENTION = /(?<![A-Za-z0-9_-])--sm-((?:[a-z0-9]+-)*[a-z0-9]*)/g;
const ABBREVIATION_START = /(?<![A-Za-z0-9_-])--(?=[A-Za-z_])/g;
const DOTTED_CLASS = /(?<![A-Za-z0-9_])\.(sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?)/g;
const CLASS_ATTRIBUTE = /\bclass(?:Name)?\s*=\s*["']([^"']*)["']/g;
const CLASS_NAME = /^sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const ELEMENT_TAG = /<\/?(semiotic-[a-z0-9]+(?:-[a-z0-9]+)*)(?=[\s>/])/g;
const VERSION_DECLARATION = /semiotic-ui@(\d+\.\d+\.\d+)/g;
const NOTATIONAL_SUFFIXES = ['*', '<', '-*', '-<', '--*', '--<'];

/**
 * Convierte un desplazamiento de caracteres en numero de linea (base 1).
 */
function createLineLocator(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') starts.push(index + 1);
  }
  return (offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (starts[middle] <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };
}

/**
 * Marca que lineas (base 1) pertenecen a bloques de codigo cercados, incluidas las cercas.
 */
function computeCodeLines(lines) {
  const codeLines = new Set();
  let fence = null;
  lines.forEach((line, index) => {
    const match = line.match(FENCE);
    if (fence) {
      codeLines.add(index + 1);
      if (match && match[1] === fence) fence = null;
    } else if (match) {
      fence = match[1];
      codeLines.add(index + 1);
    }
  });
  return codeLines;
}

/**
 * Divide el documento en segmentos de texto y de codigo cercado.
 */
export function splitFencedCode(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const codeLines = computeCodeLines(lines);
  const segments = [];
  lines.forEach((line, index) => {
    const isCode = codeLines.has(index + 1);
    const last = segments[segments.length - 1];
    if (last && last.isCode === isCode) {
      last.text += `\n${line}`;
    } else {
      segments.push({ text: line, isCode, startLine: index + 1 });
    }
  });
  return segments;
}

/**
 * Divide una fila de tabla en celdas respetando las barras escapadas.
 */
function splitTableRow(line) {
  let content = line.trim();
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|') && !content.endsWith('\\|')) content = content.slice(0, -1);
  const cells = [];
  let current = '';
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '\\' && content[index + 1] === '|') {
      current += '|';
      index += 1;
    } else if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Extrae el contenido de los code spans de una celda y el texto que queda fuera de ellos.
 */
export function readCodeSpans(cell) {
  const spans = [];
  const outside = String(cell ?? '').replace(/`([^`]+)`/g, (_match, content) => {
    spans.push(content);
    return '';
  });
  return { spans, outside: outside.trim() };
}

/**
 * Lista las tablas Markdown fuera de bloques de codigo, con el encabezado mas cercano anterior.
 */
export function parseTables(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const codeLines = computeCodeLines(lines);
  const tables = [];
  let heading = null;
  let index = 0;
  while (index < lines.length) {
    const lineNumber = index + 1;
    const line = lines[index];
    if (codeLines.has(lineNumber)) {
      index += 1;
      continue;
    }
    const headingMatch = line.match(HEADING);
    if (headingMatch) {
      heading = { text: headingMatch[1].trim(), line: lineNumber };
      index += 1;
      continue;
    }
    const next = lines[index + 1];
    const isTableStart =
      line.trim().startsWith('|') &&
      next !== undefined &&
      !codeLines.has(lineNumber + 1) &&
      next.trim().startsWith('|') &&
      splitTableRow(next).every((cell) => SEPARATOR_CELL.test(cell));
    if (!isTableStart) {
      index += 1;
      continue;
    }
    const table = { headers: splitTableRow(line), rows: [], line: lineNumber, heading };
    index += 2;
    while (index < lines.length && !codeLines.has(index + 1) && lines[index].trim().startsWith('|')) {
      table.rows.push({ cells: splitTableRow(lines[index]), line: index + 1 });
      index += 1;
    }
    tables.push(table);
  }
  return tables;
}

/**
 * Localiza las regiones delimitadas del inventario y de los componentes inexistentes.
 * Una region es valida solo si cada delimitador aparece exactamente una vez y en orden.
 */
export function findRegions(markdown) {
  const text = String(markdown ?? '');
  const locate = createLineLocator(text);
  const result = {};
  for (const [name, [open, close]] of Object.entries(REGION_MARKERS)) {
    const openCount = text.split(open).length - 1;
    const closeCount = text.split(close).length - 1;
    const start = text.indexOf(open);
    const end = text.indexOf(close);
    result[name] =
      openCount === 1 && closeCount === 1 && start < end
        ? { start: locate(start), end: locate(end) }
        : null;
  }
  return result;
}

/**
 * Indica si una linea queda estrictamente dentro de una region.
 */
export function isInsideRegion(line, region) {
  return Boolean(region) && line > region.start && line < region.end;
}

/**
 * Expande grupos {a|b} encadenados a partir de una posicion del texto.
 * Devuelve los sufijos posibles y la posicion final.
 */
function readBraceTail(text, position) {
  let suffixes = [''];
  let cursor = position;
  while (cursor < text.length) {
    if (text[cursor] === '{') {
      const close = text.indexOf('}', cursor);
      if (close === -1) break;
      const options = text.slice(cursor + 1, close).split('|');
      suffixes = suffixes.flatMap((suffix) => options.map((option) => suffix + option));
      cursor = close + 1;
      continue;
    }
    const literal = text.slice(cursor).match(/^[a-z0-9-]+/);
    if (!literal) break;
    suffixes = suffixes.map((suffix) => suffix + literal[0]);
    cursor += literal[0].length;
  }
  return { suffixes, end: cursor };
}

/**
 * Encuentra las menciones de token y los patrones de tokens de todo el documento.
 * kind: exact (names = [nombre]), wildcard (names = prefijos) o alternatives (names = expansion).
 */
export function findTokenMentions(markdown) {
  const text = String(markdown ?? '');
  const locate = createLineLocator(text);
  const mentions = [];
  for (const match of text.matchAll(TOKEN_MENTION)) {
    const start = match.index;
    const captured = match[1];
    const base = `--sm-${captured}`;
    let end = start + match[0].length;
    let kind = 'exact';
    let names = [base];
    if (text[end] === '*') {
      kind = 'wildcard';
      end += 1;
    } else if (text[end] === '{') {
      const tail = readBraceTail(text, end);
      names = tail.suffixes.map((suffix) => base + suffix);
      end = tail.end;
      kind = 'alternatives';
      if (text[end] === '*') {
        kind = 'wildcard';
        end += 1;
      }
    } else if (text[end] === '|' && /[a-z0-9]/.test(text[end + 1] ?? '')) {
      const tail = text.slice(end).match(/^(?:\|[a-z0-9]+(?:-[a-z0-9]+)*)+/);
      const lastDash = captured.lastIndexOf('-');
      const prefix = `--sm-${captured.slice(0, lastDash + 1)}`;
      const options = [captured.slice(lastDash + 1), ...tail[0].slice(1).split('|')];
      names = options.map((option) => prefix + option);
      end += tail[0].length;
      kind = 'alternatives';
    } else if (captured === '' || captured.endsWith('-')) {
      kind = 'wildcard';
    }
    mentions.push({ raw: text.slice(start, end), kind, names, line: locate(start) });
  }
  return mentions;
}

/**
 * Encuentra apariciones de -- seguidas de letra o guion bajo que no son tokens ni el patron --_*.
 */
export function findAbbreviatedNames(markdown) {
  const text = String(markdown ?? '');
  const locate = createLineLocator(text);
  const found = [];
  for (const match of text.matchAll(ABBREVIATION_START)) {
    const rest = text.slice(match.index);
    if (rest.startsWith('--sm-') || rest.startsWith('--_*')) continue;
    const word = rest.match(/^--[A-Za-z0-9_-]*/)[0];
    found.push({ text: word, line: locate(match.index) });
  }
  return found;
}

/**
 * Encuentra las menciones de clases sm-* (con punto o dentro de class/className).
 * Los patrones notacionales (.sm-*, .sm-<bloque>) se descartan.
 */
export function findClassMentions(markdown) {
  const text = String(markdown ?? '');
  const locate = createLineLocator(text);
  const mentions = [];
  for (const match of text.matchAll(DOTTED_CLASS)) {
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 3);
    if (NOTATIONAL_SUFFIXES.some((suffix) => after.startsWith(suffix))) continue;
    mentions.push({ name: match[1], line: locate(match.index), offset: match.index });
  }
  for (const match of text.matchAll(CLASS_ATTRIBUTE)) {
    const valueOffset = match.index + match[0].indexOf(match[1]);
    for (const word of match[1].split(/\s+/)) {
      if (CLASS_NAME.test(word)) {
        mentions.push({ name: word, line: locate(valueOffset), offset: valueOffset });
      }
    }
  }
  return mentions.sort((a, b) => a.offset - b.offset);
}

/**
 * Encuentra las etiquetas de apertura o de cierre de Custom Elements semiotic-*.
 */
export function findElementMentions(markdown) {
  const text = String(markdown ?? '');
  const locate = createLineLocator(text);
  return [...text.matchAll(ELEMENT_TAG)].map((match) => ({
    name: match[1],
    line: locate(match.index),
    offset: match.index,
  }));
}

/**
 * Encuentra las apariciones de semiotic-ui@X.Y.Z e indica si estan en el encabezado
 * (todo lo anterior al primer encabezado de nivel 2 fuera de bloques de codigo).
 */
export function findVersionDeclarations(markdown) {
  const text = String(markdown ?? '');
  const lines = text.split('\n');
  const codeLines = computeCodeLines(lines);
  const headerIndex = lines.findIndex((line, index) => !codeLines.has(index + 1) && /^##\s/.test(line));
  const headerEnd = headerIndex === -1 ? lines.length + 1 : headerIndex + 1;
  const locate = createLineLocator(text);
  return [...text.matchAll(VERSION_DECLARATION)].map((match) => {
    const line = locate(match.index);
    return { version: match[1], line, inHeader: line < headerEnd };
  });
}
