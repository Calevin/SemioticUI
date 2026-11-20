// CLI de la Spec 004: chequea la demo del Sidebar en el sitio compilado. Uso: node check-sidebar-demo.js <directorio>
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Window } from 'happy-dom';
import { checkSidebarDemo } from './sidebar-demo.js';

const siteDir = process.argv[2];
if (!siteDir) {
  console.error('usage: node tools/docs-check/check-sidebar-demo.js <site-directory>');
  process.exit(2);
}

const pagePath = join(resolve(siteDir), 'index.html');
if (!existsSync(pagePath)) {
  console.error(`page-missing: ${pagePath}`);
  process.exit(1);
}

// Sin ejecucion de scripts ni carga de recursos: el chequeo es estatico y sin red
const window = new Window({
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
  },
});
const document = new window.DOMParser().parseFromString(readFileSync(pagePath, 'utf8'), 'text/html');

// Las hojas enlazadas se leen del propio directorio compilado
const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')]
  .map((link) => link.getAttribute('href') ?? '')
  .filter((href) => href && !/^[a-z]+:/i.test(href))
  .map((href) => join(resolve(siteDir), href.replace(/^\/+/, '').split(/[?#]/)[0]))
  .filter((path) => existsSync(path))
  .map((path) => readFileSync(path, 'utf8'));

const problems = checkSidebarDemo(document, stylesheets);
await window.happyDOM.close();

for (const problem of problems) console.log(`${problem.code}: ${problem.detail}`);
process.exit(problems.length === 0 ? 0 : 1);
