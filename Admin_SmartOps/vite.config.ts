import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve as pathResolve } from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-is', 'recharts']
  },
  build: {
    commonjsOptions: {
      include: [/react-is/, /recharts/, /node_modules/],
      transformMixedEsModules: true
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