// Catalogo de fichas del sitio (005-RF-06, 005-RF-07): una entrada por componente del inventario de DESIGN.md
import buttons from './buttons.js';
import cards from './cards.js';
import codeTags from './code-tags.js';
import interactiveAlerts from './interactive-alerts.js';
import sidebar from './sidebar.js';

// Orden alfabetico por nombre visible, igual que el SidebarMenu "Components"
export const CATALOG = [buttons, cards, codeTags, interactiveAlerts, sidebar].sort((a, b) =>
  a.name.localeCompare(b.name, 'en')
);

/**
 * URL de la ficha de un componente segun el esquema de la spec, siempre con barra final.
 */
export function componentUrl(slug) {
  return `/components/${slug}/`;
}
