import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_DEV_PORT = 5177;
const DEFAULT_PREVIEW_PORT = 4173;

function parsePort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BOOLEAN_PRACTICE_');
  const host = env.BOOLEAN_PRACTICE_HOST || DEFAULT_HOST;
  const devPort = parsePort(env.BOOLEAN_PRACTICE_DEV_PORT, DEFAULT_DEV_PORT);
  const previewPort = parsePort(
    env.BOOLEAN_PRACTICE_PREVIEW_PORT,
    DEFAULT_PREVIEW_PORT,
  );

  return {
    base: './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './ui'),
        '@shared': resolve(__dirname, './src'),
      },
    },
    root: 'ui',
    server: {
      host,
      port: devPort,
      strictPort: true,
    },
    preview: {
      host,
      port: previewPort,
      strictPort: true,
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  };
});
