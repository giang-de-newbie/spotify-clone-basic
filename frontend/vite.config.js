import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/media': {
        target: 'http://localhost:8000', // Địa chỉ Django server
        changeOrigin: true,
      },
      '/api': {  // Nếu bạn có API endpoints
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})