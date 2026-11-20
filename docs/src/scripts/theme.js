// Control de tema del sitio de documentacion (005-RF-10 a 005-RF-12).
// getStorage es una funcion porque en algunos navegadores leer window.localStorage ya lanza una excepcion.

export const THEME_STORAGE_KEY = 'sm-docs-theme';

const THEME_ATTRIBUTE = 'data-sm-theme';
const DARK = 'dark';
const LIGHT = 'light';

/**
 * Tema guardado: 'dark' solo si el valor almacenado es exactamente 'dark'; en cualquier otro caso 'light'.
 */
export function readStoredTheme(getStorage) {
  try {
    return getStorage()?.getItem(THEME_STORAGE_KEY) === DARK ? DARK : LIGHT;
  } catch (error) {
    return LIGHT;
  }
}

/**
 * Aplica el tema sobre la raiz del documento: 'dark' fija el atributo de la libreria; otro valor lo elimina.
 */
export function applyTheme(root, theme) {
  if (theme === DARK) root.setAttribute(THEME_ATTRIBUTE, DARK);
  else root.removeAttribute(THEME_ATTRIBUTE);
}

/**
 * Alterna el tema de la pagina actual y lo recuerda; sin almacenamiento, el alternado sigue funcionando.
 */
export function toggleTheme(root, getStorage) {
  const next = root.getAttribute(THEME_ATTRIBUTE) === DARK ? LIGHT : DARK;
  applyTheme(root, next);
  try {
    getStorage().setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    // Almacenamiento no disponible o lleno: el tema vale solo para esta pagina
  }
  return next;
}

/**
 * Conecta el boton de tema; devuelve una funcion que quita el listener.
 */
export function initThemeToggle(button, root, getStorage) {
  const onClick = () => toggleTheme(root, getStorage);
  button.addEventListener('click', onClick);
  return () => button.removeEventListener('click', onClick);
}
