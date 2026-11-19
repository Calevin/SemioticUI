// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { checkDesignDoc } from '../../tools/design-doc/check-design-doc.js';
import { appendMarkdown, createFixtureInput, typesOf } from './fixtures.js';

// Reglas de nombres de la Spec 002 (002-RF-11, 002-RF-13, 002-RF-15, 002-CL-01, 002-CL-09 a 002-CL-11)
describe('name checks', () => {
  test('abbreviated-name: a modifier written without its block', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), 'Usa `--primary` o `--sm`.'));
    expect(list.filter((entry) => entry.type === 'abbreviated-name').map((entry) => entry.subject)).toEqual([
      '--primary',
      '--sm',
    ]);
  });

  test('markdown separators like :--- and HTML comments are not abbreviations (002-CL-11)', () => {
    const input = appendMarkdown(createFixtureInput(), '| A | B |\n| :--- | ---: |\n\n<!-- nota -->\n\n---\n');
    expect(checkDesignDoc(input)).toEqual([]);
  });

  test('class-unknown: a dotted class mention that is not defined', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), 'Usa `.sm-ghost`.'));
    expect(list).toContainEqual(expect.objectContaining({ type: 'class-unknown', subject: '.sm-ghost' }));
  });

  test('class-unknown: a class inside a class attribute of a code block', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), '```html\n<div class="sm-btn sm-ghost-panel"></div>\n```'));
    expect(list).toEqual([expect.objectContaining({ type: 'class-unknown', subject: '.sm-ghost-panel' })]);
  });

  test('consumer prefix classes such as .app-input are never checked (002-CL-01)', () => {
    const input = appendMarkdown(createFixtureInput(), '```css\n.app-input { color: var(--sm-text); }\n```\n<input class="app-input">');
    expect(checkDesignDoc(input)).toEqual([]);
  });

  test('element-unknown: a custom element tag that is not registered', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), 'Usa `<semiotic-ghost>`.'));
    expect(list).toContainEqual(expect.objectContaining({ type: 'element-unknown', subject: 'semiotic-ghost' }));
  });

  test('mentions inside the nonexistent list are not reported as unknown (002-CL-09)', () => {
    const list = checkDesignDoc(createFixtureInput());
    expect(typesOf(list)).not.toContain('class-unknown');
    expect(typesOf(list)).not.toContain('element-unknown');
  });

  test('notational patterns are not class or element mentions (002-CL-10)', () => {
    const input = appendMarkdown(createFixtureInput(), '`.sm-<bloque>-<elemento>`, `.sm-*`, `<semiotic-<nombre>>` y `<semiotic-*>`.');
    expect(checkDesignDoc(input)).toEqual([]);
  });

  test('the same unknown class outside the nonexistent region is reported', () => {
    const list = checkDesignDoc(appendMarkdown(createFixtureInput(), 'Tampoco `.sm-badge` aca.'));
    expect(list).toEqual([expect.objectContaining({ type: 'class-unknown', subject: '.sm-badge' })]);
  });
});
