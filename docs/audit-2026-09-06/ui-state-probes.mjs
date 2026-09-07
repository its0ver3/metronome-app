// Audit evidence: assertions describe confirmed CURRENT defects, not desired behavior.
// Run from repository root: node tmp/audit/ui-state-probes.mjs
import assert from 'node:assert/strict'
import AudioEngine from '../../src/audio/AudioEngine.js'
import { restoreEngineSettings } from '../../src/audio/engineSettings.js'
import { loadSettings } from '../../src/storage/settingsStorage.js'
import { registerTempoTap } from '../../src/components/metronome/tapTempo.js'

function probe(name, run) {
  run()
  console.log(`CONFIRMED: ${name}`)
}

probe('Reselecting the same subdivision discards custom inner-click accents', () => {
  const engine = new AudioEngine()
  engine.setSubdivision(4)
  engine.setSubdivisionAccent(1, 'OFF')
  engine.setSubdivisionAccent(2, 'ACCENT')
  assert.deepEqual(engine.subdivisionAccents.slice(0, 4), ['ACCENT', 'OFF', 'ACCENT', 'ON'])
  engine.setSubdivision(4)
  assert.deepEqual(engine.subdivisionAccents.slice(0, 4), ['ACCENT', 'ON', 'ON', 'ON'])
})

probe('Four taps fail at 20, 25, and 30 BPM but succeed from 31 BPM', () => {
  for (const bpm of [20, 25, 30, 31, 60, 120, 300, 800]) {
    let taps = []
    let result
    for (let index = 0; index < 4; index++) {
      result = registerTempoTap(taps, index * 60000 / bpm)
      taps = result.taps
    }
    assert.equal(result.bpm, bpm <= 30 ? null : bpm)
    if (bpm <= 30) assert.equal(result.taps.length, 1)
  }
})

probe('Valid JSON with malformed polyRhythm1 passes loadSettings and crashes restoration', () => {
  const previousStorage = globalThis.localStorage
  try {
    for (const polyRhythm1 of [3.5, 'bad']) {
      globalThis.localStorage = { getItem: () => JSON.stringify({ version: 5, polyRhythm1 }) }
      const saved = loadSettings()
      assert.equal(saved.polyRhythm1, polyRhythm1)
      assert.throws(() => restoreEngineSettings(new AudioEngine(), saved), RangeError)
    }
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

probe('Malformed volume persists as NaN and string tempo increment jumps to target', () => {
  const volumeEngine = restoreEngineSettings(new AudioEngine(), { volume: 'bad' })
  assert.ok(Number.isNaN(volumeEngine.volume))
  const tempoEngine = restoreEngineSettings(new AudioEngine(), {
    tempoEnabled: true, tempoStartBpm: 100, tempoTargetBpm: 140,
    tempoIncrement: '2', tempoEveryBars: 1,
  })
  tempoEngine._notifyAtAudioTime = (_time, callback) => callback()
  assert.equal(tempoEngine.bpm, 100)
  tempoEngine._handleBarBoundary(0)
  assert.equal(tempoEngine.bpm, 140)
})
