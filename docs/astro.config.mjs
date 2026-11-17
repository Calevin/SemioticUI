import { defineConfig } from 'astro/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Exponemos el codigo fuente de la libreria mediante alias para desarrollo en vivo dentro de Astro
  vite: {
    resolve: {
      alias: {
        'semiotic-ui': resolve(import.meta.dirname, '../src/index.js'),
      },
    },
  },
});
