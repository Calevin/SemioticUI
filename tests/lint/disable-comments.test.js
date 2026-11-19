import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

describe('stylelint disable comments', () => {
  test('a global stylelint-disable does not hide a radius violation', async () => {
    const { errored, rules } = await lintCss('/* stylelint-disable */\n.sm-a { border-radius: 4px; }\n');
    expect(errored).toBe(true);
    expect(rules).toContain('declaration-property-value-allowed-list');
  });

  test('a rule-scoped stylelint-disable-next-line does not hide the violation', async () => {
    const { errored, rules } = await lintCss(
      '/* stylelint-disable-next-line selector-max-universal */\n* { color: red; }\n',
    );
    expect(errored).toBe(true);
    expect(rules).toContain('selector-max-universal');
  });

  test('a stylelint-disable-line comment does not hide the violation', async () => {
    const { errored, rules } = await lintCss('.smProbe { color: red; } /* stylelint-disable-line */\n');
    expect(errored).toBe(true);
    expect(rules).toContain('selector-class-pattern');
  });
});
