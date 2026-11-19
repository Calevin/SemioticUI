// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest';
import '../../../src/index.js';

const MALICIOUS_MARKUP = '<img src=x onerror=alert(1)>';

// Atributos publicos cuyo valor se renderiza como texto dentro del Shadow DOM
const RENDERED_TEXT_ATTRIBUTES = ['heading', 'code'];

describe('semiotic-alert rendered text attributes', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test.each(RENDERED_TEXT_ATTRIBUTES)('the %s attribute renders markup as literal text', (attribute) => {
    const el = document.createElement('semiotic-alert');
    el.setAttribute(attribute, MALICIOUS_MARKUP);
    document.body.append(el);

    expect(el.shadowRoot.querySelector('img')).toBeNull();
    expect(el.shadowRoot.textContent).toContain(MALICIOUS_MARKUP);
  });

  test.each(RENDERED_TEXT_ATTRIBUTES)('updating the %s attribute after connection stays literal', (attribute) => {
    const el = document.createElement('semiotic-alert');
    document.body.append(el);
    el.setAttribute(attribute, MALICIOUS_MARKUP);

    expect(el.shadowRoot.querySelector('img')).toBeNull();
    expect(el.shadowRoot.textContent).toContain(MALICIOUS_MARKUP);
  });
});
