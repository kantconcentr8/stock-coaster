import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { socialMetadata } from './scripts/inject-meta.ts';

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        intraday: fileURLToPath(new URL('./intraday.html', import.meta.url)),
      },
    },
  },
  plugins: [socialMetadata()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
