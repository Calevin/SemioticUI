// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { checkDesignDoc, formatDiscrepancies } from '../../tools/design-doc/check-design-doc.js';
import { appendMarkdown, createFixtureInput, typesOf } from './fixtures.js';

// Inventario, version, documento ausente e informe de la Spec 002
// (002-RF-02, 002-RF-03, 002-RF-12, 002-RF-14, 002-RF-16 a 002-RF-19, 002-CL-07)
function replaceInMarkdown(input, from, to) {
  expect(input.markdown).toContain(from);
  return { ...input, markdown: input.markdown.replace(from, to) };
}

function withExtraSheet(input, css) {
  return { ...input, stylesheets: [...input.stylesheets, { path: 'src/css/extra.css', css }] };
}

describe('document presence (002-RF-03)', () => {
  test('document-missing when the markdown is null', () => {
    expect(checkDesignDoc({ ...createFixtureInput(), markdown: null })).toEqual([
      { type: 'document-missing', subject: 'DESIGN.md' },
    ]);
  });

  test('document-missing when the markdown is blank', () => {
    expect(typesOf(checkDesignDoc({ ...createFixtureInput(), markdown: '  \n\n' }))).toEqual(['document-missing']);
  });
});

describe('inventory checks', () => {
  test('inventory-missing when the delimiters are absent', () => {
    const markdown = createFixtureInput().markdown.replace(/<!-- \/?design-check:[a-z]+ -->/g, '');
    const list = checkDesignDoc({ ...createFixtureInput(), markdown });
    expect(list.filter((entry) => entry.type === 'inventory-missing').map((entry) => entry.subject)).toEqual([
      'inventory',
      'nonexistent',
    ]);
  });

  test('class-inventory-missing for a defined class absent from the inventory', () => {
    const list = checkDesignDoc(withExtraSheet(createFixtureInput(), '.sm-card { color: red; }'));
    expect(list).toEqual([{ type: 'class-inventory-missing', subject: '.sm-card' }]);
  });

  test('class-inventory-extra for an inventory class that is not defined', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '| `.sm-btn--primary` |', '| `.sm-btn--secondary` |'));
    expect(typesOf(list)).toContain('class-inventory-extra');
    expect(typesOf(list)).toContain('class-inventory-missing');
  });

  test('the dark theme class sm-theme-dark must be in the inventory (002-CL-07)', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '| `.sm-theme-dark` | Tema oscuro |\n', ''));
    expect(list).toEqual([{ type: 'class-inventory-missing', subject: '.sm-theme-dark' }]);
  });

  test('element-inventory-missing and element-inventory-extra', () => {
    const input = createFixtureInput();
    input.library.elements.push({ name: 'semiotic-other', attributes: [], events: [], parts: [], slots: [] });
    expect(checkDesignDoc(input)).toContainEqual({ type: 'element-inventory-missing', subject: 'semiotic-other' });
    const renamed = replaceInMarkdown(createFixtureInput(), '| `<semiotic-probe>` | Sonda |', '| `<semiotic-probe>` | Sonda |\n| `<semiotic-gone>` | Otro |');
    expect(checkDesignDoc(renamed)).toContainEqual({ type: 'element-inventory-extra', subject: 'semiotic-gone' });
  });

  test('member-extra and member-missing per category', () => {
    const input = createFixtureInput();
    const element = input.library.elements[0];
    element.attributes = ['variant', 'code'];
    element.events = [];
    element.parts = ['base', 'body'];
    element.slots = [];
    const subjects = checkDesignDoc(input).map((entry) => `${entry.type} ${entry.subject}`);
    expect(subjects).toEqual([
      'member-extra semiotic-probe/event/sm-ping',
      'member-extra semiotic-probe/slot/heading',
      'member-missing semiotic-probe/attribute/code',
      'member-missing semiotic-probe/part/body',
    ]);
  });

  test('a member table without an element heading is reported as inventory-missing', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '### Sonda `<semiotic-probe>`', '### Sonda'));
    expect(list).toContainEqual(expect.objectContaining({ type: 'inventory-missing', subject: 'Atributo' }));
  });

  test('export-missing and export-extra', () => {
    const input = createFixtureInput();
    input.library.exports = ['registerProbe'];
    expect(typesOf(checkDesignDoc(input))).toEqual(['export-extra', 'export-missing']);
  });

  test('nonexistent-exists when a piece declared as nonexistent is defined', () => {
    const list = checkDesignDoc(withExtraSheet(createFixtureInput(), '.sm-badge { color: red; }'));
    expect(list).toContainEqual(expect.objectContaining({ type: 'nonexistent-exists', subject: '.sm-badge' }));
    const input = createFixtureInput();
    input.library.elements.push({ name: 'semiotic-modal', attributes: [], events: [], parts: [], slots: [] });
    expect(checkDesignDoc(input)).toContainEqual(expect.objectContaining({ type: 'nonexistent-exists', subject: 'semiotic-modal' }));
  });
});

describe('version declaration (002-RF-19)', () => {
  test('version-mismatch reports documented and actual versions', () => {
    const input = createFixtureInput();
    input.library.version = '2.0.0';
    expect(checkDesignDoc(input)).toEqual([
      { type: 'version-mismatch', subject: 'semiotic-ui', documented: '1.2.3', actual: '2.0.0', line: 3 },
    ]);
  });

  test('version-duplicate when the specifier appears twice', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), '`semiotic-ui@1.2.3`'));
    expect(typesOf(list)).toEqual(['version-duplicate']);
  });

  test('version-missing when the only declaration is outside the header', () => {
    const input = replaceInMarkdown(createFixtureInput(), '> **Version:** `semiotic-ui@1.2.3`', '');
    expect(typesOf(checkDesignDoc(appendMarkdown(input, '`semiotic-ui@1.2.3`')))).toEqual(['version-missing']);
  });
});

describe('formatDiscrepancies (002-RF-02)', () => {
  test('prints one line per discrepancy with documented, actual, line and detail', () => {
    const text = formatDiscrepancies([
      { type: 'token-light-mismatch', subject: '--sm-radius', documented: '0px', actual: '1px', line: 9 },
      { type: 'token-unknown', subject: '--sm-ghost' },
      { type: 'inventory-missing', subject: 'Atributo', line: 4, detail: 'member table without element heading' },
    ]);
    expect(text).toBe(
      [
        '[token-light-mismatch] --sm-radius documented="0px" actual="1px" (line 9)',
        '[token-unknown] --sm-ghost',
        '[inventory-missing] Atributo (line 4) detail="member table without element heading"',
      ].join('\n')
    );
  });

  test('the list is sorted by type and subject', () => {
    const input = appendMarkdown(createFixtureInput(), '`--sm-zz` `--sm-aa` `.sm-ghost`');
    const list = checkDesignDoc(input);
    expect(list.map((entry) => `${entry.type} ${entry.subject}`)).toEqual([
      'class-unknown .sm-ghost',
      'token-unknown --sm-aa',
      'token-unknown --sm-zz',
    ]);
  });
});
