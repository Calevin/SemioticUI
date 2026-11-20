// Modelo del sitio derivado de DESIGN.md (005-RF-06, 005-RF-15, 005-RF-18, 005-CL-01)
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  SPEC_CATALOG,
  componentUrl,
  deriveCatalog,
  kebabCase,
  packageReferences,
  pageUrlFromFile,
} from '../../tools/docs-check/site-model.js';
import { FIXTURE_DESIGN, FIXTURE_PACKAGE } from './site-fixtures.js';

const REAL_DESIGN = readFileSync(new URL('../../DESIGN.md', import.meta.url), 'utf8');
const REAL_PACKAGE = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

function byPiece(catalog) {
  return Object.fromEntries(catalog.map((entry) => [entry.piece, entry]));
}

describe('deriveCatalog', () => {
  test('derives the five current pieces and their variants from the real DESIGN.md', () => {
    const catalog = byPiece(deriveCatalog(REAL_DESIGN));
    expect(Object.keys(catalog).sort(), 'catalog-entry-missing').toEqual(
      ['.sm-btn', '.sm-card', '.sm-code-tag', '.sm-sidebar', '<semiotic-alert>'].sort()
    );
    expect(catalog['.sm-btn'].variants, 'variant-missing').toEqual([
      'primary',
      'info',
      'success',
      'warning',
      'danger',
      'ghost',
      'sm',
      'lg',
    ]);
    expect(catalog['.sm-card'].variants, 'variant-missing').toEqual(['info', 'success', 'warning', 'danger', 'compact']);
    expect(catalog['.sm-code-tag'].variants, 'variant-section-empty').toEqual([]);
    expect(catalog['.sm-sidebar'].variants, 'variant-section-empty').toEqual([]);
    expect(catalog['<semiotic-alert>']).toMatchObject({ kind: 'element', variants: ['info', 'success', 'warning', 'danger'] });
  });

  test('every spec catalog piece is present in the real inventory', () => {
    const pieces = deriveCatalog(REAL_DESIGN).map((entry) => entry.piece);
    for (const entry of SPEC_CATALOG) expect(pieces, 'catalog-entry-missing').toContain(entry.piece);
  });

  test('a new piece in the inventory joins the derived catalog (005-CL-01)', () => {
    const design = FIXTURE_DESIGN.replace(
      '| `.sm-btn` | Clase CSS | Disponible |',
      '| `.sm-btn` | Clase CSS | Disponible |\n| `.sm-gauge` | Clase CSS | Disponible |'
    );
    const catalog = byPiece(deriveCatalog(design));
    expect(catalog['.sm-gauge'], 'catalog-entry-missing').toEqual({ piece: '.sm-gauge', kind: 'class', variants: [] });
  });

  test('a new modifier row adds a variant without repeating existing ones', () => {
    const design = FIXTURE_DESIGN.replace(
      '| `.sm-btn--ghost` | Ghost |',
      '| `.sm-btn--ghost` | Ghost |\n| `.sm-btn--xl` | Extra |\n| `.sm-btn--ghost` | Repeated |'
    );
    expect(byPiece(deriveCatalog(design))['.sm-btn'].variants, 'variant-missing').toEqual(['primary', 'ghost', 'xl']);
  });

  test('ignores the global reset, tables outside the inventory and rows of other blocks', () => {
    const design = `${FIXTURE_DESIGN}\n\n| Clase | Uso |\n| :--- | :--- |\n| \`.sm-btn--outside\` | Fuera |\n`;
    const catalog = deriveCatalog(design);
    expect(catalog.map((entry) => entry.piece), 'page-unexpected').not.toContain('body');
    expect(byPiece(catalog)['.sm-btn'].variants, 'variant-unexpected').not.toContain('outside');
    expect(byPiece(catalog)['.sm-card'].variants, 'variant-unexpected').not.toContain('header');
  });

  test('reads element variants from the variant row of its attribute table', () => {
    expect(byPiece(deriveCatalog(FIXTURE_DESIGN))['<semiotic-alert>'].variants, 'variant-missing').toEqual([
      'info',
      'warning',
    ]);
  });

  test('returns an empty catalog without an inventory region', () => {
    expect(deriveCatalog('# Sin inventario\n\n| Pieza | Tipo | Estado |\n| :--- | :--- | :--- |\n'), 'catalog-entry-missing').toEqual([]);
  });
});

describe('urls and package references', () => {
  test('kebabCase and componentUrl follow the url scheme', () => {
    expect(kebabCase('Interactive Alerts')).toBe('interactive-alerts');
    expect(kebabCase(' Code Tags ')).toBe('code-tags');
    expect(componentUrl('Buttons'), 'catalog-name-invalid').toBe('/components/buttons/');
    for (const entry of SPEC_CATALOG) expect(componentUrl(entry.name), 'catalog-name-invalid').toBe(`/components/${entry.slug}/`);
  });

  test('pageUrlFromFile maps compiled files to their public urls', () => {
    expect(pageUrlFromFile('index.html')).toBe('/');
    expect(pageUrlFromFile('installation/index.html')).toBe('/installation/');
    expect(pageUrlFromFile('components/buttons/index.html')).toBe('/components/buttons/');
    expect(pageUrlFromFile('404.html')).toBe('404');
    expect(pageUrlFromFile('extra.html'), 'page-unexpected').toBe('/extra.html');
  });

  test('packageReferences lists the published specifiers and artifacts', () => {
    const real = packageReferences(REAL_PACKAGE);
    expect([...real.specifiers].sort(), 'install-reference-invalid').toEqual(
      ['semiotic-ui', 'semiotic-ui/css', 'semiotic-ui/tokens.css'].sort()
    );
    expect(real.artifacts.has(['dist', 'semiotic-ui.css'].join('/')), 'install-reference-invalid').toBe(true);
    expect(real.artifacts.has(['dist', 'semiotic-ui.umd.js'].join('/')), 'install-reference-invalid').toBe(true);
    const fixture = packageReferences(FIXTURE_PACKAGE);
    expect(fixture).toMatchObject({ name: 'semiotic-ui', version: '1.2.3' });
    expect(fixture.specifiers.has('semiotic-ui/styles'), 'install-reference-invalid').toBe(false);
  });
});
