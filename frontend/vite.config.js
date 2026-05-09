import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT?.trim() || '3000'
  const target = `http://127.0.0.1:${backendPort}`

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        '/api': {
          // Alinear con backend PORT / MULTACHECK_EFFECTIVE_PORT (desarrollo).
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
