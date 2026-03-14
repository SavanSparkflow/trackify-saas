import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // target: 'http://192.168.1.26:5000',
        target: 'http://192.168.0.112:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        // target: 'http://192.168.1.26:5000',
        target: 'http://192.168.0.112:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
