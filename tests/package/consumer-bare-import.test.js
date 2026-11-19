// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  MODALITIES,
  buildLibrary,
  bundleConsumer,
  cleanup,
  installConsumer,
  runInWindow,
  stagePackage,
} from './harness.js';

// El consumidor nunca menciona la etiqueta: su presencia en el bundle prueba la inclusion del componente
const BARE_IMPORT = "import 'semiotic-ui';\n";

let libraryOutDir;

beforeAll(async () => {
  libraryOutDir = await buildLibrary();
});

afterAll(cleanup);

describe('bare import in a production consumer bundle', () => {
  for (const modality of MODALITIES) {
    describe(`modality ${modality}`, () => {
      let bundle;

      beforeAll(async () => {
        const consumerDir = installConsumer(stagePackage(libraryOutDir), modality);
        bundle = await bundleConsumer(consumerDir, BARE_IMPORT);
      });

      test('includes the component code in the bundle', () => {
        expect(
          bundle.includes('semiotic-alert'),
          `component-not-included: bundle of ${bundle.length} bytes lacks the component (${modality})`
        ).toBe(true);
      });

      test('defines the tag when the bundle runs, without calling any register function', () => {
        const window = runInWindow(bundle);
        const definition = window.customElements.get('semiotic-alert');
        expect(typeof definition, `tag-not-defined: semiotic-alert is undefined (${modality})`).toBe('function');
        const element = window.document.createElement('semiotic-alert');
        expect(element.shadowRoot, `tag-not-defined: element was not upgraded (${modality})`).not.toBeNull();
      });
    });
  }

  test('control: a manifest that omits the compiled artifacts drops the component', async () => {
    // Prueba que el harness detecta el defecto original: sin las entradas de distribucion el bundle sale vacio
    const legacyManifestStage = stagePackage(libraryOutDir, {
      sideEffects: ['**/*.css', './src/index.js'],
    });
    const consumerDir = installConsumer(legacyManifestStage, 'link');
    const bundle = await bundleConsumer(consumerDir, BARE_IMPORT);
    expect(bundle.includes('semiotic-alert'), 'control-failed: harness cannot detect a dropped component').toBe(false);
  });
});
