// @vitest-environment node
// Estructura del Sidebar (004-RF-01 a 004-RF-04, 004-RF-09, 004-RF-10, 004-CL-02, 004-CL-04)
import { readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  COMPONENT_LAYER,
  COMPONENTS_DIR,
  findRule,
  listMerged,
  loadSidebarModel,
  parseLength,
  parseRules,
  readSidebarCss,
} from './css-rules.js';

const REQUIRED_SELECTORS = [
  '.sm-sidebar',
  '.sm-sidebar-menu',
  '.sm-sidebar-label',
  '.sm-sidebar-item',
  ".sm-sidebar-item:hover:not([aria-disabled='true'])",
  '.sm-sidebar-item:focus-visible',
  ".sm-sidebar-item[aria-current='page']",
  ".sm-sidebar-item[aria-current='page']:not([aria-disabled='true'], :hover)",
  ".sm-sidebar-item[aria-disabled='true']",
  '.sm-sidebar-layout',
  '.sm-sidebar-layout > .sm-sidebar, .sm-sidebar-layout > :not(.sm-sidebar)',
];
const OVERFLOW_PROPERTIES = ['overflow', 'overflow-x', 'overflow-y', 'overflow-inline', 'overflow-block'];
const WIDTH_PROPERTIES = ['width', 'inline-size', 'max-width', 'max-inline-size'];
const RESERVING_PROPERTIES = [
  'padding',
  'padding-block',
  'padding-block-start',
  'padding-top',
  'min-height',
  'min-block-size',
  'height',
  'block-size',
  'grid-template-rows',
];

const model = loadSidebarModel();
const rule = (selector) => findRule(model, selector) ?? new Map();
// Reglas del Sidebar en cualquier contexto cuyo selector incluye el bloque indicado
const rulesFor = (pattern) => listMerged(model).filter((entry) => pattern.test(entry.selector));

describe('sidebar stylesheet structure', () => {
  test('exists and keeps every rule inside the components layer', () => {
    const css = readSidebarCss();
    expect(css, 'css-rule-missing').not.toBeNull();
    const rules = parseRules(css ?? '');
    expect(rules.length, 'css-rule-missing').toBeGreaterThan(0);
    for (const entry of rules) {
      expect(entry.context[0], `css-rule-missing: ${entry.selector} outside ${COMPONENT_LAYER}`).toBe(COMPONENT_LAYER);
    }
  });

  test('declares every selector of the public contract', () => {
    for (const selector of REQUIRED_SELECTORS) {
      expect(findRule(model, selector), `css-rule-missing: ${selector}`).toBeDefined();
    }
  });

  test('adds no Custom Element: the components directory only holds semiotic-alert', () => {
    expect(readdirSync(COMPONENTS_DIR), 'custom-element-added').toEqual(['semiotic-alert.js']);
  });
});

describe('sidebar label typography (004-RF-03)', () => {
  test('uses the monospaced family', () => {
    expect(rule('.sm-sidebar-label').get('font-family'), 'label-typography-invalid').toBe('var(--sm-font-mono)');
  });

  test('is uppercase', () => {
    expect(rule('.sm-sidebar-label').get('text-transform'), 'label-typography-invalid').toBe('uppercase');
  });

  test('uses a letter spacing between 0.04em and 0.08em', () => {
    const spacing = parseLength(rule('.sm-sidebar-label').get('letter-spacing') ?? '');
    expect(spacing?.unit, 'label-typography-invalid').toBe('em');
    expect(spacing?.number >= 0.04 && spacing?.number <= 0.08, 'label-typography-invalid').toBe(true);
  });
});

describe('sidebar item width (004-RF-04)', () => {
  test('is a block box without a declared width in any rule', () => {
    expect(['block', 'flex'].includes(rule('.sm-sidebar-item').get('display')), 'item-not-full-width').toBe(true);
    for (const entry of rulesFor(/\.sm-sidebar-item/)) {
      for (const property of WIDTH_PROPERTIES) {
        expect(entry.declarations.has(property), `item-not-full-width: ${entry.selector} ${property}`).toBe(false);
      }
    }
  });
});

describe('long text wraps inside the sidebar (004-RF-09)', () => {
  test('items and labels break long words', () => {
    expect(rule('.sm-sidebar-item').get('overflow-wrap'), 'text-overflow-possible').toBe('anywhere');
    expect(rule('.sm-sidebar-label').get('overflow-wrap'), 'text-overflow-possible').toBe('anywhere');
  });

  test('no sidebar rule prevents wrapping or clips text', () => {
    for (const entry of rulesFor(/\.sm-sidebar(?!-layout)/)) {
      const { declarations, selector } = entry;
      expect(declarations.get('white-space') === 'nowrap', `text-overflow-possible: ${selector} nowrap`).toBe(false);
      expect(declarations.has('text-overflow'), `text-overflow-possible: ${selector} text-overflow`).toBe(false);
      for (const property of OVERFLOW_PROPERTIES) {
        expect(declarations.has(property), `text-overflow-possible: ${selector} ${property}`).toBe(false);
      }
    }
  });

  test('the sidebar and the layout regions can shrink below their content', () => {
    expect(rule('.sm-sidebar').get('min-width'), 'text-overflow-possible').toBe('0');
    expect(
      rule('.sm-sidebar-layout > .sm-sidebar, .sm-sidebar-layout > :not(.sm-sidebar)').get('min-width'),
      'text-overflow-possible'
    ).toBe('0');
  });
});

describe('menus without label and empty sidebars (004-RF-10, 004-CL-02)', () => {
  test('the menu reserves no block space for the label', () => {
    for (const entry of rulesFor(/^\.sm-sidebar-menu$/)) {
      for (const property of RESERVING_PROPERTIES) {
        expect(entry.declarations.has(property), `label-space-reserved: ${property}`).toBe(false);
      }
    }
  });

  test('the sidebar declares no minimum height', () => {
    for (const entry of rulesFor(/^\.sm-sidebar$/)) {
      expect(entry.declarations.has('min-height'), 'label-space-reserved: min-height').toBe(false);
      expect(entry.declarations.has('min-block-size'), 'label-space-reserved: min-block-size').toBe(false);
    }
  });
});

describe('long lists grow with the page (004-CL-04)', () => {
  test('the sidebar is neither sticky nor height constrained', () => {
    for (const entry of rulesFor(/^\.sm-sidebar$/)) {
      const position = entry.declarations.get('position');
      expect(position === 'sticky' || position === 'fixed', 'sidebar-height-constrained: position').toBe(false);
      for (const property of ['height', 'max-height', 'block-size', 'max-block-size', ...OVERFLOW_PROPERTIES]) {
        expect(entry.declarations.has(property), `sidebar-height-constrained: ${property}`).toBe(false);
      }
    }
  });
});
