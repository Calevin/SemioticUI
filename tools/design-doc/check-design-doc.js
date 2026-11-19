// Reglas de coherencia entre DESIGN.md y la libreria (Spec 002): funciones puras sin I/O
import { collectDefinedClasses, parseTokenSheet } from './css-model.js';
import {
  findAbbreviatedNames,
  findClassMentions,
  findElementMentions,
  findRegions,
  findTokenMentions,
  findVersionDeclarations,
  isInsideRegion,
  parseTables,
  readCodeSpans,
} from './markdown-model.js';

const TOKEN_NAME = /^--sm-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MEMBER_HEADERS = { Atributo: 'attribute', Evento: 'event', Parte: 'part', Slot: 'slot' };
const MEMBER_FIELDS = { attribute: 'attributes', event: 'events', part: 'parts', slot: 'slots' };
const ELEMENT_IN_HEADING = /<(semiotic-[a-z0-9]+(?:-[a-z0-9]+)*)>/;

/**
 * Normaliza un valor CSS para compararlo: espacios colapsados, hexadecimales en minuscula
 * y referencia desnuda --sm-x convertida a var(--sm-x). No resuelve referencias.
 */
export function normalizeCssValue(value) {
  const collapsed = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => hex.toLowerCase());
  return TOKEN_NAME.test(collapsed) ? `var(${collapsed})` : collapsed;
}

/**
 * Lee una celda que debe contener exactamente un code span y nada mas.
 */
function readSingleSpan(cell) {
  const { spans, outside } = readCodeSpans(cell);
  return spans.length === 1 && outside === '' ? spans[0].trim() : null;
}

function createCollector() {
  const list = [];
  const add = (entry) => list.push(Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)));
  return { list, add };
}

/**
 * Compara dos conjuntos y reporta los sobrantes del documento y los faltantes del codigo.
 */
function compareSets(documented, actual, extraType, missingType, toSubject, add) {
  for (const name of documented) {
    if (!actual.has(name)) add({ type: extraType, subject: toSubject(name) });
  }
  for (const name of actual) {
    if (!documented.has(name)) add({ type: missingType, subject: toSubject(name) });
  }
}

function checkTokens(markdown, tokens, publicTokens, tables, add) {
  for (const mention of findTokenMentions(markdown)) {
    if (mention.kind === 'exact') {
      if (!publicTokens.has(mention.names[0])) {
        add({ type: 'token-unknown', subject: mention.names[0], line: mention.line });
      }
    } else {
      const matches = [...publicTokens].some((token) =>
        mention.kind === 'wildcard'
          ? mention.names.some((prefix) => token.startsWith(prefix))
          : mention.names.includes(token)
      );
      if (!matches) add({ type: 'token-pattern-unmatched', subject: mention.raw, line: mention.line });
    }
  }

  // Valores documentados por token y tema, solo desde tablas de tokens
  const documented = new Map();
  const remember = (token, theme, value, line) => {
    if (!documented.has(token)) documented.set(token, { light: [], dark: [] });
    documented.get(token)[theme].push({ value: normalizeCssValue(value), line });
  };

  for (const table of tables.filter((candidate) => candidate.headers[0] === 'Token')) {
    const lightIndex = table.headers.indexOf('Valor claro');
    const darkIndex = table.headers.indexOf('Valor oscuro');
    for (const row of table.rows) {
      const subject = row.cells[0] ?? '';
      if (lightIndex === -1) {
        add({ type: 'token-row-malformed', subject, line: row.line, detail: 'missing column Valor claro' });
        continue;
      }
      const token = readSingleSpan(row.cells[0]);
      const light = readSingleSpan(row.cells[lightIndex]);
      const darkCell = darkIndex === -1 ? '' : (row.cells[darkIndex] ?? '');
      const dark = darkCell.trim() === '' ? undefined : readSingleSpan(darkCell);
      if (token === null || !TOKEN_NAME.test(token) || light === null || dark === null) {
        add({ type: 'token-row-malformed', subject, line: row.line });
        continue;
      }
      remember(token, 'light', light, row.line);
      if (dark !== undefined) remember(token, 'dark', dark, row.line);
    }
  }

  for (const [token, themes] of documented) {
    // Los tokens inexistentes ya se reportan como menciones desconocidas
    if (!publicTokens.has(token)) continue;
    const expected = {
      light: normalizeCssValue(tokens.light.get(token) ?? ''),
      dark: normalizeCssValue(tokens.dark.get(token) ?? tokens.light.get(token) ?? ''),
    };
    for (const theme of ['light', 'dark']) {
      const entries = themes[theme];
      const distinct = [...new Set(entries.map((entry) => entry.value))];
      if (distinct.length > 1) {
        add({ type: 'token-duplicate-conflict', subject: token, line: entries[1].line, detail: theme });
      }
      for (const value of distinct) {
        if (value !== expected[theme]) {
          const line = entries.find((entry) => entry.value === value).line;
          add({ type: `token-${theme}-mismatch`, subject: token, documented: value, actual: expected[theme], line });
        }
      }
    }
  }

  for (const token of publicTokens) {
    if (!documented.has(token)) {
      add({ type: 'token-undocumented', subject: token });
    } else if (tokens.dark.has(token) && documented.get(token).dark.length === 0) {
      add({ type: 'token-dark-undocumented', subject: token });
    }
  }
}

