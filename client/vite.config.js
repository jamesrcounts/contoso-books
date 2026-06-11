import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx?|tsx?)$/,
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/books': 'http://localhost:8080',
      '/search': 'http://localhost:8080',
      '/genres': 'http://localhost:8080',
      '/comment': 'http://localhost:8080',
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})
