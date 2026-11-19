import { defineConfig } from 'vitest/config';

// Configuracion del runner separada de vite.config.js para no mezclarla con el Library Mode
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // Entorno por defecto sin DOM; los tests de Web Components declaran happy-dom por archivo
    environment: 'node',
  },
});
