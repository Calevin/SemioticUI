// @vitest-environment happy-dom
// Paginas Introduction e Installation (005-RF-13, 005-RF-14, 005-RF-15)
import { describe, expect, test } from 'vitest';
import { codesFor } from './site-fixtures.js';

describe('checkDocsSite: Getting started', () => {
  test('intro-content-invalid: the purpose paragraph names the Semiotic Standard', () => {
    const mutate = { '/': (html) => html.replace(/Semiotic Standard/g, 'Semiotic') };
    expect(codesFor({ mutate }), 'intro-content-invalid').toContain('intro-content-invalid');
  });

  test('intro-content-invalid: exactly two consumption channels, bundler and script from a CDN', () => {
    const three = { '/': (html) => html.replace('</ul><p>Continue', '<li>Another channel.</li></ul><p>Continue') };
    expect(codesFor({ mutate: three }), 'intro-content-invalid').toContain('intro-content-invalid');
    const noCdn = { '/': (html) => html.replace('from a CDN or your server', 'from your server') };
    expect(codesFor({ mutate: noCdn }), 'intro-content-invalid').toContain('intro-content-invalid');
    const noBundler = { '/': (html) => html.replace('Applications with a bundler.', 'Modern applications.') };
    expect(codesFor({ mutate: noBundler }), 'intro-content-invalid').toContain('intro-content-invalid');
  });

  test('install-content-invalid: the guide installs the package from npm', () => {
    const mutate = { '/installation/': (html) => html.replace('npm install semiotic-ui', 'yarn add semiotic-ui') };
    expect(codesFor({ mutate }), 'install-content-invalid').toContain('install-content-invalid');
  });

  test('install-content-invalid: every step has a description and a snippet', () => {
    const mutate = { '/installation/': (html) => html.replace('<li><p>Install the package.</p>', '<li>') };
    expect(codesFor({ mutate }), 'install-content-invalid').toContain('install-content-invalid');
    const noList = { '/installation/': (html) => html.replace('<ol class="doc-steps">', '<ol>') };
    expect(codesFor({ mutate: noList }), 'install-content-invalid').toContain('install-content-invalid');
  });

  test('install-content-invalid: the guide covers the classic CDN tags', () => {
    const mutate = { '/installation/': (html) => html.replace(/&lt;script src=[^\n]*?&lt;\/script&gt;/, '') };
    expect(codesFor({ mutate }), 'install-content-invalid').toContain('install-content-invalid');
  });

  test('install-reference-invalid: cdn urls use the current package version', () => {
    const mutate = { '/installation/': (html) => html.replace(/semiotic-ui@1\.2\.3/g, 'semiotic-ui@9.9.9') };
    expect(codesFor({ mutate }), 'install-reference-invalid').toContain('install-reference-invalid');
  });

  test('install-reference-invalid: cdn urls point to a published artifact', () => {
    const mutate = { '/installation/': (html) => html.replace('semiotic-ui.umd.js', 'semiotic-ui.min.js') };
    expect(codesFor({ mutate }), 'install-reference-invalid').toContain('install-reference-invalid');
  });

  test('install-reference-invalid: import specifiers must be published by the package', () => {
    const mutate = { '/installation/': (html) => html.replace('semiotic-ui/css', 'semiotic-ui/styles') };
    expect(codesFor({ mutate }), 'install-reference-invalid').toContain('install-reference-invalid');
  });
});
