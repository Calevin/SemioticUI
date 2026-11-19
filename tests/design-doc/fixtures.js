// Fixtures en memoria para los tests unitarios de la Spec 002: un documento minimo coherente

export const FIXTURE_TOKEN_SHEET = [
  '@layer sm.reset, sm.tokens;',
  '@layer sm.tokens {',
  '  :root {',
  '    color-scheme: light dark;',
  '    --sm-radius: 0px;',
  '    --sm-text: #111111;',
  '    --sm-border: var(--sm-text);',
  '  }',
  "  :root[data-sm-theme='dark'],",
  '  .sm-theme-dark {',
  '    --sm-text: #EEEEEE;',
  '  }',
  '}',
].join('\n');

export const FIXTURE_COMPONENT_SHEET = [
  '@layer sm.components {',
  '  .sm-btn { border-radius: var(--sm-radius); }',
  '  .sm-btn--primary { color: var(--sm-text); }',
  '}',
].join('\n');

export const FIXTURE_MARKDOWN = [
  '# Fixture',
  '',
  '> **Version:** `semiotic-ui@1.2.3`',
  '',
  '## Tokens',
  '',
  '| Token | Valor claro | Valor oscuro | Uso |',
  '| :--- | :--- | :--- | :--- |',
  '| `--sm-radius` | `0px` | | Radio |',
  '| `--sm-text` | `#111111` | `#eeeeee` | Texto |',
  '| `--sm-border` | `var(--sm-text)` | | Borde |',
  '',
  'Prosa con `--sm-*`, `.sm-*`, `<semiotic-*>` y `.sm-btn`.',
  '',
  '## Inventario',
  '',
  '<!-- design-check:inventory -->',
  '',
  '| Clase | Uso |',
  '| :--- | :--- |',
  '| `.sm-btn` | Boton |',
  '| `.sm-btn--primary` | Primario |',
  '| `.sm-theme-dark` | Tema oscuro |',
  '',
  '| Custom Element | Uso |',
  '| :--- | :--- |',
  '| `<semiotic-probe>` | Sonda |',
  '',
  '### Sonda `<semiotic-probe>`',
  '',
  '| Atributo | Uso |',
  '| :--- | :--- |',
  '| `variant` | Variante |',
  '',
  '| Evento | Uso |',
  '| :--- | :--- |',
  '| `sm-ping` | Aviso |',
  '',
  '| Parte | Uso |',
  '| :--- | :--- |',
  '| `base` | Contenedor |',
  '',
  '| Slot | Uso |',
  '| :--- | :--- |',
  '| `heading` | Titulo |',
  '',
  '| Exportación | Uso |',
  '| :--- | :--- |',
  '| `registerAll()` | Registro |',
  '',
  '<!-- design-check:nonexistent -->',
  'No existen: `.sm-badge` ni `<semiotic-modal>`.',
  '<!-- /design-check:nonexistent -->',
  '',
  '<!-- /design-check:inventory -->',
  '',
].join('\n');

export const FIXTURE_LIBRARY = {
  version: '1.2.3',
  elements: [
    {
      name: 'semiotic-probe',
      attributes: ['variant'],
      events: ['sm-ping'],
      parts: ['base'],
      slots: ['heading'],
    },
  ],
  exports: ['registerAll'],
};

/**
 * Devuelve una entrada coherente nueva; cada test la altera sin afectar a los demas.
 */
export function createFixtureInput() {
  return {
    markdown: FIXTURE_MARKDOWN,
    tokenSheetCss: FIXTURE_TOKEN_SHEET,
    stylesheets: [
      { path: 'src/css/buttons.css', css: FIXTURE_COMPONENT_SHEET },
      { path: 'src/css/tokens.css', css: FIXTURE_TOKEN_SHEET },
    ],
    library: structuredClone(FIXTURE_LIBRARY),
  };
}

/**
 * Agrega texto al final del documento de la entrada.
 */
export function appendMarkdown(input, text) {
  return { ...input, markdown: `${input.markdown}\n${text}\n` };
}

/**
 * Devuelve los tipos de discrepancia presentes en una lista.
 */
export function typesOf(list) {
  return list.map((entry) => entry.type);
}
