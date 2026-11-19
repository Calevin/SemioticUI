// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { collectDefinedClasses, parseTokenSheet, stripCssComments } from '../../tools/design-doc/css-model.js';
import { FIXTURE_TOKEN_SHEET } from './fixtures.js';

// Parser CSS de la Spec 002: tokens claro/oscuro y clases definidas (002-RF-06 a 002-RF-09, 002-RF-12)
describe('parseTokenSheet', () => {
  test('reads light tokens from the :root block and ignores other properties', () => {
    const { light } = parseTokenSheet(FIXTURE_TOKEN_SHEET);
    expect(light.get('--sm-radius')).toBe('0px');
    expect(light.get('--sm-text')).toBe('#111111');
    expect(light.get('--sm-border')).toBe('var(--sm-text)');
    expect(light.has('color-scheme')).toBe(false);
  });

  test('reads dark tokens from the dark theme selector list', () => {
    const { dark } = parseTokenSheet(FIXTURE_TOKEN_SHEET);
    expect([...dark.keys()]).toEqual(['--sm-text']);
    expect(dark.get('--sm-text')).toBe('#EEEEEE');
  });

  test('accepts double quotes in the dark theme attribute selector', () => {
    const { dark } = parseTokenSheet(':root[data-sm-theme="dark"] { --sm-space-1: 0.25rem; }');
    expect(dark.get('--sm-space-1')).toBe('0.25rem');
  });

  test('ignores tokens mentioned inside comments', () => {
    const css = ':root { /* --sm-ghost: 1px; */ --sm-real: 2px; }';
    expect(stripCssComments(css)).not.toContain('--sm-ghost');
    expect([...parseTokenSheet(css).light.keys()]).toEqual(['--sm-real']);
  });

  test('a later declaration overrides an earlier one and the last declaration may omit the semicolon', () => {
    const { light } = parseTokenSheet(':root { --sm-a: 1px; --sm-a: 2px; --sm-b: 3px }');
    expect(light.get('--sm-a')).toBe('2px');
    expect(light.get('--sm-b')).toBe('3px');
  });
});

describe('collectDefinedClasses', () => {
  test('collects classes from nested @media rules and selector lists', () => {
    const css = [
      '@layer sm.components {',
      '  .sm-btn:hover:not(:disabled, [aria-disabled="true"]) { color: red; }',
      '  @media (prefers-reduced-motion: reduce) { .sm-btn, .sm-btn--sm .sm-card-title { transition: none; } }',
      '}',
    ].join('\n');
    expect([...collectDefinedClasses([{ path: 'a.css', css }])].sort()).toEqual([
      'sm-btn',
      'sm-btn--sm',
      'sm-card-title',
    ]);
  });

  test('does not produce classes from @layer statements, keyframes or declaration values', () => {
    const css = [
      '@layer sm.reset, sm.tokens, sm.base, sm.components;',
      '@keyframes sm-defined-fallback { to { opacity: 1; } }',
      '.sm-code-tag { animation: sm-defined-fallback 0.15s 2s forwards; }',
    ].join('\n');
    expect([...collectDefinedClasses([{ path: 'b.css', css }])]).toEqual(['sm-code-tag']);
  });
});
