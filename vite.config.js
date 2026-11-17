import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Genera archivos unificados y minificados aptos para CDN y bundlers
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'SemioticUI',
      formats: ['es', 'umd'],
      fileName: (format) => `semiotic-ui.${format}.js`,
      cssFileName: 'semiotic-ui',
    },
    cssCodeSplit: false,
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Garantiza un nombre estable para la hoja de estilos compilada
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
            return 'semiotic-ui.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
});
