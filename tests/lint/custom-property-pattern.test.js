import { describe, expect, test } from 'vitest';
import { lintCss } from './lint-helpers.js';

const RULE = 'custom-property-pattern';

describe('custom property naming pattern', () => {
  test.each(['--foo', '--smx', '--sm', '--btn-bg', '--SM-color'])('rejects "%s"', async (name) => {
    const { errored, rules } = await lintCss(`.sm-a { ${name}: red; }`);
    expect(errored).toBe(true);
    expect(rules).toContain(RULE);
  });

  test.each(['--sm-color-info', '--sm-x', '--_btn-bg', '--_alert-accent-fg'])('accepts "%s"', async (name) => {
    const { errored, rules } = await lintCss(`.sm-a { ${name}: red; }`);
    expect(rules).not.toContain(RULE);
    expect(errored).toBe(false);
  });
});
