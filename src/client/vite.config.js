import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'node',
  },
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/books': 'http://localhost:8080',
      '/genres': 'http://localhost:8080',
    },
  },
})
