import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: '.',
  publicDir: false,
  esbuild: {
    target: 'esnext',
    tsconfigRaw: {
      compilerOptions: {
        target: 'ESNext',
        useDefineForClassFields: true,
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'public/assets',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        bundle: fileURLToPath(new URL('./src/frontend/main.ts', import.meta.url)),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/chunks/[name]-[hash].js',
        assetFileNames: 'css/[name].[ext]',
        format: 'es',
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
});
