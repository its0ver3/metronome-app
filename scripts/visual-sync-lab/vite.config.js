import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)), base: '/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'tmp/visual-sync-static', assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) } },
})
