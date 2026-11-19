// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest';
import '../../../src/index.js';

describe('semiotic-alert sm-dismiss event', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test('dismiss() emits a bubbling, composed and cancelable sm-dismiss event', () => {
    const el = document.createElement('semiotic-alert');
    el.setAttribute('variant', 'warning');
    el.setAttribute('code', 'WARN-702');
    document.body.append(el);

    const received = [];
    // Escuchamos en el documento para comprobar tambien que el evento burbujea
    document.addEventListener('sm-dismiss', (event) => received.push(event), { once: true });

    el.dismiss();

    expect(received).toHaveLength(1);
    const [event] = received;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toEqual({ variant: 'warning', code: 'WARN-702' });
    expect(el.hasAttribute('dismissed')).toBe(true);
  });

  test('clicking the close button emits sm-dismiss', () => {
    const el = document.createElement('semiotic-alert');
    el.setAttribute('dismissible', '');
    document.body.append(el);

    let count = 0;
    el.addEventListener('sm-dismiss', () => {
      count += 1;
    });

    el.shadowRoot.querySelector('.close-btn').click();
    expect(count).toBe(1);
  });
});
