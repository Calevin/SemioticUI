// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildLibrary, cleanup, runNodeModule, stagePackage } from './harness.js';

let stageDir;

beforeAll(async () => {
  stageDir = stagePackage(await buildLibrary());
});

afterAll(cleanup);

describe('importing the published entry points without a browser', () => {
  test('ESM entry point loads in a clean node process without registering anything', () => {
    const script = [
      "const entry = await import('semiotic-ui');",
      'console.log(JSON.stringify({',
      '  hasRegisterAll: typeof entry.registerAll,',
      '  customElements: typeof customElements,',
      '  window: typeof window,',
      '}));',
    ].join('\n');

    const result = runNodeModule(stageDir, script, ['--input-type=module']);
    expect(result.status, `ssr-import-threw: ${result.stderr}`).toBe(0);

    const report = JSON.parse(result.stdout.trim());
    expect(report.hasRegisterAll, 'ssr-import-threw: registerAll is not exposed').toBe('function');
    expect(report.customElements, 'ssr-import-threw: customElements appeared in node').toBe('undefined');
    expect(report.window, 'ssr-import-threw: window appeared in node').toBe('undefined');
  });

  test('UMD entry point runs in an empty context without registering anything', () => {
    const umdCode = readFileSync(join(stageDir, 'dist', 'semiotic-ui.umd.js'), 'utf8');
    const sandbox = {};

    expect(() => vm.runInNewContext(umdCode, sandbox), 'ssr-import-threw: UMD threw without a DOM').not.toThrow();
    expect(typeof sandbox.SemioticUI?.registerAll, 'ssr-import-threw: UMD global is missing').toBe('function');
    expect('customElements' in sandbox, 'ssr-import-threw: UMD created customElements').toBe(false);
  });
});
