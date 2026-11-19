import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

describe('empty stylesheets', () => {
  test.each([
    ['an empty file', ''],
    ['a file with only whitespace', '\n\n'],
    ['a file with only a comment', '/* Hoja reservada */\n'],
  ])('%s produces no violations', async (_label, code) => {
    const { errored, warnings } = await lintCss(code);
    expect(errored).toBe(false);
    expect(warnings).toHaveLength(0);
  });
});
