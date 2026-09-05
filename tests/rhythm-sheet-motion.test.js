import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const cssSource = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
const screenSource = await readFile(
  new URL('../src/components/metronome/MetronomeScreen.jsx', import.meta.url),
  'utf8',
)

test('rhythm sheet motion does not repaint or scroll the background app', () => {
  const backdropRule = cssSource.match(/\.pulse-sheet-backdrop\s*\{([^}]*)\}/)?.[1] || ''
  const sheetRule = cssSource.match(/\.pulse-control-sheet\s*\{([^}]*)\}/)?.[1] || ''

  assert.doesNotMatch(backdropRule, /backdrop-filter/)
  assert.match(backdropRule, /will-change:\s*opacity/)
  assert.match(sheetRule, /height:\s*min\(78%, 660px\)/)
  assert.match(sheetRule, /will-change:\s*transform, opacity/)
  assert.match(cssSource, /\.pulse-sheet-scroll\s*\{[^}]*flex:\s*1 1 auto/s)
  assert.match(cssSource, /translate3d\(0, calc\(100% \+ 1px\), 0\)/)
  assert.match(screenSource, /sheetRef\.current\?\.focus\(\{ preventScroll: true \}\)/)
  assert.match(screenSource, /openerRef\.current\?\.focus\(\{ preventScroll: true \}\)/)
  assert.match(screenSource, /<h2 id="pulse-rhythm-title">Shape the click<\/h2>/)
  assert.doesNotMatch(screenSource, /<span>Shape the click<\/span>/)
  assert.doesNotMatch(screenSource, /StandardBeatPreview|PolyrhythmBeatPreview|pulse-beat-preview/)
  assert.doesNotMatch(cssSource, /pulse-preview-dot|pulse-beat-preview/)
})

test('sheet swipe owns only the fixed header and preserves scrollable controls', () => {
  assert.match(screenSource, /className="pulse-sheet-drag-area" \{\.\.\.sheetDragHandlers\}/)
  assert.match(cssSource, /\.pulse-sheet-drag-area\s*\{[^}]*touch-action: none/s)
  assert.match(cssSource, /\.pulse-sheet-scroll\s*\{[^}]*overflow-y: auto/s)
  assert.match(cssSource, /from \{ transform: translate3d\(0, var\(--sheet-drag-y, 0px\), 0\)/)
  assert.match(cssSource, /prefers-reduced-motion: reduce\)\s*\{\s*\.pulse-control-sheet\[data-drag-state="settling"\]:not\(\.is-closing\)\s*\{\s*transition: none/)
})
