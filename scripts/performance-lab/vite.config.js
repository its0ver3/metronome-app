import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const names = ['AppShell', 'MetronomeScreen', 'TrainingScreen', 'SettingsScreen', 'NumberWheel', 'BpmControls', 'RhythmArc']
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)), base: '/',
  resolve: { alias: [{ find: 'react-dom/client', replacement: 'react-dom/profiling' }] },
  plugins: [{
    name: 'audit-render-counts', enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/src/') || !id.endsWith('.jsx')) return
      for (const name of names) {
        code = code.replace(new RegExp(`(function ${name}\\([\\s\\S]*?\\)\\s*\\{)`),
          `$1 globalThis.__auditCount?.('${name}');`)
      }
      return code
    },
  }, react(), tailwindcss()],
  build: { outDir: 'tmp/performance-static', assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL('./index.html', import.meta.url)) } },
})
