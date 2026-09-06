import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { normalizeMeter } from '../src/audio/meter.js'

const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/components/metronome/KitView.jsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
const module = { exports: {} }
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(
  module, module.exports, createRequire(import.meta.url),
)
const KitView = module.exports.default
const defaults = {
  bpm: 120, isPlaying: false, currentBeat: 0, beatsPerBar: 4,
  meter: normalizeMeter(null, 4), subdivision: 1,
  subdivisionAccents: ['ACCENT', 'ON', 'ON', 'OFF'],
  polyRhythm1: 3, polyRhythm2: 4, polyBeat1: 1, polyBeat2: 2,
  polyAccents1: ['ACCENT', 'ON', 'OFF'], polyAccents2: ['ACCENT', 'ON', 'ON', 'OFF'],
  onBpmChange() {}, onToggle() {}, onExit() {}, onCycleBeatAccent() {}, onCyclePolyAccent() {},
}
const render = overrides => renderToStaticMarkup(createElement(KitView, { ...defaults, ...overrides }))

test('Kit View exposes one playback target with the tempo slider outside it', () => {
  for (const isPlaying of [false, true]) {
    const html = render({ isPlaying })
    assert.equal((html.match(/<button /g) || []).length, 1)
    assert.match(html, new RegExp(`aria-label="${isPlaying ? 'Stop' : 'Start'} metronome"`))
    assert.match(html, new RegExp(`aria-pressed="${isPlaying}"`))
    assert.match(html, /<button[^>]*><\/button>/)
    assert.match(html, /<input[^>]*type="range"[^>]*min="20"[^>]*max="300"/)
    assert.equal((html.match(/role="button"/g) || []).length, 4)
    assert.doesNotMatch(html, /pulse-kit-title|pulse-kit-state|Slide to adjust tempo|>Ready<|>Playing</)
    assert.equal((html.match(/data-active="true"/g) || []).length, isPlaying ? 1 : 0)
  }
})

test('Kit View keeps Tempo Trainer ownership and distinguishes silent bars from stopped playback', () => {
  for (const tempoEnabled of [false, true]) for (const polyrhythmMode of [false, true]) {
    const html = render({ tempoEnabled, polyrhythmMode, isPlaying: true, gapEnabled: true, inGap: true })
    const slider = html.match(/<input[^>]*type="range"[^>]*>/)[0]
    assert.equal(/ disabled=""/.test(slider), tempoEnabled && !polyrhythmMode)
    assert.equal(html.includes('Tempo controlled by Tempo Trainer'), tempoEnabled && !polyrhythmMode)
    assert.equal(html.includes('Gap · Silent'), !polyrhythmMode)
    assert.match(html, /Tap anywhere to stop/)
  }
})

test('Kit View exposes editable accents for unequal meter groups and both polyrhythm voices', () => {
  const meter = normalizeMeter({ numerator: 7, denominator: 8, groups: [2, 2, 3] })
  const standard = render({ meter, beatsPerBar: 7, currentBeat: 5, isPlaying: true })
  assert.equal((standard.match(/data-rhythm="standard"/g) || []).length, 3)
  assert.match(standard, /data-beat="2" data-active="true"/)
  assert.match(standard, /7\/8/)
  assert.equal((standard.match(/class="pulse-orbit-segment-hit" role="button" tabindex="0"/g) || []).length, 3)
  const poly = render({ polyrhythmMode: true, isPlaying: true })
  assert.equal((poly.match(/data-rhythm="one"/g) || []).length, 3)
  assert.equal((poly.match(/data-rhythm="two"/g) || []).length, 4)
  assert.equal((poly.match(/data-active="true"/g) || []).length, 2)
  assert.equal((poly.match(/class="pulse-orbit-segment-hit" role="button" tabindex="0"/g) || []).length, 7)
})
