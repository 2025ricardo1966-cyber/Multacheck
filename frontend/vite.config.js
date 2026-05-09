import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api': {
        // Puerto oficial del backend (ver backend/src/config/env.js OFFICIAL_API_PORT).
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
