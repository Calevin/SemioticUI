// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  findAbbreviatedNames,
  findClassMentions,
  findElementMentions,
  findRegions,
  findTokenMentions,
  findVersionDeclarations,
  parseTables,
  splitFencedCode,
} from '../../tools/design-doc/markdown-model.js';
import { FIXTURE_MARKDOWN } from './fixtures.js';

// Parser Markdown de la Spec 002 (002-RF-04, 002-RF-05, 002-RF-10, 002-RF-11, 002-RF-19)
describe('findTokenMentions', () => {
  test('finds exact mentions in prose and inside fenced code (002-CL-02)', () => {
    const markdown = 'Usa `--sm-radius`.\n\n```css\n.app-x { color: var(--sm-text-primary); }\n```\n';
    const names = findTokenMentions(markdown).map((mention) => mention.names[0]);
    expect(names).toEqual(['--sm-radius', '--sm-text-primary']);
  });

  test('does not treat class modifiers such as .sm-btn--sm as token mentions (002-CL-03)', () => {
    expect(findTokenMentions('Botones `.sm-btn--sm` y `.sm-btn--lg`.')).toEqual([]);
  });

  test('recognizes wildcard patterns, including the bare prefix', () => {
    const mentions = findTokenMentions('Tokens `--sm-space-*`, `--sm-*` y `--sm-`.');
    expect(mentions.map((mention) => [mention.raw, mention.kind, mention.names])).toEqual([
      ['--sm-space-*', 'wildcard', ['--sm-space-']],
      ['--sm-*', 'wildcard', ['--sm-']],
      ['--sm-', 'wildcard', ['--sm-']],
    ]);
  });

  test('expands brace alternatives and last-segment pipe alternatives', () => {
    const [braces, pipes] = findTokenMentions('`--sm-color-{info|danger}-hover` y `--sm-shadow-sm|md|lg`');
    expect(braces.kind).toBe('alternatives');
    expect(braces.names).toEqual(['--sm-color-info-hover', '--sm-color-danger-hover']);
    expect(pipes.raw).toBe('--sm-shadow-sm|md|lg');
    expect(pipes.names).toEqual(['--sm-shadow-sm', '--sm-shadow-md', '--sm-shadow-lg']);
  });

  test('reports the line of each mention', () => {
    const [mention] = findTokenMentions('uno\ndos\n`--sm-radius`');
    expect(mention.line).toBe(3);
  });
});

describe('findAbbreviatedNames (002-RF-11)', () => {
  test('flags abbreviated modifiers and a bare --sm', () => {
    const found = findAbbreviatedNames('Modificadores `--primary` y `--sm` / `--lg`.');
    expect(found.map((entry) => entry.text)).toEqual(['--primary', '--sm', '--lg']);
  });

  test('accepts tokens, the --_* alias pattern and full class names', () => {
    expect(findAbbreviatedNames('`--sm-radius`, alias `--_*`, clase `.sm-btn--primary` y `--sm-*`.')).toEqual([]);
  });

  test('flags internal aliases other than the --_* pattern', () => {
    expect(findAbbreviatedNames('alias `--_btn-bg`').map((entry) => entry.text)).toEqual(['--_btn-bg']);
  });

  test('ignores table separators, HTML comments and dashes (002-CL-11)', () => {
    const markdown = '| A | B |\n| :--- | ---: |\n<!-- design-check:inventory -->\n---\nTexto — guion largo.';
    expect(findAbbreviatedNames(markdown)).toEqual([]);
  });
});

describe('findClassMentions and findElementMentions', () => {
  test('finds dotted classes and class attributes but skips notational patterns (002-CL-10)', () => {
    const markdown = [
      'Clases `.sm-card-title`, `.sm-*`, `.sm-<bloque>--<modificador>` y `.sm-btn--*`.',
      '```html',
      '<button class="sm-btn sm-btn--primary app-x">Go</button>',
      '```',
    ].join('\n');
    expect(findClassMentions(markdown).map((mention) => mention.name)).toEqual([
      'sm-card-title',
      'sm-btn',
      'sm-btn--primary',
    ]);
  });

  test('finds opening and closing element tags but not notational patterns or the package name', () => {
    const markdown = '`<semiotic-alert>` y `</semiotic-alert>`, `<semiotic-*>`, `<semiotic-<nombre>>`, semiotic-ui.css';
    expect(findElementMentions(markdown).map((mention) => mention.name)).toEqual(['semiotic-alert', 'semiotic-alert']);
  });
});

describe('tables, regions and code segments', () => {
  test('parses tables outside fenced code, with escaped pipes and the nearest heading', () => {
    const markdown = [
      '### Alerta `<semiotic-alert>`',
      '',
      '| Atributo | Tipo |',
      '| :--- | :--- |',
      '| `variant` | `info` \\| `danger` |',
      '',
      '```md',
      '| Token | Valor claro |',
      '| :--- | :--- |',
      '```',
    ].join('\n');
    const tables = parseTables(markdown);
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Atributo', 'Tipo']);
    expect(tables[0].rows[0].cells).toEqual(['`variant`', '`info` | `danger`']);
    expect(tables[0].heading.text).toBe('Alerta `<semiotic-alert>`');
  });

  test('locates the inventory and nonexistent regions by line', () => {
    const regions = findRegions(FIXTURE_MARKDOWN);
    expect(regions.inventory.start).toBeLessThan(regions.nonexistent.start);
    expect(regions.nonexistent.end).toBeLessThan(regions.inventory.end);
  });

  test('a region with a duplicated marker is invalid', () => {
    const markdown = `${FIXTURE_MARKDOWN}\n<!-- design-check:nonexistent -->\n`;
    expect(findRegions(markdown).nonexistent).toBeNull();
  });

  test('splits fenced code segments', () => {
    const segments = splitFencedCode('a\n```js\nx\n```\nb');
    expect(segments.map((segment) => segment.isCode)).toEqual([false, true, false]);
    expect(segments[1].startLine).toBe(2);
  });
});

describe('findVersionDeclarations (002-RF-19)', () => {
  test('marks declarations before the first level 2 heading as header declarations', () => {
    const markdown = '# T\n\n> `semiotic-ui@0.1.0`\n\n## S\n\n`semiotic-ui@0.1.0` en ejemplo.';
    expect(findVersionDeclarations(markdown)).toEqual([
      { version: '0.1.0', line: 3, inHeader: true },
      { version: '0.1.0', line: 7, inHeader: false },
    ]);
  });

  test('ignores version strings that are not npm package specifiers', () => {
    expect(findVersionDeclarations('# T\n\n`DOC-00 // V0.1.0`\n')).toEqual([]);
  });
});
