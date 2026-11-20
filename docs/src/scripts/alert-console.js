// Consola de la ficha "Interactive Alerts" (005-RF-23, 005-CL-02): restaura alertas descartadas y
// muestra el ultimo evento sm-dismiss o sm-show. No persiste estado: recargar la pagina restaura todo.

const EVENTS = ['sm-dismiss', 'sm-show'];

/**
 * Texto del registro de eventos: 'EVENT LOG: SM-DISMISS (warning // TEMP-404)'; sin codigo usa 'NO-CODE'.
 */
export function formatEventLog(type, detail) {
  const variant = detail?.variant || 'unknown';
  const code = detail?.code || 'NO-CODE';
  return `EVENT LOG: ${String(type).toUpperCase()} (${variant} // ${code})`;
}

/**
 * Escucha los eventos de las alertas dentro de root y conecta el boton de restaurar.
 * Devuelve una funcion de limpieza que quita todos los listeners.
 */
export function initAlertConsole({ root, restoreButton, eventLog }) {
  const onEvent = (event) => {
    if (eventLog) eventLog.textContent = formatEventLog(event.type, event.detail);
  };
  const onRestore = () => {
    for (const alert of root.querySelectorAll('semiotic-alert[dismissed]')) {
      if (typeof alert.show === 'function') alert.show();
    }
  };
  for (const type of EVENTS) root.addEventListener(type, onEvent);
  restoreButton?.addEventListener('click', onRestore);
  return () => {
    for (const type of EVENTS) root.removeEventListener(type, onEvent);
    restoreButton?.removeEventListener('click', onRestore);
  };
}
