import { resolve } from 'node:path';
import stylelint from 'stylelint';

const repoRoot = resolve(import.meta.dirname, '../..');
const configFile = resolve(repoRoot, 'stylelint.config.js');

/**
 * Ejecuta el lint oficial del repositorio sobre un fragmento CSS.
 * El nombre de archivo es relativo a la raiz para que apliquen los overrides de la configuracion.
 */
export async function lintCss(code, filename = 'src/css/probe.css') {
  const { results } = await stylelint.lint({
    code,
    codeFilename: resolve(repoRoot, filename),
    configFile,
  });
  const [result] = results;
  return {
    errored: Boolean(result.errored),
    rules: result.warnings.map((warning) => warning.rule),
    warnings: result.warnings,
  };
}
