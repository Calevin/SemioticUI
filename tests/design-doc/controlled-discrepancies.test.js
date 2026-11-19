// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { checkDesignDoc } from '../../tools/design-doc/check-design-doc.js';
import { buildCheckInput, collectLibraryModel, loadRepositorySources } from './repository-sources.js';

// Discrepancias controladas de la Spec 002 (002-RF-21): se alteran copias en memoria del contenido
// real del repositorio y nunca los archivos
let sources;
let library;

beforeAll(async () => {
  sources = loadRepositorySources();
  library = await collectLibraryModel(sources);
});

function freshInput() {
  return buildCheckInput(structuredClone({ ...sources, readComponentSource: undefined }), structuredClone(library));
}

function appendToMarkdown(input, text) {
  return { ...input, markdown: `${input.markdown}\n\n${text}\n` };
}

function alterTokenSheet(input, transform) {
  const tokenSheetCss = transform(input.tokenSheetCss);
  expect(tokenSheetCss).not.toBe(input.tokenSheetCss);
  return {
    ...input,
    tokenSheetCss,
    stylesheets: input.stylesheets.map((sheet) =>
      sheet.path === 'src/css/tokens.css' ? { ...sheet, css: tokenSheetCss } : sheet
    ),
  };
}

function addStylesheetRule(input, css) {
  return { ...input, stylesheets: [...input.stylesheets, { path: 'src/css/zz-probe.css', css }] };
}

function firstPublicToken(input, theme) {
  const match = input.tokenSheetCss.match(theme === 'dark' ? /--sm-text-muted:\s*([^;]+);/ : /--sm-radius:\s*([^;]+);/);
  expect(match).not.toBeNull();
  return match;
}

const CASES = [
  {
    type: 'token-unknown',
    subject: '--sm-zz-probe',
    mutate: (input) => appendToMarkdown(input, 'Probe --sm-zz-probe'),
  },
  {
    type: 'token-pattern-unmatched',
    subject: '--sm-zz-*',
    mutate: (input) => appendToMarkdown(input, 'Probe --sm-zz-*'),
  },
  {
    type: 'token-undocumented',
    subject: '--sm-zz-extra',
    mutate: (input) => alterTokenSheet(input, (css) => `${css}\n:root { --sm-zz-extra: 1px; }\n`),
  },
  {
    type: 'token-light-mismatch',
    subject: '--sm-radius',
    mutate: (input) => {
      firstPublicToken(input, 'light');
      return alterTokenSheet(input, (css) => css.replace(/--sm-radius:\s*[^;]+;/, '--sm-radius: 1px;'));
    },
  },
  {
    type: 'token-dark-mismatch',
    subject: '--sm-text-muted',
    mutate: (input) => {
      firstPublicToken(input, 'dark');
      return alterTokenSheet(input, (css) => css.replace(/--sm-text-muted:\s*#9aa3ae;/, '--sm-text-muted: #000000;'));
    },
  },
  {
    type: 'token-dark-undocumented',
    subject: '--sm-space-1',
    mutate: (input) =>
      alterTokenSheet(input, (css) => `${css}\n:root[data-sm-theme='dark'] { --sm-space-1: 0.25rem; }\n`),
  },
  {
    type: 'token-row-malformed',
    subject: '`--sm-space-1` / `-2`',
    mutate: (input) =>
      appendToMarkdown(input, '| Token | Valor claro |\n| :--- | :--- |\n| `--sm-space-1` / `-2` | `0.25rem` |'),
  },
  {
    type: 'abbreviated-name',
    subject: '--primary',
    mutate: (input) => appendToMarkdown(input, 'Probe --primary'),
  },
  {
    type: 'class-inventory-missing',
    subject: '.sm-zz-probe',
    mutate: (input) => addStylesheetRule(input, '.sm-zz-probe { color: red; }'),
  },
  {
    type: 'class-unknown',
    subject: '.sm-zz-nope',
    mutate: (input) => appendToMarkdown(input, 'Probe .sm-zz-nope here'),
  },
  {
    type: 'element-inventory-missing',
    subject: 'semiotic-zz-probe',
    mutate: (input) => {
      input.library.elements.push({ name: 'semiotic-zz-probe', attributes: [], events: [], parts: [], slots: [] });
      return input;
    },
  },
  {
    type: 'element-unknown',
    subject: 'semiotic-zz-nope',
    mutate: (input) => appendToMarkdown(input, 'Probe <semiotic-zz-nope> here'),
  },
  {
    type: 'member-extra',
    subject: 'semiotic-alert/attribute/code',
    mutate: (input) => {
      const alert = input.library.elements.find((element) => element.name === 'semiotic-alert');
      alert.attributes = alert.attributes.filter((name) => name !== 'code');
      return input;
    },
  },
  {
    type: 'member-missing',
    subject: 'semiotic-alert/event/sm-zz-shown',
    mutate: (input) => {
      input.library.elements.find((element) => element.name === 'semiotic-alert').events.push('sm-zz-shown');
      return input;
    },
  },
  {
    type: 'member-missing',
    subject: 'semiotic-alert/part/zz-probe-part',
    mutate: (input) => {
      input.library.elements.find((element) => element.name === 'semiotic-alert').parts.push('zz-probe-part');
      return input;
    },
  },
  {
    type: 'export-missing',
    subject: 'zzProbeExport',
    mutate: (input) => {
      input.library.exports.push('zzProbeExport');
      return input;
    },
  },
  {
    type: 'nonexistent-exists',
    subject: '.sm-badge',
    mutate: (input) => addStylesheetRule(input, '.sm-badge { color: red; }'),
  },
  {
    type: 'nonexistent-exists',
    subject: 'semiotic-modal',
    mutate: (input) => {
      input.library.elements.push({ name: 'semiotic-modal', attributes: [], events: [], parts: [], slots: [] });
      return input;
    },
  },
  {
    type: 'version-missing',
    subject: 'semiotic-ui',
    mutate: (input) => ({ ...input, markdown: input.markdown.replace(/semiotic-ui@\d+\.\d+\.\d+/g, 'semiotic-ui') }),
  },
  {
    type: 'version-duplicate',
    subject: 'semiotic-ui',
    mutate: (input) => appendToMarkdown(input, `Probe semiotic-ui@${input.library.version}`),
  },
  {
    type: 'version-mismatch',
    subject: 'semiotic-ui',
    mutate: (input) => {
      input.library.version = '9.9.9';
      return input;
    },
  },
];

describe('controlled discrepancies over the real repository content', () => {
  test.each(CASES)('detects $type for $subject', ({ type, subject, mutate }) => {
    const list = checkDesignDoc(mutate(freshInput()));
    expect(list).toContainEqual(expect.objectContaining({ type, subject }));
  });

  test('the real sources are not altered by the mutations', () => {
    expect(sources.markdown).not.toContain('--sm-zz-probe');
    expect(sources.tokenSheetCss).not.toContain('--sm-zz-extra');
    expect(library.exports).not.toContain('zzProbeExport');
  });
});
