// Ficha "Interactive Alerts" (005-RF-16 a 005-RF-23). Las alertas nacen visibles, sin el atributo dismissed
// (005-CL-02); la preview principal incluye una alerta descartable (005-RF-22).
import { REACT_IMPORTS } from './imports.js';

function alert({ variant, code, heading, body, dismissible = false }) {
  return [
    `<semiotic-alert variant="${variant}" code="${code}" heading="${heading}"${dismissible ? ' dismissible' : ''}>`,
    `  ${body}`,
    '</semiotic-alert>',
  ].join('\n');
}

export default {
  name: 'Interactive Alerts',
  slug: 'interactive-alerts',
  piece: '<semiotic-alert>',
  what:
    'A native Custom Element with Shadow DOM for status messages. It shows a state badge, a technical code, a heading and an optional ACK close button, and it is configured only with HTML attributes.',
  when:
    'Use it to report the state of an operation or a system. Reserve the danger variant for urgent messages: it uses the alert role and interrupts screen readers. Add dismissible when the user can acknowledge it, and listen to sm-dismiss and sm-show to react.',
  preview: {
    html: alert({
      variant: 'warning',
      code: 'TEMP-404',
      heading: 'Thermal Variance',
      body: 'Coolant manifold delta exceeded +4.2 C. Acknowledge to clear the console flag.',
      dismissible: true,
    }),
    thymeleaf: [
      '<semiotic-alert',
      '  th:attr="variant=${alert.severity}, code=${alert.code}, heading=${alert.title}"',
      '  dismissible',
      '  hx-on:sm-dismiss="htmx.ajax(\'POST\', \'/alerts/ack\', {values: {code: event.detail.code}})">',
      '  <span th:text="${alert.message}">Coolant manifold delta exceeded +4.2 C.</span>',
      '</semiotic-alert>',
    ].join('\n'),
    react: [
      REACT_IMPORTS,
      '',
      '// React 19: the callback ref returns its cleanup',
      'export function ThermalAlert({ onDismiss }) {',
      '  return (',
      '    <semiotic-alert',
      '      variant="warning"',
      '      code="TEMP-404"',
      '      heading="Thermal Variance"',
      '      dismissible',
      '      ref={(element) => {',
      '        element?.addEventListener(\'sm-dismiss\', onDismiss);',
      '        return () => element?.removeEventListener(\'sm-dismiss\', onDismiss);',
      '      }}>',
      '      Coolant manifold delta exceeded +4.2 C.',
      '    </semiotic-alert>',
      '  );',
      '}',
    ].join('\n'),
  },
  variants: [
    {
      id: 'info',
      description: 'Informative state; role status.',
      html: alert({ variant: 'info', code: 'NAV-09', heading: 'Course Plotted', body: 'Autopilot locked onto the transit corridor.' }),
    },
    {
      id: 'success',
      description: 'Nominal operation; role status.',
      html: alert({ variant: 'success', code: 'PWR-02', heading: 'Auxiliary Online', body: 'Fuel cell array stabilized after a cold restart.' }),
    },
    {
      id: 'warning',
      description: 'Caution; role status.',
      html: alert({ variant: 'warning', code: 'WARN-702', heading: 'Coolant Drift', body: 'Secondary loop temperature above baseline.' }),
    },
    {
      id: 'danger',
      description: 'Urgent; role alert interrupts screen readers.',
      html: alert({
        variant: 'danger',
        code: 'HULL-911',
        heading: 'Pressure Drop',
        body: 'Micro-fracture detected in the Cargo Bay 03 bulkhead.',
        dismissible: true,
      }),
    },
  ],
};
