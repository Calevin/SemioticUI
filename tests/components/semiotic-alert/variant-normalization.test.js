// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest';
import '../../../src/index.js';

// Crea y conecta una alerta con los atributos indicados
function mountAlert(attributes = {}) {
  const el = document.createElement('semiotic-alert');
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value);
  }
  document.body.append(el);
  return el;
}

function badgeText(el) {
  return el.shadowRoot.querySelector('.badge').textContent;
}

describe('semiotic-alert variant normalization', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test('an unknown variant value behaves as info', () => {
    const el = mountAlert({ variant: 'bogus' });
    expect(el.variant).toBe('info');
    expect(badgeText(el)).toBe('INFO');
  });

  test('a missing variant attribute behaves as info', () => {
    const el = mountAlert();
    expect(el.variant).toBe('info');
    expect(badgeText(el)).toBe('INFO');
  });

  test('a valid variant is preserved', () => {
    const el = mountAlert({ variant: 'warning' });
    expect(el.variant).toBe('warning');
    expect(badgeText(el)).toBe('CAUTION');
  });

  test('the variant setter normalizes invalid values to info', () => {
    const el = mountAlert({ variant: 'danger' });
    el.variant = 'not-a-variant';
    expect(el.getAttribute('variant')).toBe('info');
    expect(badgeText(el)).toBe('INFO');
  });
});
