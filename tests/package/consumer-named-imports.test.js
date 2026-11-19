// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  MODALITIES,
  buildLibrary,
  bundleConsumer,
  cleanup,
  countDefinitions,
  installConsumer,
  runInWindow,
  stagePackage,
} from './harness.js';

// El codigo de ejemplo de los consumidores usa comillas dobles en el especificador para distinguirlo
// de los imports reales de este archivo (el verificador inspecciona los imports con comillas simples)

// Consumidor que llama explicitamente al registro global
const REGISTER_ALL_SOURCE = 'import { registerAll } from "semiotic-ui";\nregisterAll();\n';

// Consumidor que solo referencia la clase: el auto-registro debe ocurrir igualmente
const CLASS_ONLY_SOURCE = 'import { SemioticAlert } from "semiotic-ui";\nglobalThis.__sm_keep = SemioticAlert;\n';

// Consumidor que importa el paquete de tres formas y repite el registro
const MULTIPLE_IMPORTS_SOURCE = [
  'import "semiotic-ui";',
  'import { registerAll, registerSemioticAlert } from "semiotic-ui";',
  'registerAll();',
  'registerAll();',
  'registerSemioticAlert();',
  '',
].join('\n');

let libraryOutDir;

beforeAll(async () => {
  libraryOutDir = await buildLibrary();
});

afterAll(cleanup);

describe('named imports in a production consumer bundle', () => {
  for (const modality of MODALITIES) {
    describe(`modality ${modality}`, () => {
      let consumerDir;

      beforeAll(() => {
        consumerDir = installConsumer(stagePackage(libraryOutDir), modality);
      });

      test('defines the tag when the consumer calls registerAll', async () => {
        const bundle = await bundleConsumer(consumerDir, REGISTER_ALL_SOURCE);
        const window = runInWindow(bundle);
        expect(
          typeof window.customElements.get('semiotic-alert'),
          `tag-not-defined: registerAll consumer (${modality})`
        ).toBe('function');
      });

      test('defines the tag when the consumer only references the class', async () => {
        const bundle = await bundleConsumer(consumerDir, CLASS_ONLY_SOURCE);
        const window = runInWindow(bundle);
        expect(
          typeof window.customElements.get('semiotic-alert'),
          `tag-not-defined: class-only consumer (${modality})`
        ).toBe('function');
      });
    });
  }

  test('defines the tag exactly once when the package is imported several times in one bundle', async () => {
    const consumerDir = installConsumer(stagePackage(libraryOutDir), 'tarball');
    const bundle = await bundleConsumer(consumerDir, MULTIPLE_IMPORTS_SOURCE);

    let definitions;
    expect(() => {
      const window = runInWindow(bundle, (target) => {
        definitions = countDefinitions(target, 'semiotic-alert');
      });
      expect(
        typeof window.customElements.get('semiotic-alert'),
        'tag-not-defined: multiple-imports consumer'
      ).toBe('function');
    }, 'idempotence-broken: repeated registration threw').not.toThrow();
    expect(definitions.count, 'idempotence-broken: tag was defined more than once').toBe(1);
  });
});
