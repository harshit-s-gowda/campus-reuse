import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
