// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import { checkDesignDoc, formatDiscrepancies } from '../../tools/design-doc/check-design-doc.js';
import { buildCheckInput, collectLibraryModel, loadRepositorySources } from './repository-sources.js';

// Coherencia del DESIGN.md real con la libreria (002-RF-01, 002-RF-02, 002-RF-03, 002-RF-20)
describe('DESIGN.md coherence', () => {
  test('matches the tokens, classes and components of the library', async () => {
    const sources = loadRepositorySources();
    const library = await collectLibraryModel(sources);
    const list = checkDesignDoc(buildCheckInput(sources, library));
    // El informe completo viaja en el mensaje para que el desarrollador vea cada discrepancia
    expect(list, `DESIGN.md discrepancies:\n${formatDiscrepancies(list)}\n`).toEqual([]);
  });
});
