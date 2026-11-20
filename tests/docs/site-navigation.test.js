// @vitest-environment happy-dom
// Sidebar de navegacion del sitio (005-RF-05 a 005-RF-09, 005-CL-01, 005-CL-03, 005-CL-05)
import { describe, expect, test } from 'vitest';
import { FIXTURE_DESIGN, FIXTURE_STYLESHEET, codesFor } from './site-fixtures.js';

describe('checkDocsSite: navegacion', () => {
  test('nav-structure-invalid: Getting started lists Introduction then Installation', () => {
    const mutate = { '/': (html) => html.replace('>Getting started<', '>Start here<') };
    expect(codesFor({ mutate }), 'nav-structure-invalid').toContain('nav-structure-invalid');
  });

  test('nav-structure-invalid: Components lists one item per piece in alphabetical order', () => {
    const renamed = { '/components/buttons/': (html) => html.replace('>Cards<', '>Kards<') };
    expect(codesFor({ mutate: renamed }), 'nav-structure-invalid').toContain('nav-structure-invalid');
    const unsorted = {
      '/': (html) => html.replace(/(<li><a class="sm-sidebar-item" href="\/components\/buttons\/">Buttons<\/a><\/li>)(<li>.*?Cards<\/a><\/li>)/, '$2$1'),
    };
    expect(codesFor({ mutate: unsorted }), 'nav-structure-invalid').toContain('nav-structure-invalid');
  });

  test('nav-structure-invalid: each menu label names its list', () => {
    const mutate = { '/installation/': (html) => html.replace('aria-labelledby="nav-components"', 'aria-labelledby="other"') };
    expect(codesFor({ mutate }), 'nav-structure-invalid').toContain('nav-structure-invalid');
  });

  test('nav-link-invalid: internal links keep the trailing slash', () => {
    const mutate = { '/': (html) => html.replace(/href="\/installation\/"/g, 'href="/installation"') };
    expect(codesFor({ mutate }), 'nav-link-invalid').toContain('nav-link-invalid');
  });

  test('nav-link-invalid: items do not depend on JavaScript', () => {
    const onclick = { '/': (html) => html.replace('href="/installation/">', 'href="/installation/" onclick="go()">') };
    expect(codesFor({ mutate: onclick }), 'nav-link-invalid').toContain('nav-link-invalid');
    const scripted = { '/components/cards/': (html) => html.replace('href="/components/sidebar/"', 'href="javascript:void(0)"') };
    expect(codesFor({ mutate: scripted }), 'nav-link-invalid').toContain('nav-link-invalid');
  });

  test('nav-link-invalid: internal links must point to an existing page', () => {
    const mutate = { '/': (html) => html.replace('<p>Continue with', '<p><a href="/missing/">Gone</a> Continue with') };
    expect(codesFor({ mutate }), 'nav-link-invalid').toContain('nav-link-invalid');
  });

  test('nav-link-invalid: the destination heading matches the item label', () => {
    const mutate = { '/installation/': (html) => html.replace('<h1>Installation</h1>', '<h1>Setup</h1>') };
    expect(codesFor({ mutate }), 'nav-link-invalid').toContain('nav-link-invalid');
  });

  test('nav-active-invalid: each page marks exactly its own item', () => {
    const none = { '/installation/': (html) => html.replace(/ aria-current="page"/g, '') };
    expect(codesFor({ mutate: none }), 'nav-active-invalid').toContain('nav-active-invalid');
    const twice = {
      '/': (html) =>
        html.replace('<a class="sm-sidebar-item" href="/components/sidebar/"', '<a class="sm-sidebar-item" href="/components/sidebar/" aria-current="page"'),
    };
    expect(codesFor({ mutate: twice }), 'nav-active-invalid').toContain('nav-active-invalid');
  });

  test('nav-active-invalid: the root marks Introduction and the 404 marks nothing', () => {
    const wrongRoot = {
      '/': (html) =>
        html
          .replace(' aria-current="page"', '')
          .replace('href="/installation/">Installation', 'href="/installation/" aria-current="page">Installation'),
    };
    expect(codesFor({ mutate: wrongRoot }), 'nav-active-invalid').toContain('nav-active-invalid');
    const active404 = { 404: (html) => html.replace('href="/">Introduction', 'href="/" aria-current="page">Introduction') };
    expect(codesFor({ mutate: active404 }), 'nav-active-invalid').toContain('nav-active-invalid');
  });

  test('nav-hidden: the site sidebar cannot be hidden, inert or styled inline (005-CL-03)', () => {
    for (const attribute of ['hidden', 'inert', 'style="display:none"']) {
      const mutate = { '/': (html) => html.replace(' data-doc-nav', ` data-doc-nav ${attribute}`) };
      expect(codesFor({ mutate }), 'nav-hidden').toContain('nav-hidden');
    }
  });

  test('nav-hidden: no stylesheet rule hides or pins the site sidebar', () => {
    for (const rule of ['.sm-sidebar-item{display:none}', '@layer x{.doc-layout>.sm-sidebar{position:sticky;top:0}}', '[data-doc-nav]{visibility:hidden}']) {
      const stylesheets = { '/components/cards/': [FIXTURE_STYLESHEET + rule] };
      expect(codesFor({ stylesheets }), 'nav-hidden').toContain('nav-hidden');
    }
    // Una regla sobre el layout no oculta el Sidebar
    expect(codesFor({ stylesheets: { '/': [`${FIXTURE_STYLESHEET}.sm-sidebar-layout{display:flex}`] } }), 'nav-hidden').toEqual([]);
  });

  test('catalog-entry-missing: a new inventory piece without item or ficha fails (005-CL-01)', () => {
    const design = FIXTURE_DESIGN.replace(
      '| `.sm-btn` | Clase CSS | Disponible |',
      '| `.sm-btn` | Clase CSS | Disponible |\n| `.sm-gauge` | Clase CSS | Disponible |'
    );
    expect(codesFor({ design }), 'catalog-entry-missing').toContain('catalog-entry-missing');
  });

  test('catalog-entry-missing: a new piece with its item and ficha passes (005-CL-01)', () => {
    const design = FIXTURE_DESIGN.replace(
      '| `.sm-btn` | Clase CSS | Disponible |',
      '| `.sm-btn` | Clase CSS | Disponible |\n| `.sm-gauge` | Clase CSS | Disponible |'
    );
    const fichas = (list) => [...list, { piece: '.sm-gauge', name: 'Gauges', preview: '<div class="sm-gauge">50</div>', variants: [] }];
    expect(codesFor({ design, fichas }), 'catalog-entry-missing').toEqual([]);
  });

  test('catalog-name-invalid: spec pieces keep their visible name and url', () => {
    const fichas = (list) => list.map((ficha) => (ficha.piece === '.sm-btn' ? { ...ficha, name: 'Push Buttons' } : ficha));
    expect(codesFor({ fichas }), 'catalog-name-invalid').toContain('catalog-name-invalid');
  });

  test('catalog-name-invalid: a ficha lives at the url of its name', () => {
    const fichas = (list) => list.map((ficha) => (ficha.piece === '.sm-card' ? { ...ficha, name: 'Panels' } : ficha));
    const codes = codesFor({
      fichas,
      mutate: { '/components/panels/': (html) => html.replace('<h1 data-doc-section="title">Panels</h1>', '<h1 data-doc-section="title">Cards</h1>') },
    });
    expect(codes, 'catalog-name-invalid').toContain('catalog-name-invalid');
  });
});
