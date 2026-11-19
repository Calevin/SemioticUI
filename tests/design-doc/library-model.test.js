// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { collectLibraryModel, extractEventNames, loadRepositorySources } from './repository-sources.js';

// Recolector de la Spec 002 sobre la libreria real (002-RF-14, 002-RF-16, 002-RF-17, 002-CL-06)
let library;

beforeAll(async () => {
  library = await collectLibraryModel(loadRepositorySources());
});

describe('collectLibraryModel', () => {
  test('enumerates the custom elements registered by the global registration', () => {
    expect(library.elements.map((element) => element.name)).toEqual(['semiotic-alert']);
  });

  test('reads the observed attributes of semiotic-alert', () => {
    expect(library.elements[0].attributes).toEqual(['close-label', 'code', 'dismissed', 'dismissible', 'heading', 'variant']);
  });

  test('extracts the emitted events from the component source', () => {
    expect(library.elements[0].events).toEqual(['sm-dismiss', 'sm-show']);
  });

  test('reads parts and named slots from the shadow DOM of a fresh instance', () => {
    expect(library.elements[0].parts).toEqual(['badge', 'base', 'body', 'close-button', 'code', 'header', 'heading']);
    expect(library.elements[0].slots).toEqual(['heading']);
  });

  test('lists the public exports of the entry point', () => {
    expect(library.exports).toEqual(['SemioticAlert', 'registerAll', 'registerSemioticAlert']);
  });

  test('uses the package version', () => {
    expect(library.version).toBe(loadRepositorySources().packageVersion);
  });

  test('event extraction only accepts literal sm-* event types', () => {
    const source = "new CustomEvent('sm-a'); new Event(\"sm-b\"); new CustomEvent(name); new CustomEvent('click');";
    expect(extractEventNames(source)).toEqual(['sm-a', 'sm-b']);
  });

  test('shadow DOM fallback values are not part of the model (002-CL-06)', () => {
    expect(JSON.stringify(library)).not.toContain('#f4f1ea');
  });
});
