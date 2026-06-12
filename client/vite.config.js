import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 8 transforms with Oxc (not esbuild) and derives the language from the
// file extension, so `.js` files default to plain JS and reject the JSX in this
// React 16 codebase. This pre-transform forces JSX parsing for source `.js`
// files — the Vite 8 replacement for the old `esbuild: { loader: 'jsx' }` block.
const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!/\/src\/.*\.js$/.test(id.split('?')[0])) return null
    return await transformWithOxc(code, id, { lang: 'jsx' })
  },
})

export default defineConfig({
  test: {
    environment: 'node',
  },
  plugins: [
    react({
      include: /\.(jsx?|tsx?)$/,
    }),
    transformJsxInJs(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/books': 'http://localhost:8080',
      '/genres': 'http://localhost:8080',
      '/comment': 'http://localhost:8080',
    },
  },
  optimizeDeps: {
    // Rolldown/Oxc equivalent of the old optimizeDeps.esbuildOptions.loader,
    // so the dev dependency scan also treats `.js` as JSX.
    rolldownOptions: {
      moduleTypes: { '.js': 'jsx' },
    },
  },
})
