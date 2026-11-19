import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

describe('forbidden selectors', () => {
  test.each(['* { color: red; }', '.sm-a > * { color: red; }', ':where(*) { color: red; }'])(
    'rejects the universal selector in "%s"',
    async (code) => {
      const { errored, rules } = await lintCss(code);
      expect(errored).toBe(true);
      expect(rules).toContain('selector-max-universal');
    },
  );

  test('rejects :host-context()', async () => {
    const { errored, rules } = await lintCss(':host-context(.sm-x) .sm-a { color: red; }');
    expect(errored).toBe(true);
    expect(rules).toContain('selector-pseudo-class-disallowed-list');
  });

  test('accepts :where() over explicit selectors', async () => {
    const { errored } = await lintCss(':where(html, body) { margin: 0; }');
    expect(errored).toBe(false);
  });
});
