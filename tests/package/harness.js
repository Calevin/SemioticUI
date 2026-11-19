import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { build } from 'vite';

// Raiz del repositorio derivada de la ubicacion de este archivo: permite copiar el repo a otro
// directorio (controles de caja negra del verificador) sin que el harness apunte al original
export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// Las dos formas en que un proyecto consumidor obtiene el paquete (ver spec, seccion 4)
export const MODALITIES = ['link', 'tarball'];

const tempDirs = [];
const openWindows = [];

function makeTempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), `sm-${prefix}-`));
  tempDirs.push(dir);
  return dir;
}

/**
 * Compila la libreria con la configuracion real del repositorio hacia un directorio temporal.
 * No toca la carpeta de salida del repositorio: los tests no requieren una compilacion previa.
 */
export async function buildLibrary() {
  const outDir = makeTempDir('lib');
  await build({
    configFile: join(repoRoot, 'vite.config.js'),
    // El runner evita que Vite escriba un archivo temporal junto a la configuracion
    configLoader: 'runner',
    root: repoRoot,
    logLevel: 'silent',
    build: { outDir, emptyOutDir: true },
  });
  return outDir;
}

/**
 * Arma el paquete publicado: manifiesto real (con overrides opcionales), fuentes y salida compilada.
 */
export function stagePackage(libraryOutDir, overrides = {}) {
  const stageDir = makeTempDir('stage');
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  Object.assign(manifest, overrides);
  writeFileSync(join(stageDir, 'package.json'), JSON.stringify(manifest, null, 2));
  cpSync(join(repoRoot, 'src'), join(stageDir, 'src'), { recursive: true });
  cpSync(libraryOutDir, join(stageDir, 'dist'), { recursive: true });
  return stageDir;
}

/**
 * Crea un proyecto consumidor con node_modules/semiotic-ui obtenido por enlace simbolico o por
 * tarball de npm pack extraido. No se usa npm install: no hay acceso a red.
 */
export function installConsumer(stageDir, modality) {
  const consumerDir = makeTempDir('consumer');
  const target = join(consumerDir, 'node_modules', 'semiotic-ui');

  if (modality === 'link') {
    mkdirSync(join(consumerDir, 'node_modules'), { recursive: true });
    symlinkSync(stageDir, target);
    return consumerDir;
  }

  if (modality !== 'tarball') {
    throw new Error(`Unknown consumption modality: ${modality}`);
  }

  execFileSync('npm', ['pack', '--pack-destination', consumerDir, '--silent'], {
    cwd: stageDir,
    env: { ...process.env, npm_config_offline: 'true', npm_config_update_notifier: 'false' },
    stdio: 'pipe',
  });
  const tarball = readdirSync(consumerDir).find((name) => name.endsWith('.tgz'));
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', join(consumerDir, tarball), '-C', target, '--strip-components=1'], {
    stdio: 'pipe',
  });
  return consumerDir;
}

/**
 * Compila el modulo del consumidor con Vite en modo produccion (con minificacion y tree-shaking).
 * El formato iife solo cambia la serializacion: la decision de tree-shaking ya esta tomada y el
 * resultado se puede ejecutar con Window.eval sin sistema de modulos.
 */
export async function bundleConsumer(consumerDir, source) {
  writeFileSync(join(consumerDir, 'main.js'), source);
  await build({
    configFile: false,
    root: consumerDir,
    logLevel: 'silent',
    mode: 'production',
    build: {
      outDir: 'out',
      emptyOutDir: true,
      rollupOptions: {
        input: join(consumerDir, 'main.js'),
        output: { format: 'iife', entryFileNames: 'bundle.js' },
      },
    },
  });
  return readFileSync(join(consumerDir, 'out', 'bundle.js'), 'utf8');
}

/**
 * Ejecuta codigo en un Window nuevo de happy-dom. 'before' permite preparar el registro antes.
 */
export function runInWindow(code, before) {
  const window = new Window();
  openWindows.push(window);
  if (before) before(window);
  window.eval(code);
  return window;
}

/**
 * Ejecuta un script ESM en un proceso node limpio (sin DOM) con el paquete publicado como cwd,
 * de modo que el especificador del paquete se resuelve por autorreferencia.
 */
export function runNodeModule(stageDir, script, nodeArgs) {
  // Cada test declara explicitamente como se interpreta el script (por ejemplo --input-type=module)
  return spawnSync(process.execPath, [...nodeArgs, '-e', script], {
    cwd: stageDir,
    encoding: 'utf8',
  });
}

/**
 * Cuenta las llamadas a customElements.define para un nombre dado dentro de un Window.
 */
export function countDefinitions(window, name) {
  const counter = { count: 0 };
  const originalDefine = window.customElements.define.bind(window.customElements);
  window.customElements.define = (tagName, ...rest) => {
    if (tagName === name) counter.count += 1;
    return originalDefine(tagName, ...rest);
  };
  return counter;
}

export async function cleanup() {
  for (const window of openWindows.splice(0)) {
    try {
      await window.happyDOM.close();
    } catch {
      // Cierre best-effort: un Window ya cerrado no debe romper la limpieza
    }
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
