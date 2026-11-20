// @vitest-environment node
// Estados del item del Sidebar (004-RF-05 a 004-RF-08, 004-CL-01, 004-CL-03, 004-CL-05)
import { describe, expect, test } from 'vitest';
import { findRule, isHexColor, loadSidebarModel, loadThemes, parseLength, resolveValue } from './css-rules.js';

const BASE = '.sm-sidebar-item';
const HOVER = ".sm-sidebar-item:hover:not([aria-disabled='true'])";
const FOCUS = '.sm-sidebar-item:focus-visible';
const STRIPE = ".sm-sidebar-item[aria-current='page']";
const ACTIVE = ".sm-sidebar-item[aria-current='page']:not([aria-disabled='true'], :hover)";
const DISABLED = ".sm-sidebar-item[aria-disabled='true']";
const BORDER_STYLES = new Set(['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none', 'hidden']);

const model = loadSidebarModel();
const themes = loadThemes();
const rule = (selector) => findRule(model, selector) ?? new Map();

// Color efectivo de un estado: lo que declara su regla o, si no, lo heredado de la regla base del item
function stateColor(selector, property, theme) {
  const value = rule(selector).get(property) ?? rule(BASE).get(property);
  return value === undefined ? undefined : resolveValue(value, theme).toLowerCase();
}

// Separa un shorthand de borde u outline en ancho, estilo y color ya resueltos
function splitStroke(value, theme) {
  const parts = resolveValue(value ?? '', theme).split(' ');
  return {
    width: parts.map(parseLength).find((length) => length && length.unit === 'px'),
    style: parts.find((part) => BORDER_STYLES.has(part)),
    color: parts.find((part) => !parseLength(part) && !BORDER_STYLES.has(part)),
  };
}

describe.each([...Object.entries({ light: themes.light, dark: themes.dark })])('active item in %s theme (004-RF-05)', (name, theme) => {
  test('uses a background and a text color different from the resting item', () => {
    expect(stateColor(ACTIVE, 'background-color', theme), 'active-state-invalid').not.toBe(
      stateColor(BASE, 'background-color', theme)
    );
    expect(stateColor(ACTIVE, 'color', theme), 'active-state-invalid').not.toBe(stateColor(BASE, 'color', theme));
  });

  test('shows a solid, visible accent stripe between 6px and 8px', () => {
    const stripe = splitStroke(rule(BASE).get('border-inline-start'), theme);
    expect(stripe.width?.number >= 6 && stripe.width?.number <= 8, 'active-state-invalid').toBe(true);
    expect(stripe.style, 'active-state-invalid').toBe('solid');
    const color = stateColor(STRIPE, 'border-inline-start-color', theme);
    expect(isHexColor(color ?? ''), `active-state-invalid: stripe color ${color}`).toBe(true);
  });
});

describe.each([...Object.entries({ light: themes.light, dark: themes.dark })])('hover and disabled in %s theme', (name, theme) => {
  test('hover changes the background of an enabled item (004-RF-06)', () => {
    expect(stateColor(HOVER, 'background-color', theme), 'state-not-distinct').not.toBe(
      stateColor(BASE, 'background-color', theme)
    );
  });

  test('hover on the active item changes its background too (004-RF-06)', () => {
    expect(stateColor(HOVER, 'background-color', theme), 'state-not-distinct').not.toBe(
      stateColor(ACTIVE, 'background-color', theme)
    );
  });

  test('a disabled item uses a text color different from the resting item (004-RF-08)', () => {
    expect(stateColor(DISABLED, 'color', theme), 'state-not-distinct').not.toBe(stateColor(BASE, 'color', theme));
  });
});

describe('keyboard focus (004-RF-07)', () => {
  test('draws a solid outline of at least 2px in both themes', () => {
    for (const theme of [themes.light, themes.dark]) {
      const outline = splitStroke(rule(FOCUS).get('outline'), theme);
      expect(outline.style, 'focus-outline-invalid').toBe('solid');
      expect(outline.width?.number >= 2, 'focus-outline-invalid').toBe(true);
    }
  });
});

describe('disabled item is only visual (004-RF-08, 004-CL-05)', () => {
  test('shows the not-allowed cursor without blocking activation', () => {
    expect(rule(DISABLED).get('cursor'), 'activation-blocked').toBe('not-allowed');
    expect(rule(DISABLED).get('pointer-events'), 'activation-blocked').not.toBe('none');
  });

  test('is excluded from the hover style', () => {
    expect(HOVER.includes(":not([aria-disabled='true'])"), 'activation-blocked').toBe(true);
    expect(findRule(model, HOVER), 'activation-blocked').toBeDefined();
  });
});

describe('state combinations (004-CL-01, 004-CL-03)', () => {
  test('active styles depend only on the aria-current attribute, so several active items all show them', () => {
    expect(findRule(model, STRIPE), 'active-state-invalid').toBeDefined();
    expect(findRule(model, ACTIVE), 'active-state-invalid').toBeDefined();
  });

  test('an active and disabled item keeps the stripe and gets the disabled text', () => {
    // La regla de franja no excluye el deshabilitado y la de fondo invertido si lo excluye
    expect(STRIPE.includes('aria-disabled'), 'active-state-invalid').toBe(false);
    expect(ACTIVE.includes(":not([aria-disabled='true']"), 'active-state-invalid').toBe(true);
    expect(rule(DISABLED).has('color'), 'state-not-distinct').toBe(true);
  });
});
