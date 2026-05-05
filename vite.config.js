import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './ui'),
      '@shared': resolve(__dirname, './src'),
    },
  },
  root: 'ui',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
