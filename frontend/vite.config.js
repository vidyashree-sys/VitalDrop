import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // THIS FORCES VITE TO BROADCAST ON THE NETWORK
    proxy: {
      '/api': 'http://localhost:5000', // Replace with your backend port
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kB
  },
})
