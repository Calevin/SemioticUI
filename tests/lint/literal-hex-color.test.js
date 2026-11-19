import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

const RULE = 'semiotic/no-literal-hex-color';

describe('literal hex colors', () => {
  test.each([
    'color: #fff',
    'background-color: #a1b2c3',
    'border: 2px solid #000',
    '--_btn-bg: #f5b700',
    'color: color-mix(in srgb, var(--sm-x, #fff), #000)',
  ])('rejects "%s" in a component stylesheet', async (declaration) => {
    const { errored, rules } = await lintCss(`.sm-a { ${declaration}; }`);
    expect(errored).toBe(true);
    expect(rules).toContain(RULE);
  });

  test.each(['color: var(--sm-x, #fff)', 'color: var(--sm-text-primary)', 'color: currentcolor'])(
    'accepts "%s" in a component stylesheet',
    async (declaration) => {
      const { rules } = await lintCss(`.sm-a { ${declaration}; }`);
      expect(rules).not.toContain(RULE);
    },
  );

  test('accepts literal hex colors in the tokens stylesheet', async () => {
    const { errored, rules } = await lintCss(':root { --sm-palette-x: #f4f1ea; }', 'src/css/tokens.css');
    expect(rules).not.toContain(RULE);
    expect(errored).toBe(false);
  });

  test('the exemption does not extend to other stylesheets in src/css', async () => {
    const { rules } = await lintCss(':root { --sm-palette-x: #f4f1ea; }', 'src/css/base.css');
    expect(rules).toContain(RULE);
  });
});
