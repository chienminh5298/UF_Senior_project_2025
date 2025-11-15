import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      "/api": {
        target: "http://backend:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the /api prefix
        ws: true, // Enable WebSocket proxying
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
