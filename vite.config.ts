import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    lib: {
      entry: '../src/index.ts',
      formats: ['es'],
      fileName: 'index'
    }
  }
}); 