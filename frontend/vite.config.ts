import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // Permite ngrok e outros túneis
    // Hot reload para Docker
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        // Usa backend:3000 dentro do Docker, localhost:3000 fora
        target: process.env.DOCKER_ENV ? 'http://backend:3000' : 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
