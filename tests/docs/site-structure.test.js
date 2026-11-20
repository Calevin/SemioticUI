// @vitest-environment happy-dom
// Estructura comun de las paginas del sitio (005-RF-01 a 005-RF-04, 005-RF-10, 005-RF-11, 005-RF-24,
// 005-RNF-01, 005-RNF-04, 005-RNF-07)
import { describe, expect, test } from 'vitest';
import { FIXTURE_SCRIPT, codesFor, problemsFor } from './site-fixtures.js';

describe('checkDocsSite: estructura del sitio', () => {
  test('accepts the valid fixture site', () => {
    expect(problemsFor(), 'fixture site').toEqual([]);
  });

  test('page-missing: the not found page is required', () => {
    expect(codesFor({ drop: ['404'] }), 'page-missing').toContain('page-missing');
  });

  test('page-missing: every spec catalog piece needs its ficha page', () => {
    expect(codesFor({ drop: ['/components/cards/'] }), 'page-missing').toContain('page-missing');
  });

  test('page-unexpected: an html outside the url scheme is rejected', () => {
    const extra = [{ url: '/extra.html', html: '<!doctype html><html><head><title>x</title></head><body></body></html>' }];
    expect(codesFor({ extra }), 'page-unexpected').toContain('page-unexpected');
  });

  test('layout-invalid: the site sidebar must be the first child of the layout', () => {
    const mutate = { '/installation/': (html) => html.replace(' data-doc-nav', '') };
    expect(codesFor({ mutate }), 'layout-invalid').toContain('layout-invalid');
  });

  test('layout-invalid: main must follow the sidebar inside the layout', () => {
    const mutate = { '/': (html) => html.replace('<main id="main-content"', '<section id="main-content"').replace('</main>', '</section>') };
    expect(codesFor({ mutate }), 'layout-invalid').toContain('layout-invalid');
  });

  test('header-invalid: the theme control is required in every header', () => {
    const mutate = { '/components/cards/': (html) => html.replace('id="theme-toggle"', 'id="theme-switch"') };
    expect(codesFor({ mutate }), 'header-invalid').toContain('header-invalid');
  });

  test('header-invalid: the header shows the package version and has no h1', () => {
    expect(codesFor({ mutate: { '/': (html) => html.replace('V1.2.3', 'V0.0.1') } }), 'header-invalid').toContain('header-invalid');
    const withH1 = { '/installation/': (html) => html.replace('<p class="doc-brand">SEMIOTIC UI SYSTEM</p>', '<h1>SEMIOTIC UI SYSTEM</h1>') };
    expect(codesFor({ mutate: withH1 }), 'header-invalid').toContain('header-invalid');
  });

  test('skip-link-invalid: the skip link must be the first focusable element', () => {
    expect(codesFor({ mutate: { '/': (html) => html.replace('Skip to content', 'Skip') } }), 'skip-link-invalid').toContain(
      'skip-link-invalid'
    );
    const moved = {
      '/installation/': (html) =>
        html.replace('<a class="doc-skip-link" href="#main-content">Skip to content</a>', '<a href="/">Home</a><a class="doc-skip-link" href="#main-content">Skip to content</a>'),
    };
    expect(codesFor({ mutate: moved }), 'skip-link-invalid').toContain('skip-link-invalid');
  });

  test('title-invalid: titles must be distinct and include the page name', () => {
    const same = (html) => html.replace(/<title>[^<]*<\/title>/, '<title>Same</title>');
    expect(codesFor({ mutate: { '/': same, '/installation/': same } }), 'title-invalid').toContain('title-invalid');
  });

  test('theme-boot-missing: the head needs the inline boot script identical to its source', () => {
    const mutate = { '/': (html) => html.replace(/sm-docs-theme/g, 'sm-other-theme') };
    expect(codesFor({ mutate }), 'theme-boot-missing').toContain('theme-boot-missing');
    expect(codesFor({ boot: 'console.log(1)' }), 'theme-boot-missing').toContain('theme-boot-missing');
  });

  test('theme-script-missing: the page scripts must wire the theme control', () => {
    const scripts = { '/': [FIXTURE_SCRIPT.replace(/theme-toggle/g, 'x')] };
    expect(codesFor({ scripts }), 'theme-script-missing').toContain('theme-script-missing');
  });

  test('not-found-invalid: the 404 page needs its Not found heading', () => {
    const mutate = { 404: (html) => html.replace(/Not found/g, 'Missing') };
    expect(codesFor({ mutate }), 'not-found-invalid').toContain('not-found-invalid');
  });

  test('remote-resource: remote stylesheets, scheme-less images and remote css urls are rejected', () => {
    const remoteLink = { '/': (html) => html.replace('</head>', '<link rel="stylesheet" href="https://example.com/x.css"></head>') };
    expect(codesFor({ mutate: remoteLink }), 'remote-resource').toContain('remote-resource');
    const schemeLess = { '/installation/': (html) => html.replace('</body>', '<img src="//example.com/p.png" alt=""></body>') };
    expect(codesFor({ mutate: schemeLess }), 'remote-resource').toContain('remote-resource');
    const stylesheets = { '/': [".sm-sidebar-item{background:url('https://example.com/a.png')}[data-sm-theme]{}"] };
    expect(codesFor({ stylesheets }), 'remote-resource').toContain('remote-resource');
  });

  test('stylesheet-missing: every page links the library sheet with the dark tokens', () => {
    expect(codesFor({ stylesheets: { '/': [] } }), 'stylesheet-missing').toContain('stylesheet-missing');
    expect(codesFor({ stylesheets: { '/': ['.sm-sidebar-item{display:block}'] } }), 'stylesheet-missing').toContain(
      'stylesheet-missing'
    );
  });
});
