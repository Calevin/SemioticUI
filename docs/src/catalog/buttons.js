// Ficha "Buttons" (005-RF-16 a 005-RF-20). La preview en vivo y el snippet HTML salen de la misma cadena.
import { REACT_IMPORTS } from './imports.js';

const button = (classes, label, extra = '') => `<button class="${classes}" type="button"${extra}>${label}</button>`;

export default {
  name: 'Buttons',
  slug: 'buttons',
  piece: '.sm-btn',
  what:
    'A pure CSS action control with zero JavaScript runtime. It styles native <button>, <a> and <input type="submit"> elements with hard borders, offset shadows and an uppercase label.',
  when:
    'Use it to trigger an action or submit a form. Alone, .sm-btn is the secondary action; add one color modifier to set its hierarchy and one size modifier to set its density. Do not combine two color modifiers on the same button.',
  preview: {
    html: [
      button('sm-btn', 'Default'),
      button('sm-btn sm-btn--primary', 'Execute'),
      button('sm-btn', 'Disabled', ' disabled'),
    ].join('\n'),
    thymeleaf: [
      '<form th:action="@{/thrusters/engage}" method="post" hx-boost="true">',
      '  <button class="sm-btn" type="button" th:text="#{action.cancel}">Default</button>',
      '  <button class="sm-btn sm-btn--primary" type="submit" th:text="#{action.execute}">Execute</button>',
      '  <button class="sm-btn" type="button" th:disabled="${!thrusters.ready}">Disabled</button>',
      '</form>',
    ].join('\n'),
    react: [
      REACT_IMPORTS,
      '',
      'export function ThrusterActions({ ready, onExecute }) {',
      '  return (',
      '    <>',
      '      <button className="sm-btn" type="button">Default</button>',
      '      <button className="sm-btn sm-btn--primary" type="button" onClick={onExecute}>Execute</button>',
      '      <button className="sm-btn" type="button" disabled={!ready}>Disabled</button>',
      '    </>',
      '  );',
      '}',
    ].join('\n'),
  },
  variants: [
    { id: 'primary', description: 'Main action; one per view or group.', html: button('sm-btn sm-btn--primary', 'Execute') },
    { id: 'info', description: 'Query or sync action.', html: button('sm-btn sm-btn--info', 'Sync') },
    { id: 'success', description: 'Confirms a nominal operation.', html: button('sm-btn sm-btn--success', 'Confirm') },
    { id: 'warning', description: 'Action that requires caution.', html: button('sm-btn sm-btn--warning', 'Engage Thrusters') },
    { id: 'danger', description: 'Destructive or irreversible action.', html: button('sm-btn sm-btn--danger', 'Purge Cache') },
    { id: 'ghost', description: 'Tertiary, low hierarchy action.', html: '<a class="sm-btn sm-btn--ghost" href="#preview-title">View Logs</a>' },
    { id: 'sm', description: 'Height 2rem, for dense layouts.', html: button('sm-btn sm-btn--sm', 'Size SM') },
    { id: 'lg', description: 'Height 3rem, for a featured action.', html: button('sm-btn sm-btn--lg', 'Size LG') },
  ],
};
