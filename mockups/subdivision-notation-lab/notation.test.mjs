import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'

const result = await build({ entryPoints: [fileURLToPath(new URL('./notation.jsx', import.meta.url))],
  bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'] })
const module = { exports: {} }
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
const { notationFor, Notes, choices } = module.exports

test('all production subdivisions have correctly valued one-beat notation', () => {
  assert.deepEqual(choices, Array.from({ length: 13 }, (_, i) => i + 1))
  for (const count of choices) {
    const { beams, tuplet } = notationFor(count)
    const ordinaryNotesPerBeat = 2 ** beams
    const tupletFactor = tuplet ? ordinaryNotesPerBeat / tuplet : 1
    assert.ok(Math.abs(count / ordinaryNotesPerBeat * tupletFactor - 1) < 1e-12)
    assert.equal(tuplet === null, [1, 2, 4, 8].includes(count))
  }
})

test('engraving includes every notehead and the appropriate beam and tuplet count', () => {
  for (const count of choices) {
    const html = renderToStaticMarkup(createElement(Notes, { count, active: count - 1 }))
    assert.equal((html.match(/class="music-head"/g) || []).length, count)
    assert.equal((html.match(/stroke-width="3"/g) || []).length, notationFor(count).beams)
    assert.equal((html.match(/class="lab-tuplet"/g) || []).length, notationFor(count).tuplet ? 1 : 0)
    assert.equal((html.match(/class="note-lit"/g) || []).length, 1)
    assert.ok(html.includes('\uE0A4'))
  }
  assert.throws(() => notationFor(0), RangeError)
  assert.throws(() => notationFor(14), RangeError)
})

test('prototype has isolated playback and no writes to production preferences', async () => {
  const source = await readFile(new URL('./main.jsx', import.meta.url), 'utf8')
  assert.match(source, /new AudioEngine\(\)/)
  assert.doesNotMatch(source, /localStorage|sessionStorage|restoreEngineSettings/)
  assert.match(source, /visibilitychange/)
  assert.match(source, /engineRef\.current\?\.stop\(\)/)
})
