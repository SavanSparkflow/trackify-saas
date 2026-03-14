import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
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
