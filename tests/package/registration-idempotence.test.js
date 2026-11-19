// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  buildLibrary,
  bundleConsumer,
  cleanup,
  countDefinitions,
  installConsumer,
  runInWindow,
  stagePackage,
} from './harness.js';

// Comillas dobles en el codigo de ejemplo del consumidor: no son imports reales de este archivo
const BARE_IMPORT = 'import "semiotic-ui";\n';
const REPEATED_REGISTER_SOURCE =
  'import { registerAll } from "semiotic-ui";\nregisterAll();\nregisterAll();\nregisterAll();\n';

let bareBundle;
let repeatedRegisterBundle;

beforeAll(async () => {
  const stageDir = stagePackage(await buildLibrary());
  const consumerDir = installConsumer(stageDir, 'link');
  bareBundle = await bundleConsumer(consumerDir, BARE_IMPORT);
  repeatedRegisterBundle = await bundleConsumer(consumerDir, REPEATED_REGISTER_SOURCE);
});

afterAll(cleanup);

describe('registration when the tag is already defined', () => {
  test('keeps a previous definition and does not throw when the bundle loads', () => {
    let previousClass;
    let window;

    expect(() => {
      window = runInWindow(bareBundle, (target) => {
        previousClass = class PreviousDefinition extends target.HTMLElement {};
        target.customElements.define('semiotic-alert', previousClass);
      });
    }, 'idempotence-broken: loading over a previous definition threw').not.toThrow();

    expect(
      window.customElements.get('semiotic-alert'),
      'idempotence-broken: previous definition was replaced'
    ).toBe(previousClass);
  });

  test('loading the same bundle twice in one window does not throw and defines the tag once', () => {
    let definitions;
    const window = runInWindow(bareBundle, (target) => {
      definitions = countDefinitions(target, 'semiotic-alert');
    });

    expect(() => window.eval(bareBundle), 'idempotence-broken: second load threw').not.toThrow();
    expect(definitions.count, 'idempotence-broken: second load defined the tag again').toBe(1);
  });

  test('repeated explicit registration does not throw and defines the tag once', () => {
    let definitions;

    expect(() => {
      runInWindow(repeatedRegisterBundle, (target) => {
        definitions = countDefinitions(target, 'semiotic-alert');
      });
    }, 'idempotence-broken: repeated registerAll threw').not.toThrow();
    expect(definitions.count, 'idempotence-broken: repeated registerAll defined the tag again').toBe(1);
  });
});
