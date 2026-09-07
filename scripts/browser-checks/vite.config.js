import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  base: '/',
  build: {
    outDir: 'tmp/browser-checks',
    assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) },
  },
})
