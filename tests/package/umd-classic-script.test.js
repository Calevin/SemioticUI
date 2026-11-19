// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildLibrary, cleanup, runInWindow, stagePackage } from './harness.js';

let umdCode;

beforeAll(async () => {
  const stageDir = stagePackage(await buildLibrary());
  umdCode = readFileSync(join(stageDir, 'dist', 'semiotic-ui.umd.js'), 'utf8');
});

afterAll(cleanup);

describe('UMD artifact loaded as a classic script', () => {
  test('defines the tag without any additional call', () => {
    const window = runInWindow(umdCode);
    expect(
      typeof window.customElements.get('semiotic-alert'),
      'tag-not-defined: UMD script did not register semiotic-alert'
    ).toBe('function');
  });

  test('exposes the SemioticUI global with the registration function', () => {
    const window = runInWindow(umdCode);
    expect(
      typeof window.SemioticUI?.registerAll,
      'tag-not-defined: SemioticUI global is missing registerAll'
    ).toBe('function');
  });
});
