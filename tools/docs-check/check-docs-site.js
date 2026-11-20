// CLI de la Spec 005: chequea el sitio de documentacion compilado.
// Uso: node tools/docs-check/check-docs-site.js <site-dir> [--design <ruta>] [--package <ruta>] [--boot <ruta>]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { Window } from 'happy-dom';
import { checkDocsSite } from './site-check.js';
import { pageUrlFromFile } from './site-model.js';

const REPOSITORY = resolve(import.meta.dirname, '..', '..');
const LOCAL_IMPORT = /(?:\bimport\s*\(\s*|\bimport\s+(?:[^'";]*?\bfrom\s*)?|\bfrom\s*)["'](\.{1,2}\/[^"']+|\/[^/"'][^"']*)["']/g;

function parseArguments(argv) {
  const options = {
    design: join(REPOSITORY, 'DESIGN.md'),
    package: join(REPOSITORY, 'package.json'),
    boot: join(REPOSITORY, 'docs', 'src', 'scripts', 'theme-boot.js'),
  };
  let siteDir = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const flag = argument.startsWith('--') ? argument.slice(2) : null;
    if (flag && flag in options && argv[index + 1]) {
      options[flag] = resolve(argv[index + 1]);
      index += 1;
    } else if (!flag && !siteDir) {
      siteDir = resolve(argument);
    } else {
      return null;
    }
  }
  return siteDir ? { siteDir, ...options } : null;
}

function listHtmlFiles(directory, root = directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      // Los recursos compilados de Astro no son paginas
      if (relative(root, path) !== '_astro') files.push(...listHtmlFiles(path, root));
    } else if (name.endsWith('.html')) {
      files.push(relative(root, path).split(sep).join('/'));
    }
  }
  return files.sort();
}

function isLocal(reference) {
  return Boolean(reference) && !/^[a-z][a-z0-9+.-]*:/i.test(reference) && !reference.startsWith('//');
}

/**
 * Resuelve una referencia de la pagina a un archivo dentro del sitio; null si sale del sitio o no existe.
 */
function resolveInSite(siteDir, fromUrlPath, reference) {
  const clean = reference.split(/[?#]/)[0];
  const urlPath = clean.startsWith('/') ? clean : posix.join(posix.dirname(fromUrlPath), clean);
  const path = resolve(siteDir, `.${posix.normalize(urlPath)}`);
  if (path !== siteDir && !path.startsWith(siteDir + sep)) return null;
  return existsSync(path) && statSync(path).isFile() ? { path, urlPath: posix.normalize(urlPath) } : null;
}

/**
 * Lee un script local y, recursivamente, los modulos locales que importa (chunks compartidos de Vite).
 */
function readScriptGraph(siteDir, entry, seen) {
  if (seen.has(entry.path)) return [];
  seen.add(entry.path);
  const source = readFileSync(entry.path, 'utf8');
  const sources = [source];
  for (const match of source.matchAll(LOCAL_IMPORT)) {
    const next = resolveInSite(siteDir, entry.urlPath, match[1]);
    if (next) sources.push(...readScriptGraph(siteDir, next, seen));
  }
  return sources;
}

function loadPage(window, siteDir, file) {
  const html = readFileSync(join(siteDir, file), 'utf8');
  const document = new window.DOMParser().parseFromString(html, 'text/html');
  const pagePath = `/${file}`;
  const stylesheets = [];
  for (const link of document.querySelectorAll('link[rel~="stylesheet"][href]')) {
    const href = link.getAttribute('href');
    const target = isLocal(href) ? resolveInSite(siteDir, pagePath, href) : null;
    if (target) stylesheets.push(readFileSync(target.path, 'utf8'));
  }
  for (const style of document.querySelectorAll('style')) stylesheets.push(style.textContent);
  const scripts = [];
  const seen = new Set();
  for (const script of document.querySelectorAll('script')) {
    const src = script.getAttribute('src');
    if (src === null) {
      // Un modulo en linea tambien puede importar chunks locales compartidos
      scripts.push(script.textContent);
      for (const match of script.textContent.matchAll(LOCAL_IMPORT)) {
        const target = resolveInSite(siteDir, pagePath, match[1]);
        if (target) scripts.push(...readScriptGraph(siteDir, target, seen));
      }
      continue;
    }
    const target = isLocal(src) ? resolveInSite(siteDir, pagePath, src) : null;
    if (target) scripts.push(...readScriptGraph(siteDir, target, seen));
  }
  return { url: pageUrlFromFile(file), document, stylesheets, scripts };
}

const options = parseArguments(process.argv.slice(2));
if (!options) {
  console.error('usage: node tools/docs-check/check-docs-site.js <site-dir> [--design <path>] [--package <path>] [--boot <path>]');
  process.exit(2);
}
if (!existsSync(options.siteDir) || !statSync(options.siteDir).isDirectory()) {
  console.error(`page-missing: el directorio del sitio no existe: ${options.siteDir}`);
  process.exit(1);
}

// Sin ejecucion de scripts ni carga de recursos: el chequeo es estatico y sin red
const window = new Window({
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});

const pages = listHtmlFiles(options.siteDir).map((file) => loadPage(window, options.siteDir, file));
const context = {
  design: readFileSync(options.design, 'utf8'),
  pkg: JSON.parse(readFileSync(options.package, 'utf8')),
  bootSource: readFileSync(options.boot, 'utf8'),
};
const problems = checkDocsSite({ pages }, context);
await window.happyDOM.close();

for (const problem of problems) console.log(`${problem.code}: [${problem.url}] ${problem.detail}`);
if (problems.length === 0) console.log(`ok: ${pages.length} paginas en ${relative(process.cwd(), options.siteDir) || dirname(options.siteDir)}`);
process.exit(problems.length === 0 ? 0 : 1);
