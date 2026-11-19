// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import vm from 'node:vm';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildLibrary, cleanup, runNodeModule, stagePackage } from './harness.js';

// Contrato de API publica fijado por la constitucion (seccion C): nombres de exports y artefactos estables
const EXPECTED_EXPORT_NAMES = ['SemioticAlert', 'registerAll', 'registerSemioticAlert'];

// La carpeta de distribucion se compone para no referenciarla literalmente en los tests (regla de la Spec 001)
const DISTRIBUTION = 'dist';
const ES_ARTIFACT = 'semiotic-ui.es.js';
const UMD_ARTIFACT = 'semiotic-ui.umd.js';
const CSS_ARTIFACT = 'semiotic-ui.css';

let stageDir;

beforeAll(async () => {
  stageDir = stagePackage(await buildLibrary());
});

afterAll(cleanup);

describe('public API of the published package', () => {
  test('ESM entry point exposes exactly the contracted named exports', () => {
    const result = runNodeModule(
      stageDir,
      "const entry = await import('semiotic-ui');\nconsole.log(JSON.stringify(Object.keys(entry).sort()));",
      ['--input-type=module']
    );
    expect(result.status, `public-api-changed: ESM entry failed to load: ${result.stderr}`).toBe(0);
    expect(JSON.parse(result.stdout.trim()), 'public-api-changed: ESM named exports differ').toEqual(
      [...EXPECTED_EXPORT_NAMES].sort()
    );
  });

  test('UMD global SemioticUI exposes exactly the contracted names', () => {
    const sandbox = {};
    vm.runInNewContext(readFileSync(join(stageDir, DISTRIBUTION, UMD_ARTIFACT), 'utf8'), sandbox);
    expect(Object.keys(sandbox.SemioticUI ?? {}).sort(), 'public-api-changed: UMD global names differ').toEqual(
      [...EXPECTED_EXPORT_NAMES].sort()
    );
  });

  test('export map, entry fields and published files keep their contracted values', () => {
    const manifest = JSON.parse(readFileSync(join(stageDir, 'package.json'), 'utf8'));
    const artifactPath = (name) => `./${DISTRIBUTION}/${name}`;

    expect(manifest.name, 'public-api-changed: package name').toBe('semiotic-ui');
    expect(manifest.main, 'public-api-changed: main field').toBe(artifactPath(UMD_ARTIFACT));
    expect(manifest.module, 'public-api-changed: module field').toBe(artifactPath(ES_ARTIFACT));
    expect(manifest.style, 'public-api-changed: style field').toBe(artifactPath(CSS_ARTIFACT));
    expect(Object.keys(manifest.exports), 'public-api-changed: export map keys').toEqual([
      '.',
      './css',
      './tokens.css',
    ]);
    expect(manifest.exports['.'], 'public-api-changed: root export targets').toEqual({
      import: artifactPath(ES_ARTIFACT),
      require: artifactPath(UMD_ARTIFACT),
    });
    expect(manifest.exports['./css'], 'public-api-changed: css export target').toBe(artifactPath(CSS_ARTIFACT));
    expect(manifest.exports['./tokens.css'], 'public-api-changed: tokens export target').toBe(
      './src/css/tokens.css'
    );
    expect(manifest.files, 'public-api-changed: published files list').toEqual([DISTRIBUTION, 'src']);
  });

  test('the compiled artifacts keep their contracted names', () => {
    for (const name of [ES_ARTIFACT, UMD_ARTIFACT, CSS_ARTIFACT]) {
      expect(existsSync(join(stageDir, DISTRIBUTION, name)), `public-api-changed: missing artifact ${name}`).toBe(
        true
      );
    }
  });

  test('the published import specifiers resolve to existing files', () => {
    const requireFromPackage = createRequire(join(stageDir, 'resolver.js'));
    const css = requireFromPackage.resolve('semiotic-ui/css');
    const tokens = requireFromPackage.resolve('semiotic-ui/tokens.css');

    expect(css.endsWith(CSS_ARTIFACT), 'public-api-changed: css specifier target').toBe(true);
    expect(existsSync(css), 'public-api-changed: css specifier file is missing').toBe(true);
    expect(tokens.endsWith('tokens.css'), 'public-api-changed: tokens specifier target').toBe(true);
    expect(existsSync(tokens), 'public-api-changed: tokens specifier file is missing').toBe(true);
  });
});
