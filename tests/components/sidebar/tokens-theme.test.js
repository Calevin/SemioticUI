// @vitest-environment node
// Tokens Tier 2 existentes y tema oscuro sin reglas propias (004-RF-13, 004-RF-14, 004-RNF-05)
import { describe, expect, test } from 'vitest';
import { listMerged, loadSidebarModel, loadThemes, parseRules, readSidebarCss, referencedTokens } from './css-rules.js';

const css = readSidebarCss() ?? '';
const themes = loadThemes();
const entries = listMerged(loadSidebarModel());

describe('sidebar tokens (004-RF-13, 004-RNF-05)', () => {
  test('references at least one token and only existing ones', () => {
    const tokens = referencedTokens(css);
    expect(tokens.length, 'token-not-allowed').toBeGreaterThan(0);
    for (const token of tokens) {
      expect(themes.light.has(token), `token-not-allowed: ${token} does not exist`).toBe(true);
    }
  });

  test('never references the literal Tier 1 palette', () => {
    for (const token of referencedTokens(css)) {
      expect(token.startsWith('--sm-palette-'), `token-not-allowed: ${token}`).toBe(false);
    }
  });

  test('declares no public custom property of its own', () => {
    for (const rule of parseRules(css)) {
      const own = [...rule.declarations.keys()].filter((property) => property.startsWith('--sm-'));
      expect(own, `token-not-allowed: ${rule.selector}`).toEqual([]);
    }
  });

  test('uses no literal hexadecimal color', () => {
    for (const entry of entries) {
      for (const [property, value] of entry.declarations) {
        expect(/#[0-9a-f]{3,8}\b/i.test(value), `token-not-allowed: ${entry.selector} ${property}`).toBe(false);
      }
    }
  });
});

describe('dark theme (004-RF-14)', () => {
  test('the stylesheet declares no dark theme selector or color scheme query', () => {
    for (const entry of entries) {
      expect(/data-sm-theme|sm-theme-dark/.test(entry.selector), `theme-rule-declared: ${entry.selector}`).toBe(false);
      expect(
        entry.context.some((at) => at.includes('prefers-color-scheme')),
        `theme-rule-declared: ${entry.context.join(' / ')}`
      ).toBe(false);
    }
  });

  test('every referenced token resolves in the dark theme', () => {
    for (const token of referencedTokens(css)) {
      expect(themes.dark.has(token), `theme-rule-declared: ${token} missing in dark theme`).toBe(true);
    }
  });
});