function readInventory(tables, regions, add) {
  const inventory = {
    classes: new Set(),
    elements: new Set(),
    members: new Map(),
    exports: new Set(),
  };
  const memberSet = (element, category) => {
    if (!inventory.members.has(element)) inventory.members.set(element, {});
    const entry = inventory.members.get(element);
    entry[category] ??= new Set();
    return entry[category];
  };

  for (const table of tables) {
    if (!isInsideRegion(table.line, regions.inventory) || isInsideRegion(table.line, regions.nonexistent)) continue;
    const header = table.headers[0];
    const category = MEMBER_HEADERS[header];
    const element = table.heading?.text.match(ELEMENT_IN_HEADING)?.[1];
    if (category && !element) {
      add({ type: 'inventory-missing', subject: header, line: table.line, detail: 'member table without element heading' });
      continue;
    }
    if (!category && !['Clase', 'Custom Element', 'Exportación'].includes(header)) continue;

    for (const row of table.rows) {
      const value = readSingleSpan(row.cells[0]);
      if (value === null) {
        add({ type: 'inventory-missing', subject: row.cells[0] ?? '', line: row.line, detail: 'malformed row' });
        continue;
      }
      if (header === 'Clase') {
        inventory.classes.add(value.replace(/^\./, ''));
      } else if (header === 'Custom Element') {
        inventory.elements.add(value.replace(/^</, '').replace(/>$/, ''));
      } else if (header === 'Exportación') {
        inventory.exports.add(value.replace(/\(\)$/, ''));
      } else {
        memberSet(element, category).add(value);
      }
    }
  }
  return inventory;
}

function checkInventory(markdown, tables, regions, definedClasses, library, add) {
  const elementNames = new Set((library.elements ?? []).map((element) => element.name));

  if (!regions.inventory) add({ type: 'inventory-missing', subject: 'inventory' });
  if (!regions.nonexistent) add({ type: 'inventory-missing', subject: 'nonexistent' });

  if (regions.inventory) {
    const inventory = readInventory(tables, regions, add);
    compareSets(inventory.classes, definedClasses, 'class-inventory-extra', 'class-inventory-missing', (n) => `.${n}`, add);
    compareSets(inventory.elements, elementNames, 'element-inventory-extra', 'element-inventory-missing', (n) => n, add);
    compareSets(inventory.exports, new Set(library.exports ?? []), 'export-extra', 'export-missing', (n) => n, add);

    for (const element of library.elements ?? []) {
      if (!inventory.elements.has(element.name)) continue;
      if (element.sourceMissing) {
        add({ type: 'member-missing', subject: `${element.name}/event/*`, detail: 'component source not found' });
      }
      const documented = inventory.members.get(element.name) ?? {};
      for (const [category, field] of Object.entries(MEMBER_FIELDS)) {
        compareSets(
          documented[category] ?? new Set(),
          new Set(element[field] ?? []),
          'member-extra',
          'member-missing',
          (name) => `${element.name}/${category}/${name}`,
          add
        );
      }
    }
  }

  // Menciones en todo el documento: las de la lista de inexistentes se controlan aparte
  for (const mention of findClassMentions(markdown)) {
    const inNonexistent = isInsideRegion(mention.line, regions.nonexistent);
    if (inNonexistent && definedClasses.has(mention.name)) {
      add({ type: 'nonexistent-exists', subject: `.${mention.name}`, line: mention.line });
    } else if (!inNonexistent && !definedClasses.has(mention.name)) {
      add({ type: 'class-unknown', subject: `.${mention.name}`, line: mention.line });
    }
  }
  for (const mention of findElementMentions(markdown)) {
    const inNonexistent = isInsideRegion(mention.line, regions.nonexistent);
    if (inNonexistent && elementNames.has(mention.name)) {
      add({ type: 'nonexistent-exists', subject: mention.name, line: mention.line });
    } else if (!inNonexistent && !elementNames.has(mention.name)) {
      add({ type: 'element-unknown', subject: mention.name, line: mention.line });
    }
  }
}

