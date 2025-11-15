import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Determine backend URL: use Docker service name if in Docker, otherwise localhost
const getBackendUrl = () => {
  // In Docker: use service name 'backend' (set via BACKEND_URL env var)
  // For local: use 'localhost'
  // Note: VITE_ prefixed vars are for client-side, use regular env vars for config
  return process.env.BACKEND_URL || 'http://localhost:3001'
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3002,
    host: true,
    open: true,
    proxy: {
      "/api": {
        target: getBackendUrl(),
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

