import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './ui'),
      '@shared': resolve(__dirname, './src'),
    },
  },
});