function checkVersion(markdown, library, add) {
  const declarations = findVersionDeclarations(markdown);
  const inHeader = declarations.filter((declaration) => declaration.inHeader);
  if (inHeader.length === 0) {
    add({ type: 'version-missing', subject: 'semiotic-ui' });
  } else if (inHeader[0].version !== library.version) {
    add({
      type: 'version-mismatch',
      subject: 'semiotic-ui',
      documented: inHeader[0].version,
      actual: library.version,
      line: inHeader[0].line,
    });
  }
  if (declarations.length > 1) {
    add({
      type: 'version-duplicate',
      subject: 'semiotic-ui',
      line: declarations[1].line,
      detail: `lines ${declarations.map((declaration) => declaration.line).join(', ')}`,
    });
  }
}

function sortAndDeduplicate(list) {
  const seen = new Set();
  return list
    .filter((entry) => {
      const key = JSON.stringify([entry.type, entry.subject, entry.documented, entry.actual, entry.line]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        a.type.localeCompare(b.type) ||
        a.subject.localeCompare(b.subject) ||
        (a.line ?? 0) - (b.line ?? 0)
    );
}

/**
 * Compara DESIGN.md con la hoja de tokens, las hojas publicas y el modelo de la libreria.
 * Devuelve la lista ordenada de discrepancias (vacia si el documento es coherente).
 */
export function checkDesignDoc(input) {
  const { markdown, tokenSheetCss, stylesheets, library } = input;
  if (markdown === null || markdown === undefined || String(markdown).trim() === '') {
    return [{ type: 'document-missing', subject: 'DESIGN.md' }];
  }
  const { list, add } = createCollector();
  const tokens = parseTokenSheet(tokenSheetCss);
  const publicTokens = new Set([...tokens.light.keys(), ...tokens.dark.keys()]);
  const definedClasses = collectDefinedClasses(stylesheets);
  const tables = parseTables(markdown);
  const regions = findRegions(markdown);

  checkTokens(markdown, tokens, publicTokens, tables, add);
  for (const abbreviation of findAbbreviatedNames(markdown)) {
    add({ type: 'abbreviated-name', subject: abbreviation.text, line: abbreviation.line });
  }
  checkInventory(markdown, tables, regions, definedClasses, library ?? {}, add);
  checkVersion(markdown, library ?? {}, add);
  return sortAndDeduplicate(list);
}

/**
 * Formatea las discrepancias como una linea por entrada:
 * [<type>] <subject> documented="<v>" actual="<v>" (line <n>) detail="<d>"
 */
export function formatDiscrepancies(list) {
  return list
    .map((entry) => {
      let line = `[${entry.type}] ${entry.subject}`;
      if (entry.documented !== undefined) line += ` documented="${entry.documented}"`;
      if (entry.actual !== undefined) line += ` actual="${entry.actual}"`;
      if (entry.line !== undefined) line += ` (line ${entry.line})`;
      if (entry.detail !== undefined) line += ` detail="${entry.detail}"`;
      return line;
    })
    .join('\n');
}
