// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { checkDesignDoc, normalizeCssValue } from '../../tools/design-doc/check-design-doc.js';
import { appendMarkdown, createFixtureInput, typesOf } from './fixtures.js';

// Reglas de tokens de la Spec 002 (002-RF-04 a 002-RF-10, 002-CL-04, 002-CL-05, 002-CL-08)
function withTokenSheet(input, css) {
  return {
    ...input,
    tokenSheetCss: css,
    stylesheets: input.stylesheets.map((sheet) => (sheet.path === 'src/css/tokens.css' ? { ...sheet, css } : sheet)),
  };
}

function replaceInMarkdown(input, from, to) {
  expect(input.markdown).toContain(from);
  return { ...input, markdown: input.markdown.replace(from, to) };
}

describe('token checks', () => {
  test('the coherent fixture has no discrepancies', () => {
    expect(checkDesignDoc(createFixtureInput())).toEqual([]);
  });

  test('token-unknown: a mention of a token that does not exist', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), 'Usa `--sm-ghost`.'));
    expect(list).toContainEqual(expect.objectContaining({ type: 'token-unknown', subject: '--sm-ghost' }));
  });

  test('token-pattern-unmatched: a wildcard or alternative pattern without matches', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), '`--sm-nope-*` y `--sm-x-{a|b}`'));
    const subjects = list.filter((entry) => entry.type === 'token-pattern-unmatched').map((entry) => entry.subject);
    expect(subjects).toEqual(['--sm-nope-*', '--sm-x-{a|b}']);
  });

  test('token-undocumented: a public token missing from the token tables', () => {
    const input = createFixtureInput();
    const list = checkDesignDoc(withTokenSheet(input, input.tokenSheetCss.replace('--sm-radius: 0px;', '--sm-radius: 0px; --sm-extra: 1px;')));
    expect(list).toEqual([{ type: 'token-undocumented', subject: '--sm-extra' }]);
  });

  test('token-light-mismatch: documented light value differs from the token sheet', () => {
    const input = createFixtureInput();
    const list = checkDesignDoc(withTokenSheet(input, input.tokenSheetCss.replace('--sm-radius: 0px;', '--sm-radius: 1px;')));
    expect(list).toEqual([
      { type: 'token-light-mismatch', subject: '--sm-radius', documented: '0px', actual: '1px', line: 9 },
    ]);
  });

  test('token-dark-mismatch: documented dark value differs from the effective dark value', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '`#eeeeee`', '`#000000`'));
    expect(list).toContainEqual(
      expect.objectContaining({ type: 'token-dark-mismatch', subject: '--sm-text', documented: '#000000', actual: '#eeeeee' })
    );
  });

  test('token-dark-mismatch: a dark value for a token not redefined is compared with its light value', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '| `--sm-radius` | `0px` | |', '| `--sm-radius` | `0px` | `2px` |'));
    expect(list).toContainEqual(
      expect.objectContaining({ type: 'token-dark-mismatch', subject: '--sm-radius', documented: '2px', actual: '0px' })
    );
  });

  test('token-dark-undocumented: a token redefined in the dark theme without a dark value', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '| `#111111` | `#eeeeee` |', '| `#111111` | |'));
    expect(list).toEqual([{ type: 'token-dark-undocumented', subject: '--sm-text' }]);
  });

  test('token-row-malformed: several tokens, suffix shorthand or plain text in a row', () => {
    const table = [
      '| Token | Valor claro |',
      '| :--- | :--- |',
      '| `--sm-radius` / `-500` | `0px` |',
      '| --sm-radius | 0px |',
      '| `--sm-*` | `0px` |',
    ].join('\n');
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), table));
    expect(list.filter((entry) => entry.type === 'token-row-malformed')).toHaveLength(3);
  });

  test('token-row-malformed: a Token table without the Valor claro column', () => {
    const table = '| Token | Valor |\n| :--- | :--- |\n| `--sm-radius` | `0px` |';
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), table));
    expect(list).toContainEqual(expect.objectContaining({ type: 'token-row-malformed', detail: 'missing column Valor claro' }));
  });

  test('abbreviated references are not equivalent to full token references', () => {
    const list = checkDesignDoc(replaceInMarkdown(createFixtureInput(), '`var(--sm-text)`', '`text`'));
    expect(typesOf(list)).toContain('token-light-mismatch');
    expect(normalizeCssValue('--sm-text')).toBe('var(--sm-text)');
  });

  test('composite values are compared completely (002-CL-04)', () => {
    const input = createFixtureInput();
    const css = input.tokenSheetCss.replace('--sm-radius: 0px;', '--sm-radius: 0px; --sm-shadow: 2px 2px 0 0 var(--sm-text);');
    const partial = appendMarkdown(input, '| Token | Valor claro |\n| :--- | :--- |\n| `--sm-shadow` | `2px 2px 0 0` |');
    expect(typesOf(checkDesignDoc(withTokenSheet(partial, css)))).toEqual(['token-light-mismatch']);
    const complete = appendMarkdown(input, '| Token | Valor claro |\n| :--- | :--- |\n| `--sm-shadow` | `2px  2px 0 0   var(--sm-text)` |');
    expect(checkDesignDoc(withTokenSheet(complete, css))).toEqual([]);
  });

  test('a token redefined in dark with the same value may show the same value in both themes (002-CL-05)', () => {
    const input = createFixtureInput();
    const css = input.tokenSheetCss.replace('--sm-text: #EEEEEE;', '--sm-text: #EEEEEE; --sm-radius: 0px;');
    const markdown = replaceInMarkdown(input, '| `--sm-radius` | `0px` | |', '| `--sm-radius` | `0px` | `0px` |');
    expect(checkDesignDoc(withTokenSheet(markdown, css))).toEqual([]);
  });

  test('token-duplicate-conflict: two different values for the same theme (002-CL-08)', () => {
    const table = '| Token | Valor claro |\n| :--- | :--- |\n| `--sm-radius` | `4px` |';
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), table));
    expect(typesOf(list)).toEqual(['token-duplicate-conflict', 'token-light-mismatch']);
  });
});
