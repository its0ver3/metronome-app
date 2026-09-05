import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const htmlSource = await readFile(
  new URL('../mockups/bpm-color-lab/index.html', import.meta.url),
  'utf8',
)
const scriptSource = await readFile(
  new URL('../mockups/bpm-color-lab/app.js', import.meta.url),
  'utf8',
)
const cssSource = await readFile(
  new URL('../mockups/bpm-color-lab/styles.css', import.meta.url),
  'utf8',
)

test('BPM color lab stays isolated and compares five synchronized directions', () => {
  assert.equal((htmlSource.match(/data-scheme=/g) || []).length, 5)
  assert.match(htmlSource, /id="tempo-slider"[^>]*type="range"/s)
  assert.match(htmlSource, /min="20"/)
  assert.match(htmlSource, /max="300"/)
  assert.match(cssSource, /\.\.\/\.\.\/blue-olive-badge\.png/)
  assert.equal((scriptSource.match(/id: '/g) || []).length, 5)
  assert.match(scriptSource, /renderCompareCards\(progress\)/)
  assert.doesNotMatch(scriptSource, /from ['"]\.\.\/\.\.\/src/)
})
