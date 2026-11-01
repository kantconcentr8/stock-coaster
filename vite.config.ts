import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { socialMetadata } from './scripts/inject-meta';

export default defineConfig({
  build: { manifest: true },
  plugins: [socialMetadata()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
