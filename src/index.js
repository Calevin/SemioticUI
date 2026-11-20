import './css/tokens.css';
import './css/base.css';
import './css/buttons.css';
import './css/cards.css';
import './css/sidebar.css';

import { SemioticAlert, registerSemioticAlert } from './components/semiotic-alert.js';

/**
 * Registra todos los Web Components de Semiotic UI en entornos de navegador.
 */
export function registerAll() {
  registerSemioticAlert();
}

// Auto-registro seguro para scripts UMD/CDN y consumo directo en HTML/Thymeleaf/HTMX
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  registerAll();
}

export { SemioticAlert, registerSemioticAlert };
