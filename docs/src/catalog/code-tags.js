// Ficha "Code Tags" (005-RF-16, 005-RF-17, 005-RF-19): pieza sin variantes, la ficha omite la seccion
import { REACT_IMPORTS } from './imports.js';

export default {
  name: 'Code Tags',
  slug: 'code-tags',
  piece: '.sm-code-tag',
  what: 'A short bordered alphanumeric code in uppercase monospace. It is the visual anchor of sections, cards and log entries.',
  when:
    'Use it for short codes in the AAA-00 style, such as SYS-01 or WARN-12, next to a title or a record. Do not use it for sentences, as a button or as a status indicator.',
  preview: {
    html: ['<span class="sm-code-tag">SEC-04</span>', '<span class="sm-code-tag">NAV-09</span>', '<span class="sm-code-tag">WARN-12</span>'].join(
      '\n'
    ),
    thymeleaf: '<span class="sm-code-tag" th:each="tag : ${module.tags}" th:text="${tag}">SEC-04</span>',
    react: [
      REACT_IMPORTS,
      '',
      'export function CodeTags({ tags }) {',
      '  return tags.map((tag) => (',
      '    <span className="sm-code-tag" key={tag}>{tag}</span>',
      '  ));',
      '}',
    ].join('\n'),
  },
  variants: [],
};
