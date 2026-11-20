// @vitest-environment happy-dom
// Herramienta de chequeo de la demo del Sidebar (004-RF-16, 004-RF-18)
import { describe, expect, test } from 'vitest';
import { checkSidebarDemo } from '../../tools/docs-check/sidebar-demo.js';

const STYLESHEET = '.sm-sidebar-item{display:block}';

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Marcado de referencia valido; cada opcion rompe una regla concreta
function sidebarMarkup(options = {}) {
  const active = options.noActive ? '' : ' aria-current="page"';
  const disabledHref = options.disabledHref ? ' href="#x"' : '';
  const labelled = options.unlabelledList ? '' : ' aria-labelledby="m-start"';
  const second = options.singleMenu
    ? ''
    : '<div class="sm-sidebar-menu"><h3 class="sm-sidebar-label" id="m-comp">Components</h3>' +
      '<ul aria-labelledby="m-comp"><li><a class="sm-sidebar-item" aria-disabled="true"' +
      disabledHref +
      '>Tabs</a></li></ul></div>';
  const nav =
    '<nav class="sm-sidebar" aria-label="Demo">' +
    '<div class="sm-sidebar-menu"><h3 class="sm-sidebar-label" id="m-start">Getting started</h3>' +
    `<ul${labelled}><li><a class="sm-sidebar-item" href="#intro"${active}>Introduction</a></li></ul></div>` +
    second +
    '</nav>';
  const main = '<div>Content</div>';
  const children = options.navNotFirst ? main + nav : nav + main;
  return `<div class="sm-sidebar-layout">${children}</div>`;
}

const REACT_SNIPPET =
  '<nav className="sm-sidebar" aria-label="Demo"><ul aria-labelledby="m-start">' +
  '<a className="sm-sidebar-item" aria-current="page">A</a><a className="sm-sidebar-item" aria-disabled="true">B</a></ul></nav>';
const THYMELEAF_SNIPPET =
  '<nav class="sm-sidebar" aria-label="Demo"><ul aria-labelledby="m-start">' +
  '<a class="sm-sidebar-item" th:href="@{/x}" th:attr="aria-current=${page}">A</a>' +
  '<a class="sm-sidebar-item" aria-disabled="true">B</a></ul></nav>';

function page(options = {}) {
  const snippets = [
    options.htmlSnippet ?? sidebarMarkup(),
    options.dropThymeleaf ? null : THYMELEAF_SNIPPET,
    options.reactSnippet ?? REACT_SNIPPET,
  ]
    .filter(Boolean)
    .map((text) => `<pre><code>${escapeHtml(text)}</code></pre>`)
    .join('');
  const rendered = options.renderedSnippet ? `<pre><code>${sidebarMarkup()}</code></pre>` : '';
  return `<main>${sidebarMarkup(options.demo ?? {})}${snippets}${rendered}</main>`;
}

function check(html, stylesheets = [STYLESHEET]) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return [...new Set(checkSidebarDemo(document, stylesheets).map((problem) => problem.code))].sort();
}

describe('checkSidebarDemo', () => {
  test('accepts a valid page', () => {
    expect(check(page()), 'demo-markup-invalid').toEqual([]);
  });

  test('requires an active item in the live demo', () => {
    expect(check(page({ demo: { noActive: true } })), 'demo-markup-invalid').toEqual(['demo-markup-invalid']);
  });

  test('rejects a disabled item that keeps its destination', () => {
    expect(check(page({ demo: { disabledHref: true } })), 'demo-markup-invalid').toEqual(['demo-markup-invalid']);
  });

  test('requires the sidebar as first child of the layout', () => {
    expect(check(page({ demo: { navNotFirst: true } })), 'demo-markup-invalid').toEqual(['demo-markup-invalid']);
  });

  test('requires at least two menus', () => {
    expect(check(page({ demo: { singleMenu: true } })), 'demo-markup-invalid').toEqual(['demo-markup-invalid']);
  });

  test('requires every label to name its list', () => {
    expect(check(page({ demo: { unlabelledList: true } })), 'label-not-associated').toEqual(['label-not-associated']);
  });

  test('requires the three snippet formats', () => {
    expect(check(page({ dropThymeleaf: true })), 'snippet-missing').toEqual(['snippet-missing']);
  });

  test('rejects a snippet rendered as markup instead of literal text', () => {
    expect(check(page({ renderedSnippet: true })), 'snippet-not-literal').toContain('snippet-not-literal');
  });

  test('applies the accessible markup rules to the html snippet', () => {
    expect(check(page({ htmlSnippet: sidebarMarkup({ noActive: true }) })), 'a11y-markup-invalid').toEqual([
      'a11y-markup-invalid',
    ]);
  });

  test('requires the accessible attributes in the framework snippets', () => {
    const react = REACT_SNIPPET.replace(' aria-labelledby="m-start"', '');
    expect(check(page({ reactSnippet: react })), 'a11y-markup-invalid').toEqual(['a11y-markup-invalid']);
  });

  test('requires a stylesheet that contains the component', () => {
    expect(check(page(), ['.sm-btn{}']), 'stylesheet-missing').toEqual(['stylesheet-missing']);
  });
});
