import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import AudioEngine from '../src/audio/AudioEngine.js'
import { getPracticeRows } from '../src/components/metronome/practiceStatus.js'

const built = await build({
  entryPoints: [fileURLToPath(new URL('../src/components/metronome/PracticeStatusRack.jsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
const module = { exports: {} }
new Function('module', 'exports', 'require', built.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url))
const Rack = module.exports.default
const defaults = {
  isPlaying: true, bpm: 105, meter: { denominator: 4 }, inGap: true,
  gapEnabled: true, gapClickBars: 2, gapPattern: 'silence',
  gapPlayback: { enabled: true, pattern: 'triplet-third', bar: 2, bars: 3 },
  tempoEnabled: true, tempoTargetBpm: 120, tempoEveryBars: 4,
  subdivTrainerEnabled: true, subdivTrainerStages: [{ subdivision: 1, bars: 2 }, { subdivision: 3, bars: 5 }],
  trainerPlayback: {
    tempo: { enabled: true, bar: 3, bars: 4, target: 120, reached: false },
    subdivision: { enabled: true, index: 1, bar: 4, stage: { subdivision: 3, bars: 5 } },
  },
}
const render = props => renderToStaticMarkup(createElement(Rack, props))

test('rack shows every enabled combination and opens practice tools from its rows', () => {
  for (let mask = 0; mask < 8; mask++) {
    let opened = 0
    const props = { ...defaults, gapEnabled: Boolean(mask & 1), tempoEnabled: Boolean(mask & 2), subdivTrainerEnabled: Boolean(mask & 4), onOpenTraining: () => { opened++ } }
    const count = getPracticeRows(props).length
    const html = render(props)
    assert.equal((html.match(/<button/g) || []).length, count)
    assert.doesNotMatch(html, /trainer-pictogram|tool-icon|border-left/)
    if (!count) assert.equal(html, '')
    else {
      const tree = Rack(props)
      tree.props.children[0].props.onClick()
      assert.equal(opened, 1)
    }
  }
})

test('live rows use audio-time bar counts and notation rather than pending settings', () => {
  const rows = getPracticeRows(defaults)
  assert.deepEqual(rows.map(row => [row.id, row.bar, row.total]), [['gap', 2, 3], ['tempo', 3, 4], ['subdivision', 4, 5]])
  assert.equal(rows[0].value, 'Triplet · 3rd')
  assert.equal(rows[2].subdivision, 3)
  assert.equal(rows[2].value, 'B')
  const html = render(defaults)
  assert.match(html, /data-subdivision="3"/)
  assert.match(html, /Bar 2 of 3/)
  assert.match(html, /Bar 3 of 4/)
  assert.match(html, /Stage B/)
  assert.match(render({ ...defaults, meter: { denominator: 8 } }), /sixteenth-note triplets/i)
})

test('ready, pending activation, target reached and polyrhythm paused states are distinct', () => {
  const ready = getPracticeRows({ ...defaults, isPlaying: false })
  assert.ok(ready.every(row => row.bar === 0 && row.progressLabel === 'Ready'))
  assert.equal(ready[0].value, 'Click')
  assert.equal(ready[2].value, 'A')
  const pending = getPracticeRows({ ...defaults, trainerPlayback: null, gapPlayback: null })
  assert.ok(pending.every(row => row.bar === 0 && row.progressLabel === 'Next bar'))
  const reached = getPracticeRows({ ...defaults, trainerPlayback: { ...defaults.trainerPlayback, tempo: { ...defaults.trainerPlayback.tempo, reached: true } } })[1]
  assert.equal(reached.progressLabel, 'Target reached')
  assert.equal(reached.bar, reached.total)
  const paused = render({ ...defaults, polyrhythmMode: true })
  assert.match(paused, /3 trainers paused/)
  assert.match(paused, /Polyrhythm on/)
  assert.doesNotMatch(paused, /pulse-practice-meter|data-subdivision/)
})

test('rack handles the longest supported bar interval and subdivision group', () => {
  const html = render({ ...defaults, trainerPlayback: {
    tempo: { enabled: true, bar: 32, bars: 32, target: 120 },
    subdivision: { enabled: true, index: 3, bar: 16, stage: { subdivision: 13, bars: 16 } },
  } })
  assert.match(html, /Bar 32 of 32/)
  assert.match(html, /data-dense="true"/)
  assert.match(html, /data-subdivision="13"/)
  assert.doesNotMatch(html, /NaN|undefined/)
})

test('scheduler snapshots preserve each audible bar even after the scheduler advances', () => {
  const engine = new AudioEngine()
  const callbacks = [], events = []
  engine._notifyAtAudioTime = (_, callback) => callbacks.push(callback)
  engine.onBeat(event => events.push(event))
  engine._playSound = () => {}
  engine.soundBank = { getBuffer() {}, getDownbeatBuffer() {}, getSubdivisionBuffer() {} }
  engine.setTempoTrainer(true, 100, 110, 5, 2)
  engine.setSubdivisionTrainer(true, [{ subdivision: 1, bars: 2 }, { subdivision: 3, bars: 3 }])
  for (let bar = 1; bar <= 5; bar++) {
    while (engine._currentBar === bar) {
      engine._scheduleNote(engine._nextNoteTime)
      engine._advanceBeat()
    }
  }
  callbacks.forEach(callback => callback())
  const snapshots = events.filter(event => event.beat === 0 && event.subdivision === 0).map(event => event.trainerPlayback)
  assert.deepEqual(snapshots.map(snapshot => snapshot.tempo.bar), [1, 2, 1, 2, 1])
  assert.deepEqual(snapshots.map(snapshot => snapshot.tempo.reached), [false, false, false, false, true])
  assert.deepEqual(snapshots.map(snapshot => [snapshot.subdivision.index, snapshot.subdivision.bar, snapshot.subdivision.stage.subdivision]), [[0, 1, 1], [0, 2, 1], [1, 1, 3], [1, 2, 3], [1, 3, 3]])
  engine.subdivTrainerStages[0].subdivision = 13
  assert.equal(snapshots[0].subdivision.stage.subdivision, 1)
})
