// @vitest-environment node
// Contraste minimo 4.5:1 por estado y tema (004-RF-17)
import { describe, expect, test } from 'vitest';
import { contrastRatio, findRule, isHexColor, loadSidebarModel, loadThemes, resolveValue } from './css-rules.js';

const MINIMUM = 4.5;
const BASE = '.sm-sidebar-item';
const model = loadSidebarModel();
const themes = loadThemes();
const rule = (selector) => findRule(model, selector) ?? new Map();

// Cada estado toma texto y fondo de su regla y, en su defecto, de la regla de referencia indicada
const STATES = [
  { state: 'resting item', text: [BASE], background: [BASE] },
  { state: 'hovered item', text: [".sm-sidebar-item:hover:not([aria-disabled='true'])", BASE], background: [".sm-sidebar-item:hover:not([aria-disabled='true'])", BASE] },
  {
    state: 'active item',
    text: [".sm-sidebar-item[aria-current='page']:not([aria-disabled='true'], :hover)", BASE],
    background: [".sm-sidebar-item[aria-current='page']:not([aria-disabled='true'], :hover)", BASE],
  },
  { state: 'disabled item', text: [".sm-sidebar-item[aria-disabled='true']", BASE], background: [".sm-sidebar-item[aria-disabled='true']", BASE] },
  { state: 'menu label', text: ['.sm-sidebar-label'], background: ['.sm-sidebar'] },
];

function firstDeclared(selectors, property) {
  for (const selector of selectors) {
    const value = rule(selector).get(property);
    if (value !== undefined) return value;
  }
  return undefined;
}

const CASES = STATES.flatMap((entry) =>
  ['light', 'dark'].map((themeName) => ({ ...entry, themeName }))
);

describe('sidebar contrast (004-RF-17)', () => {
  test.each(CASES)('$state in $themeName theme reaches 4.5:1', ({ text, background, themeName }) => {
    const theme = themes[themeName];
    const textValue = firstDeclared(text, 'color');
    const backgroundValue = firstDeclared(background, 'background-color');
    expect(textValue, 'contrast-below-minimum: text color not declared').toBeDefined();
    expect(backgroundValue, 'contrast-below-minimum: background not declared').toBeDefined();
    const textHex = resolveValue(textValue, theme);
    const backgroundHex = resolveValue(backgroundValue, theme);
    expect(isHexColor(textHex) && isHexColor(backgroundHex), 'contrast-below-minimum: unresolved color').toBe(true);
    const ratio = contrastRatio(textHex, backgroundHex);
    expect(ratio >= MINIMUM, `contrast-below-minimum: ${ratio.toFixed(2)} (${textHex} on ${backgroundHex})`).toBe(true);
  });
});
