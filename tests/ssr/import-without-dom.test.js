// @vitest-environment node
import { describe, expect, test } from 'vitest';

// Verifica la seguridad SSR exigida por la constitucion: el modulo no debe tocar el DOM al importarse
describe('library entry point without a browser environment', () => {
  test('runs in an environment without DOM globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(typeof HTMLElement).toBe('undefined');
    expect(typeof customElements).toBe('undefined');
  });

  test('imports src/index.js without throwing', async () => {
    const module = await import('../../src/index.js');
    expect(typeof module.registerAll).toBe('function');
    expect(typeof module.registerSemioticAlert).toBe('function');
  });

  test('registerAll is a no-op when customElements is missing', async () => {
    const { registerAll } = await import('../../src/index.js');
    expect(() => registerAll()).not.toThrow();
  });
});
