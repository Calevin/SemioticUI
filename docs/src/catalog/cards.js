// Ficha "Cards" (005-RF-16 a 005-RF-20). La preview en vivo y el snippet HTML salen de la misma cadena.
import { REACT_IMPORTS } from './imports.js';

function card({ modifier = '', title, code, body, action }) {
  const classes = modifier ? `sm-card sm-card--${modifier}` : 'sm-card';
  return [
    `<article class="${classes}">`,
    '  <header class="sm-card-header">',
    `    <h3 class="sm-card-title">${title}</h3>`,
    `    <span class="sm-code-tag">${code}</span>`,
    '  </header>',
    '  <div class="sm-card-body">',
    `    <p>${body}</p>`,
    '  </div>',
    ...(action
      ? ['  <footer class="sm-card-footer">', `    <button class="sm-btn sm-btn--sm" type="button">${action}</button>`, '  </footer>']
      : []),
    '</article>',
  ].join('\n');
}

export default {
  name: 'Cards',
  slug: 'cards',
  piece: '.sm-card',
  what:
    'A structural panel with a 2px solid border, zero radius and a hard offset shadow. It stacks an optional header, a body and an optional footer in a column.',
  when:
    'Use it to group related content or telemetry, such as a module status or a form section. Add a state modifier to tint only the accent stripe of the header; never paint the whole card with a state color.',
  preview: {
    html: card({
      title: 'Life Support Telemetry',
      code: 'SYS-01',
      body: 'O2 partial pressure: 21.2 kPa. Scrubbers operating at 98.4% efficiency.',
      action: 'Inspect',
    }),
    thymeleaf: [
      '<article class="sm-card" th:object="${module}">',
      '  <header class="sm-card-header">',
      '    <h3 class="sm-card-title" th:text="*{title}">Life Support Telemetry</h3>',
      '    <span class="sm-code-tag" th:text="*{code}">SYS-01</span>',
      '  </header>',
      '  <div class="sm-card-body">',
      '    <p th:text="*{summary}">O2 partial pressure: 21.2 kPa.</p>',
      '  </div>',
      '  <footer class="sm-card-footer">',
      '    <button class="sm-btn sm-btn--sm" type="button" th:attr="hx-get=@{/modules/{id}(id=*{id})}">Inspect</button>',
      '  </footer>',
      '</article>',
    ].join('\n'),
    react: [
      REACT_IMPORTS,
      '',
      'export function TelemetryCard({ title, code, summary, onInspect }) {',
      '  return (',
      '    <article className="sm-card">',
      '      <header className="sm-card-header">',
      '        <h3 className="sm-card-title">{title}</h3>',
      '        <span className="sm-code-tag">{code}</span>',
      '      </header>',
      '      <div className="sm-card-body">',
      '        <p>{summary}</p>',
      '      </div>',
      '      <footer className="sm-card-footer">',
      '        <button className="sm-btn sm-btn--sm" type="button" onClick={onInspect}>Inspect</button>',
      '      </footer>',
      '    </article>',
      '  );',
      '}',
    ].join('\n'),
  },
  variants: [
    {
      id: 'info',
      description: 'Cyan accent stripe.',
      html: card({ modifier: 'info', title: 'Navigation Fix', code: 'NAV-09', body: 'Course plotted to the transit corridor.' }),
    },
    {
      id: 'success',
      description: 'Green accent stripe.',
      html: card({ modifier: 'success', title: 'Auxiliary Power', code: 'PWR-02', body: 'Fuel cell array stabilized.' }),
    },
    {
      id: 'warning',
      description: 'Amber accent stripe.',
      html: card({ modifier: 'warning', title: 'Airlock Deck B', code: 'WARN-12', body: 'Outer seal manual override engaged.' }),
    },
    {
      id: 'danger',
      description: 'Red accent stripe.',
      html: card({ modifier: 'danger', title: 'Reactor Core', code: 'CRIT-01', body: 'Containment field below threshold.' }),
    },
    {
      id: 'compact',
      description: 'Reduced inner padding for dense grids.',
      html: card({ modifier: 'compact', title: 'Cargo Bay 03', code: 'CRG-03', body: 'Manifest synced.' }),
    },
  ],
};
