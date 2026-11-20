// @vitest-environment happy-dom
// Tema del sitio de documentacion (005-RF-10, 005-RF-11, 005-RF-12, 005-RNF-06)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  initThemeToggle,
  readStoredTheme,
  toggleTheme,
} from '../../docs/src/scripts/theme.js';

// En el entorno happy-dom el URL global no es el de Node: la ruta se resuelve con node:path
const REPOSITORY = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BOOT_SOURCE = readFileSync(join(REPOSITORY, 'docs', 'src', 'scripts', 'theme-boot.js'), 'utf8');

// Almacenamiento en memoria con la misma interfaz que window.localStorage
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function throwingStorage() {
  const fail = () => {
    throw new Error('storage denied');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

// Ejecuta theme-boot.js tal como lo hace el navegador, sobre una ventana simulada y un documento propio
function runBoot(windowLike) {
  const doc = document.implementation.createHTMLDocument('boot');
  new Function('window', 'document', BOOT_SOURCE)(windowLike, doc);
  return doc.documentElement;
}

const storedWindow = (initial) => ({ localStorage: memoryStorage(initial) });

let consoleError;
let consoleWarn;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  document.documentElement.removeAttribute('data-sm-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

function expectSilentConsole() {
  expect(consoleError, 'theme-storage-unsafe').not.toHaveBeenCalled();
  expect(consoleWarn, 'theme-storage-unsafe').not.toHaveBeenCalled();
}

describe('theme-boot.js', () => {
  test('applies the stored dark theme before the first paint', () => {
    const root = runBoot(storedWindow({ [THEME_STORAGE_KEY]: 'dark' }));
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
  });

  test('keeps the light theme when nothing is stored', () => {
    const root = runBoot(storedWindow());
    expect(root.hasAttribute('data-sm-theme'), 'theme-default-invalid').toBe(false);
  });

  test('keeps the light theme for an unknown stored value', () => {
    for (const value of ['light', 'blue', 'DARK', '']) {
      const root = runBoot(storedWindow({ [THEME_STORAGE_KEY]: value }));
      expect(root.hasAttribute('data-sm-theme'), 'theme-default-invalid').toBe(false);
    }
  });

  test('does not throw nor log when reading localStorage throws', () => {
    const blocked = {
      get localStorage() {
        throw new Error('SecurityError');
      },
    };
    let root;
    expect(() => {
      root = runBoot(blocked);
    }, 'theme-storage-unsafe').not.toThrow();
    expect(root.hasAttribute('data-sm-theme'), 'theme-default-invalid').toBe(false);
    expectSilentConsole();
  });

  test('does not throw when getItem throws or storage is missing', () => {
    expect(() => runBoot({ localStorage: throwingStorage() }), 'theme-storage-unsafe').not.toThrow();
    expect(() => runBoot({}), 'theme-storage-unsafe').not.toThrow();
    expectSilentConsole();
  });

  test('uses the same storage key as the theme module', () => {
    expect(THEME_STORAGE_KEY, 'theme-not-persisted').toBe('sm-docs-theme');
    expect(BOOT_SOURCE.includes(`'${THEME_STORAGE_KEY}'`), 'theme-not-persisted').toBe(true);
  });
});

describe('theme.js', () => {
  test('readStoredTheme returns dark only for the stored dark value', () => {
    expect(readStoredTheme(() => memoryStorage({ [THEME_STORAGE_KEY]: 'dark' })), 'theme-not-applied').toBe('dark');
    expect(readStoredTheme(() => memoryStorage()), 'theme-default-invalid').toBe('light');
    expect(readStoredTheme(() => memoryStorage({ [THEME_STORAGE_KEY]: 'sepia' })), 'theme-default-invalid').toBe('light');
  });

  test('readStoredTheme falls back to light when storage is unavailable', () => {
    const unavailable = () => {
      throw new Error('SecurityError');
    };
    expect(() => readStoredTheme(unavailable), 'theme-storage-unsafe').not.toThrow();
    expect(readStoredTheme(unavailable), 'theme-default-invalid').toBe('light');
    expect(readStoredTheme(() => throwingStorage()), 'theme-default-invalid').toBe('light');
    expect(readStoredTheme(() => null), 'theme-default-invalid').toBe('light');
    expectSilentConsole();
  });

  test('applyTheme sets and removes the library dark attribute', () => {
    const root = document.documentElement;
    applyTheme(root, 'dark');
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
    applyTheme(root, 'light');
    expect(root.hasAttribute('data-sm-theme'), 'theme-not-applied').toBe(false);
  });

  test('toggleTheme alternates the page theme and persists the new one', () => {
    const storage = memoryStorage();
    const root = document.documentElement;
    expect(toggleTheme(root, () => storage), 'theme-not-applied').toBe('dark');
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY), 'theme-not-persisted').toBe('dark');
    expect(toggleTheme(root, () => storage), 'theme-not-applied').toBe('light');
    expect(root.hasAttribute('data-sm-theme'), 'theme-not-applied').toBe(false);
    expect(storage.getItem(THEME_STORAGE_KEY), 'theme-not-persisted').toBe('light');
  });

  test('toggleTheme keeps toggling when storage throws (005-RF-12)', () => {
    const root = document.documentElement;
    const unavailable = () => {
      throw new Error('SecurityError');
    };
    expect(() => toggleTheme(root, unavailable), 'theme-storage-unsafe').not.toThrow();
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
    expect(() => toggleTheme(root, () => throwingStorage()), 'theme-storage-unsafe').not.toThrow();
    expect(root.hasAttribute('data-sm-theme'), 'theme-not-applied').toBe(false);
    expectSilentConsole();
  });

  test('initThemeToggle wires the header control and returns a cleanup', () => {
    const storage = memoryStorage();
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    document.body.append(button);
    const root = document.documentElement;
    const cleanup = initThemeToggle(button, root, () => storage);
    button.click();
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY), 'theme-not-persisted').toBe('dark');
    cleanup();
    button.click();
    expect(root.getAttribute('data-sm-theme'), 'theme-not-applied').toBe('dark');
  });
});
