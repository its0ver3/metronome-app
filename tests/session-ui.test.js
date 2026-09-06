import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { normalizeSessionSettings } from '../src/audio/sessionSettings.js'

async function component(path) {
  const compiled = await build({
    entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false,
    platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'],
    loader: { '.css': 'empty' },
  })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
  return module.exports.default
}
const Settings = await component('../src/components/settings/SessionSettings.jsx')
const Status = await component('../src/components/metronome/SessionStatus.jsx')
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))

test('count-in and timer controls expose saved selections and custom durations', () => {
  for (const mode of ['off', 'minutes', 'bars']) {
    const html = render(Settings, { settings: { countInBars: 2, mode, minutes: 7, bars: 123 }, isPlaying: false })
    assert.match(html, /aria-label="2 bars" aria-pressed="true">2/)
    assert.match(html, /aria-label="Playback timer mode"/)
    assert.match(html, new RegExp(`<option value="${mode}" selected="">`))
    assert.doesNotMatch(html, /disabled=""/)
    if (mode === 'off') assert.doesNotMatch(html, /role="spinbutton"/)
    else assert.match(html, new RegExp(`role="spinbutton" aria-label="Playback timer ${mode}" aria-valuenow="${mode === 'minutes' ? 7 : 123}"`))
  }
  const running = render(Settings, { settings: { mode: 'bars' }, isPlaying: true })
  assert.equal((running.match(/disabled=""/g) || []).length, 4)
  assert.match(running, /role="spinbutton"[^>]*aria-disabled="true"/)
  assert.match(running, /Stop playback to change/)
})

test('status pills distinguish count-in, remaining minutes, bars and completion', () => {
  const defaults = normalizeSessionSettings()
  assert.equal(render(Status, { session: defaults }), '')
  const session = { ...defaults, countInBars: 2, mode: 'minutes', remainingSeconds: 300, remainingBars: 50 }
  const countIn = render(Status, { session: { ...session, phase: 'count-in', countInBar: 2, countInBeat: 3 } })
  assert.match(countIn, /Count-in/)
  assert.match(countIn, /<strong>3<\/strong>/)
  assert.match(countIn, /Bar 2\/2/)
  assert.match(countIn, /5:00/)
  assert.match(countIn, /after count-in/)
  const playing = render(Status, { session: { ...session, phase: 'playing', remainingSeconds: 124 } })
  assert.match(playing, /2:04/)
  assert.match(playing, /left/)
  assert.doesNotMatch(playing, /<span>Count-in<\/span>/)
  const bars = render(Status, { session: { ...session, phase: 'playing', mode: 'bars', remainingBars: 1 } })
  assert.match(bars, /1 bar<\/strong>/)
  const complete = render(Status, { session: { ...session, phase: 'complete', remainingSeconds: 0 } })
  assert.match(complete, /Complete/)
  assert.match(complete, /0:00/)
})
