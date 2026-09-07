import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  base: '/',
  publicDir: false,
  build: {
    outDir: 'tmp/timing-static',
    assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) },
  },
})
