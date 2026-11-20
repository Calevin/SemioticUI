// @vitest-environment happy-dom
// Fichas de componente (005-RF-16 a 005-RF-23)
import { describe, expect, test } from 'vitest';
import { FIXTURE_SCRIPT, codesFor } from './site-fixtures.js';

const withFicha = (piece, change) => (list) => list.map((ficha) => (ficha.piece === piece ? { ...ficha, ...change(ficha) } : ficha));

describe('checkDocsSite: fichas de componente', () => {
  test('ficha-structure-invalid: sections follow title, description, preview, code, variants', () => {
    const mutate = { '/components/cards/': (html) => html.replace(' data-doc-section="description"', '') };
    expect(codesFor({ mutate }), 'ficha-structure-invalid').toContain('ficha-structure-invalid');
    const swapped = {
      '/components/code-tags/': (html) => html.replace('data-doc-section="preview"', 'data-doc-section="tmp"').replace('data-doc-section="code"', 'data-doc-section="preview"').replace('data-doc-section="tmp"', 'data-doc-section="code"'),
    };
    expect(codesFor({ mutate: swapped }), 'ficha-structure-invalid').toContain('ficha-structure-invalid');
  });

  test('ficha-structure-invalid: the description explains what it is and when to use it', () => {
    const mutate = { '/components/buttons/': (html) => html.replace('When to use it.', '') };
    expect(codesFor({ mutate }), 'ficha-structure-invalid').toContain('ficha-structure-invalid');
  });

  test('preview-invalid: the buttons preview shows the base and the disabled state', () => {
    const fichas = withFicha('.sm-btn', () => ({ preview: '<button class="sm-btn" type="button">Base</button>' }));
    expect(codesFor({ fichas }), 'preview-invalid').toContain('preview-invalid');
  });

  test('preview-invalid: the sidebar preview keeps an active and a disabled item', () => {
    const mutate = { '/components/sidebar/': (html) => html.replace(/ aria-disabled="true"/g, '') };
    expect(codesFor({ mutate }), 'preview-invalid').toContain('preview-invalid');
  });

  test('code-format-missing: the main preview code is shown as html, thymeleaf and react', () => {
    const mutate = { '/components/buttons/': (html) => html.replace(' data-format="react"', '') };
    expect(codesFor({ mutate }), 'code-format-missing').toContain('code-format-missing');
  });

  test('code-format-missing: thymeleaf uses th: and react imports a published specifier', () => {
    const noTh = withFicha('.sm-card', () => ({ thymeleaf: '<article class="sm-card"></article>' }));
    expect(codesFor({ fichas: noTh }), 'code-format-missing').toContain('code-format-missing');
    const badImport = withFicha('.sm-card', () => ({ react: 'export const C = () => <article className="sm-card" />;' }));
    expect(codesFor({ fichas: badImport }), 'code-format-missing').toContain('code-format-missing');
  });

  test('variant-missing: each derived variant has its preview and snippet', () => {
    const mutate = { '/components/buttons/': (html) => html.replace(/sm-btn--ghost/g, 'sm-btn--phantom') };
    expect(codesFor({ mutate }), 'variant-missing').toContain('variant-missing');
    const unmarked = { '/components/cards/': (html) => html.replace(' data-variant="info"', '') };
    expect(codesFor({ mutate: unmarked }), 'variant-missing').toContain('variant-missing');
  });

  test('variant-missing: element variants are matched by attribute', () => {
    const fichas = withFicha('<semiotic-alert>', (ficha) => ({ variants: ficha.variants.filter((variant) => variant.id !== 'warning') }));
    expect(codesFor({ fichas }), 'variant-missing').toContain('variant-missing');
  });

  test('variant-unexpected: a variant not derived from DESIGN.md is rejected', () => {
    const fichas = withFicha('.sm-btn', (ficha) => ({
      variants: [...ficha.variants, { id: 'xl', html: '<button class="sm-btn sm-btn--xl" type="button">XL</button>' }],
    }));
    expect(codesFor({ fichas }), 'variant-unexpected').toContain('variant-unexpected');
  });

  test('variant-section-empty: a piece without variants has no variants section', () => {
    const mutate = { '/components/code-tags/': (html) => html.replace('</main>', '<section data-doc-section="variants"></section></main>') };
    expect(codesFor({ mutate }), 'variant-section-empty').toContain('variant-section-empty');
    const heading = { '/components/sidebar/': (html) => html.replace('</article>', '<h2>Variants</h2></article>') };
    expect(codesFor({ mutate: heading }), 'variant-section-empty').toContain('variant-section-empty');
  });

  test('snippet-mismatch: the html snippet matches the rendered main preview', () => {
    const mutate = { '/components/cards/': (html) => html.replace(/<div class="doc-preview">/g, '$&<i>x</i>') };
    expect(codesFor({ mutate }), 'snippet-mismatch').toContain('snippet-mismatch');
  });

  test('snippet-mismatch: whitespace differences are normalized, content differences are not', () => {
    const spaced = withFicha('.sm-card', (ficha) => ({ preview: ficha.preview.replace(/\n\s*/g, '\n\n      ') }));
    expect(codesFor({ fichas: spaced }), 'snippet-mismatch').toEqual([]);
    const mutate = { '/components/buttons/': (html) => html.replace('type="button">Primary</button></div>', 'type="button">Primary!</button></div>') };
    expect(codesFor({ mutate }), 'snippet-mismatch').toContain('snippet-mismatch');
  });

  test('snippet-not-literal: snippets are text, never markup', () => {
    const mutate = { '/components/interactive-alerts/': (html) => html.replace('<code>', '<code><b>x</b>') };
    expect(codesFor({ mutate }), 'snippet-not-literal').toContain('snippet-not-literal');
  });

  test('alert-behavior-missing: the alerts ficha loads the component and has a dismissible alert', () => {
    const scripts = { '/components/interactive-alerts/': [FIXTURE_SCRIPT.replace('customElements', 'registry')] };
    expect(codesFor({ scripts }), 'alert-behavior-missing').toContain('alert-behavior-missing');
    const fichas = withFicha('<semiotic-alert>', () => ({ preview: '<semiotic-alert variant="warning">Static</semiotic-alert>' }));
    expect(codesFor({ fichas }), 'alert-behavior-missing').toContain('alert-behavior-missing');
  });

  test('alert-console-missing: the restore control and the event log are present and wired', () => {
    const mutate = { '/components/interactive-alerts/': (html) => html.replace('id="restore-alerts"', 'id="restore-x"') };
    expect(codesFor({ mutate }), 'alert-console-missing').toContain('alert-console-missing');
    const unwired = { '/components/interactive-alerts/': [FIXTURE_SCRIPT.replace('event-log', 'log')] };
    expect(codesFor({ scripts: unwired }), 'alert-console-missing').toContain('alert-console-missing');
  });

  test('sidebar-ficha-invalid: the sidebar ficha passes the Spec 004 demo check', () => {
    const fichas = withFicha('.sm-sidebar', (ficha) => ({ react: ficha.react.replace(/aria-disabled="true"/g, '') }));
    expect(codesFor({ fichas }), 'sidebar-ficha-invalid').toContain('sidebar-ficha-invalid');
  });
});
