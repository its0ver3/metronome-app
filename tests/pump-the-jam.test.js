import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import AudioEngine from '../src/audio/AudioEngine.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'
import { clampBpm, JAM_MAX_BPM } from '../src/audio/constants.js'
import { getTempoHeat } from '../src/components/metronome/tempoHeat.js'
import { saveSettings, loadSettings } from '../src/storage/settingsStorage.js'

test('Pump the Jam expands the limit, then clamps live and trainer tempos when disabled', () => {
  const engine = new AudioEngine()
  engine.setBpm(800)
  assert.equal(engine.bpm, 300)
  engine.setPumpTheJam(true)
  engine.setBpm(900)
  assert.equal(engine.bpm, 800)
  assert.equal(engine.maxBpm, 800)
  engine.setTempoTrainer(true, 650, 790)
  assert.equal(engine.bpm, 650)
  engine.setPumpTheJam(false)
  assert.equal(engine.bpm, 300)
  assert.equal(engine.tempoStartBpm, 300)
  assert.equal(engine.tempoTargetBpm, 300)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 300, 'preview restoration must not restore an out-of-range tempo')
  engine.setPumpTheJam(true)
  engine.isPlaying = true
  engine.setBpm(750)
  engine.setPumpTheJam(false)
  assert.equal(engine.bpm, 300)
  assert.equal(engine.isPlaying, true)
  engine.stop()
  assert.equal(clampBpm(900, JAM_MAX_BPM), 800)
})

test('saved opt-in restores before BPM and trainer settings', () => {
  let stored
  globalThis.localStorage = { getItem: () => stored, setItem: (_, value) => { stored = value } }
  try {
    saveSettings({ pumpTheJam: true, bpm: 780, tempoEnabled: false, tempoStartBpm: 650, tempoTargetBpm: 800 })
    const engine = restoreEngineSettings(new AudioEngine(), loadSettings())
    assert.equal(engine.pumpTheJam, true)
    assert.equal(engine.bpm, 780)
    assert.equal(engine.tempoTargetBpm, 800)
    const legacy = restoreEngineSettings(new AudioEngine(), { bpm: 800 })
    assert.equal(legacy.pumpTheJam, false)
    assert.equal(legacy.bpm, 300)
  } finally { delete globalThis.localStorage }
})

test('800 BPM retains correct timing even with 13 subdivisions', () => {
  const engine = new AudioEngine()
  engine.setPumpTheJam(true)
  engine.setBpm(800)
  engine.setSubdivision(13)
  engine._notifyAtAudioTime = () => {}
  for (let click = 0; click < 4 * 13; click++) engine._advanceBeat()
  assert.ok(Math.abs(engine._nextNoteTime - .3) < 1e-9)
  assert.equal(engine._currentBar, 2)
})

test('slider progress and colors span the expanded tempo range', () => {
  assert.equal(getTempoHeat(800, 800).sliderProgress, 100)
  assert.equal(getTempoHeat(410, 800).sliderProgress, 50)
  assert.equal(getTempoHeat(800, 800).color, getTempoHeat(300).color)
  assert.equal(getTempoHeat(790, 800).id, 'gradient')
  assert.equal(getTempoHeat(791, 800).id, 'fire')
})

async function component(path) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true,
    write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty', '.png': 'dataurl' } })
  const module = { exports: {} }
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
  return module.exports.default
}
const Slider = await component('../src/components/metronome/BpmControls.jsx')
const Transport = await component('../src/components/layout/GlobalTransport.jsx')
const Trainer = await component('../src/components/training/TempoTrainer.jsx')
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))

test('sliders and trainer wheels expose 800, and the mini transport can nudge beyond 300', () => {
  assert.match(render(Slider, { bpm: 750, maxBpm: 800 }), /max="800"/)
  const trainer = render(Trainer, { enabled: true, maxBpm: 800, startBpm: 500, targetBpm: 800, increment: 5, everyBars: 4 })
  assert.equal((trainer.match(/aria-valuemax="800"/g) || []).length, 2)
  let bpm = 300
  const node = Transport({ bpm, maxBpm: 800, onBpmChange: value => { bpm = value } })
  const panel = node.props.children[1].props.children.props.children.find(child => child?.props?.className === 'pulse-global-transport')
  const plus = panel.props.children[1].props.children[2]
  assert.equal(plus.props.disabled, false)
  plus.props.onClick()
  assert.equal(bpm, 301)
})
