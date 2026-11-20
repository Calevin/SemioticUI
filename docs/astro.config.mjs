import { defineConfig } from 'astro/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Una URL por pagina, siempre con barra final (005-RNF-01, 005-CL-05)
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Todas las hojas se publican enlazadas para que el chequeo del sitio las lea (005-CL-04)
    inlineStylesheets: 'never',
  },
  // Exponemos el codigo fuente de la libreria mediante alias para desarrollo en vivo dentro de Astro
  vite: {
    resolve: {
      alias: {
        'semiotic-ui': resolve(import.meta.dirname, '../src/index.js'),
      },
    },
  },
});
