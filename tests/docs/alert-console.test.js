// @vitest-environment happy-dom
// Consola de la ficha "Interactive Alerts" (005-RF-23, 005-CL-02, 005-RNF-06)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import '../../src/index.js';
import { formatEventLog, initAlertConsole } from '../../docs/src/scripts/alert-console.js';

// En el entorno happy-dom el URL global no es el de Node: la ruta se resuelve con node:path
const REPOSITORY = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE_SOURCE = readFileSync(join(REPOSITORY, 'docs', 'src', 'scripts', 'alert-console.js'), 'utf8');

// Arma la ficha minima: alertas descartables, boton de restaurar y registro de eventos
function mountConsole() {
  const root = document.createElement('main');
  root.innerHTML =
    '<semiotic-alert id="warning" variant="warning" code="TEMP-404" heading="Thermal" dismissible>Body</semiotic-alert>' +
    '<semiotic-alert id="danger" variant="danger" heading="Pressure" dismissible>Body</semiotic-alert>' +
    '<semiotic-alert id="info" variant="info" code="NAV-09">Static</semiotic-alert>' +
    '<button id="restore-alerts" type="button">Restore</button>' +
    '<span id="event-log" aria-live="polite">EVENT LOG: IDLE</span>';
  document.body.append(root);
  const restoreButton = root.querySelector('#restore-alerts');
  const eventLog = root.querySelector('#event-log');
  const cleanup = initAlertConsole({ root, restoreButton, eventLog });
  return { root, restoreButton, eventLog, cleanup, alert: (id) => root.querySelector(`#${id}`) };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('formatEventLog', () => {
  test('formats the event type, variant and code', () => {
    expect(formatEventLog('sm-dismiss', { variant: 'warning', code: 'TEMP-404' }), 'event-log-invalid').toBe(
      'EVENT LOG: SM-DISMISS (warning // TEMP-404)'
    );
    expect(formatEventLog('sm-show', { variant: 'info', code: 'NAV-09' }), 'event-log-invalid').toBe(
      'EVENT LOG: SM-SHOW (info // NAV-09)'
    );
  });

  test('uses NO-CODE when the alert has no code', () => {
    expect(formatEventLog('sm-dismiss', { variant: 'danger', code: '' }), 'event-log-invalid').toBe(
      'EVENT LOG: SM-DISMISS (danger // NO-CODE)'
    );
    expect(formatEventLog('sm-show', undefined), 'event-log-invalid').toBe('EVENT LOG: SM-SHOW (unknown // NO-CODE)');
  });
});

describe('initAlertConsole', () => {
  test('the restore control reopens every dismissed alert', () => {
    const { alert, restoreButton } = mountConsole();
    alert('warning').dismiss();
    alert('danger').dismiss();
    expect(alert('warning').hasAttribute('dismissed')).toBe(true);
    restoreButton.click();
    expect(alert('warning').hasAttribute('dismissed'), 'alert-restore-failed').toBe(false);
    expect(alert('danger').hasAttribute('dismissed'), 'alert-restore-failed').toBe(false);
    expect(alert('info').hasAttribute('dismissed'), 'alert-restore-failed').toBe(false);
  });

  test('the close button of the component dismisses and the control restores it', () => {
    const { alert, restoreButton } = mountConsole();
    alert('danger').shadowRoot.querySelector('[part="close-button"]').click();
    expect(alert('danger').hasAttribute('dismissed'), 'alert-restore-failed').toBe(true);
    restoreButton.click();
    expect(alert('danger').hasAttribute('dismissed'), 'alert-restore-failed').toBe(false);
  });

  test('the event log shows the last sm-dismiss', () => {
    const { alert, eventLog } = mountConsole();
    alert('danger').dismiss();
    alert('warning').dismiss();
    expect(eventLog.textContent, 'event-log-invalid').toBe('EVENT LOG: SM-DISMISS (warning // TEMP-404)');
  });

  test('the event log shows the sm-show emitted by the restore', () => {
    const { alert, eventLog, restoreButton } = mountConsole();
    alert('danger').dismiss();
    expect(eventLog.textContent, 'event-log-invalid').toBe('EVENT LOG: SM-DISMISS (danger // NO-CODE)');
    restoreButton.click();
    expect(eventLog.textContent, 'event-log-invalid').toBe('EVENT LOG: SM-SHOW (danger // NO-CODE)');
  });

  test('the cleanup removes every listener', () => {
    const { alert, eventLog, restoreButton, cleanup } = mountConsole();
    cleanup();
    alert('warning').dismiss();
    expect(eventLog.textContent, 'event-log-invalid').toBe('EVENT LOG: IDLE');
    restoreButton.click();
    expect(alert('warning').hasAttribute('dismissed'), 'alert-restore-failed').toBe(true);
  });

  test('the module never persists the alert state (005-CL-02)', () => {
    expect(MODULE_SOURCE.includes('Storage'), 'alert-state-persisted').toBe(false);
    expect(MODULE_SOURCE.includes('cookie'), 'alert-state-persisted').toBe(false);
  });
});
