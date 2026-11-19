import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

const RULE = 'selector-class-pattern';

describe('class naming pattern', () => {
  test.each(['.smProbe', '.btn', '.sm_btn', '.sm-Btn', '.sm-btn---x', '.sm-btn--', '.sm-'])(
    'rejects "%s"',
    async (selector) => {
      const { errored, rules } = await lintCss(`${selector} { color: red; }`);
      expect(errored).toBe(true);
      expect(rules).toContain(RULE);
    },
  );

  test.each(['.sm-btn', '.sm-card-header', '.sm-btn--warning', '.sm-card--compact', '.sm-theme-dark', '.sm-code-tag'])(
    'accepts "%s"',
    async (selector) => {
      const { errored, rules } = await lintCss(`${selector} { color: red; }`);
      expect(rules).not.toContain(RULE);
      expect(errored).toBe(false);
    },
  );
});
