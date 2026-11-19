// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import { registerAll, SemioticAlert } from '../../../src/index.js';

describe('semiotic-alert registration', () => {
  test('calling registerAll twice keeps a single definition without throwing', () => {
    expect(() => {
      registerAll();
      registerAll();
    }).not.toThrow();
    expect(customElements.get('semiotic-alert')).toBe(SemioticAlert);
  });
});
