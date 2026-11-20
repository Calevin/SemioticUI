// @vitest-environment node
// Layout con sidebar medido sobre su propio ancho (004-RF-11, 004-RF-12)
import { describe, expect, test } from 'vitest';
import { COMPONENT_LAYER, findRule, listMerged, loadSidebarModel, parseLength } from './css-rules.js';

const LAYOUT = '.sm-sidebar-layout';
const BOTH = '.sm-sidebar-layout > .sm-sidebar, .sm-sidebar-layout > :not(.sm-sidebar)';
const SIDEBAR = '.sm-sidebar-layout > .sm-sidebar';
const CONTENT = '.sm-sidebar-layout > :not(.sm-sidebar)';

const model = loadSidebarModel();
const entries = listMerged(model);

// Contexto de container query sobre el layout con umbral de 48rem
function wideContext() {
  const found = entries
    .map((entry) => entry.context[1])
    .find((at) => {
      if (!at || !at.startsWith('@container sm-sidebar-layout')) return false;
      return /\(width >= 48rem\)/.test(at) || /\(min-width: 48rem\)/.test(at);
    });
  return found ? [COMPONENT_LAYER, found] : null;
}

describe('sidebar layout container (004-RF-11, 004-RF-12)', () => {
  test('is a wrapping flex container queried by its own inline size', () => {
    const layout = findRule(model, LAYOUT) ?? new Map();
    expect(layout.get('container-type'), 'layout-rule-missing').toBe('inline-size');
    expect(layout.get('container-name'), 'layout-rule-missing').toBe('sm-sidebar-layout');
    expect(layout.get('display'), 'layout-rule-missing').toBe('flex');
    expect(layout.get('flex-wrap'), 'layout-rule-missing').toBe('wrap');
  });

  test('stacks the sidebar above the content with full width below 48rem', () => {
    const both = findRule(model, BOTH) ?? new Map();
    expect(both.get('flex'), 'layout-rule-missing').toBe('1 1 100%');
    for (const entry of entries.filter((item) => item.selector.includes('sm-sidebar-layout'))) {
      expect(entry.declarations.has('order'), `layout-rule-missing: order in ${entry.selector}`).toBe(false);
    }
  });

  test('places a fixed rem sidebar on the left from 48rem on', () => {
    const context = wideContext();
    expect(context, 'layout-rule-missing: container query').not.toBeNull();
    const flex = (findRule(model, SIDEBAR, context ?? []) ?? new Map()).get('flex') ?? '';
    const [grow, shrink, basis] = flex.split(' ');
    expect(grow === '0' && shrink === '0', 'layout-rule-missing: sidebar must not flex').toBe(true);
    expect(parseLength(basis ?? '')?.unit, 'layout-rule-missing: sidebar width in rem').toBe('rem');
  });

  test('gives the remaining width to the content from 48rem on', () => {
    const context = wideContext();
    const flex = (findRule(model, CONTENT, context ?? []) ?? new Map()).get('flex');
    expect(['1 1 0', '1 1 0%'].includes(flex), 'layout-rule-missing: content flex').toBe(true);
  });

  test('does not depend on the viewport width', () => {
    const viewportRules = entries.filter(
      (entry) => entry.selector.includes('sm-sidebar-layout') && entry.context.some((at) => at.startsWith('@media'))
    );
    expect(viewportRules, 'layout-rule-missing: media query').toEqual([]);
  });
});
