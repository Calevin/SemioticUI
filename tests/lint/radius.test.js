import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

const RULE = 'declaration-property-value-allowed-list';

describe('radius properties', () => {
  test.each([
    'border-radius: 4px',
    'border-top-left-radius: 2px',
    'border-bottom-right-radius: 50%',
    'border-start-end-radius: 1px',
    'border-end-start-radius: 0.5rem',
    'border-radius: var(--sm-radius, 4px)',
    'border-radius: var(--sm-other)',
  ])('rejects "%s"', async (declaration) => {
    const { errored, rules } = await lintCss(`.sm-a { ${declaration}; }`);
    expect(errored).toBe(true);
    expect(rules).toContain(RULE);
  });

  test.each([
    'border-radius: 0',
    'border-radius: 0px',
    'border-top-left-radius: 0',
    'border-start-start-radius: 0px',
    'border-radius: var(--sm-radius)',
    'border-radius: var(--sm-radius, 0)',
  ])('accepts "%s"', async (declaration) => {
    // Solo se evalua la regla de radio: 0px puede disparar length-zero-no-unit de la config estandar
    const { rules } = await lintCss(`.sm-a { ${declaration}; }`);
    expect(rules).not.toContain(RULE);
  });

  test('a token-based radius produces no violations at all', async () => {
    const { errored } = await lintCss('.sm-a { border-radius: var(--sm-radius); }');
    expect(errored).toBe(false);
  });
});
