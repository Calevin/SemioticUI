// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest';
import '../../../src/index.js';

describe('semiotic-alert cancelled dismissal', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test('preventDefault() on sm-dismiss keeps the alert visible', () => {
    const el = document.createElement('semiotic-alert');
    el.setAttribute('dismissible', '');
    document.body.append(el);

    el.addEventListener('sm-dismiss', (event) => event.preventDefault());

    const result = el.dismiss();

    expect(result).toBe(false);
    expect(el.hasAttribute('dismissed')).toBe(false);
    expect(el.dismissed).toBe(false);
  });
});
