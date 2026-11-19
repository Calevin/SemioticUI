import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

const RULE = 'semiotic/no-blurred-shadow';

describe('blurred shadows', () => {
  test.each([
    'box-shadow: 2px 2px 4px currentcolor',
    'text-shadow: 1px 1px 2px currentcolor',
    'box-shadow: 2px 2px 0 0 currentcolor, 1px 1px 3px currentcolor',
    'filter: drop-shadow(2px 2px 4px currentcolor)',
    'backdrop-filter: grayscale(1) drop-shadow(1px 1px 1px currentcolor)',
    'box-shadow: var(--sm-x, 2px 2px 4px currentcolor)',
    '--sm-shadow-soft: 4px 4px 8px currentcolor',
    '--_card-shadow: 1px 1px 2px currentcolor',
  ])('rejects "%s"', async (declaration) => {
    const { errored, rules } = await lintCss(`.sm-a { ${declaration}; }`);
    expect(errored).toBe(true);
    expect(rules).toContain(RULE);
  });

  test.each([
    'box-shadow: 0 0 0 0 transparent',
    'box-shadow: none',
    'box-shadow: 2px 2px 0 0 currentcolor',
    'box-shadow: var(--sm-shadow-md)',
    'text-shadow: 1px 1px currentcolor',
    'filter: drop-shadow(2px 2px 0 currentcolor)',
    '--sm-shadow-none: 0 0 0 0 transparent',
  ])('accepts "%s"', async (declaration) => {
    const { errored, rules } = await lintCss(`.sm-a { ${declaration}; }`);
    expect(rules).not.toContain(RULE);
    expect(errored).toBe(false);
  });

  test('reports one warning per blurred layer', async () => {
    const { warnings } = await lintCss(
      '.sm-a { box-shadow: 1px 1px 1px currentcolor, 2px 2px 0 currentcolor, 3px 3px 3px currentcolor; }',
    );
    expect(warnings.filter((warning) => warning.rule === RULE)).toHaveLength(2);
  });

  test('the tokens stylesheet is still checked for blurred shadows', async () => {
    const { rules } = await lintCss(':root { --sm-shadow-x: 2px 2px 4px currentcolor; }', 'src/css/tokens.css');
    expect(rules).toContain(RULE);
  });
});
