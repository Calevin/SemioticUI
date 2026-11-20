// Sentencias de importacion de los snippets, derivadas de package.json (005-RF-15, 005-RF-17).
// La comilla se agrega aparte para que el control de dependencias no lea los snippets como imports reales.
import pkg from '../../../package.json';

const QUOTE = "'";

/**
 * Sentencia de importacion de efecto lateral del especificador dado, entre comillas simples y con punto y coma.
 */
export function importStatement(specifier) {
  return ['import', `${QUOTE}${specifier}${QUOTE};`].join(' ');
}

// Especificador publicado de la hoja de estilos: la clave de exports que apunta al CSS compilado
const cssExport = Object.keys(pkg.exports).find((key) => String(pkg.exports[key]).endsWith('.css') && key !== './tokens.css');

export const PACKAGE_NAME = pkg.name;
export const PACKAGE_VERSION = pkg.version;
export const SCRIPT_SPECIFIER = pkg.name;
export const CSS_SPECIFIER = `${pkg.name}${cssExport.slice(1)}`;
export const REACT_IMPORTS = [importStatement(CSS_SPECIFIER), importStatement(SCRIPT_SPECIFIER)].join('\n');
