import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve as pathResolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-is')) return undefined;
            if (id.includes('@mui')) return 'mui';
            if (id.includes('react-dom') || id.includes('/react/')) return 'react';
            if (id.includes('date-fns')) return 'date-fns';
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },
  appType: 'spa',
  resolve: {
    alias: {
      '@': pathResolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});