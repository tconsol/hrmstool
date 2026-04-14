import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use timestamp + random ID for version (works in all environments)
const APP_VERSION = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
  server: {
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
