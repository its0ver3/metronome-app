import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import { METER_PRESETS, normalizeMeter, meterGroups, writtenNoteSeconds } from '../src/audio/meter.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'
import { getSubdivisionNotation, getSubdivisionLabel } from '../src/components/metronome/subdivisionMusic.js'
import { getRhythmReadoutLabel } from '../src/components/metronome/rhythmReadoutLabel.js'

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
function instrument(meter) {
  const engine = new AudioEngine()
  engine.setMeter(meter)
  engine._notifyAtAudioTime = (_time, callback) => callback()
  const sounds = []
  engine.soundBank = Object.fromEntries(['getBuffer', 'getDownbeatBuffer', 'getSubdivisionBuffer'].map(kind => [kind, (_sound, options) => ({ kind, ...options })]))
  engine._playSound = (buffer, time, volume) => sounds.push({ ...buffer, time, volume })
  return { engine, sounds }
}
function runBar(engine) {
  const start = engine._nextNoteTime
  const bar = engine._currentBar
  let count = 0
  do {
    engine._scheduleNote(engine._nextNoteTime)
    engine._advanceBeat()
    if (++count > 208) throw new Error('Bar did not terminate')
  } while (engine._currentBar === bar)
  return { duration: engine._nextNoteTime - start, count }
}

test('production timing uses quarter-note BPM for every preset and subdivisions 1–13', () => {
  for (const meter of METER_PRESETS) for (const bpm of [20, 120, 300]) for (const tempoUnit of ['quarter', 'dotted', 'eighth']) for (let subdivision = 1; subdivision <= 13; subdivision++) {
    const { engine } = instrument({ ...meter, tempoUnit })
    engine.setBpm(bpm)
    engine.setSubdivision(subdivision)
    const bar = runBar(engine)
    near(bar.duration, meter.numerator * 4 / meter.denominator * 60 / bpm)
    assert.equal(bar.count, meter.numerator * subdivision)
  }
})
test('6/8 speaks two group counts, with ordinary eighth clicks between, at quarter-note BPM', () => {
  const { engine, sounds } = instrument(normalizeMeter({ numerator: 6, denominator: 8 }))
  engine.setBpm(120)
  near(runBar(engine).duration, 1.5)
  assert.equal(sounds.length, 6)
  const main = sounds.filter(sound => sound.kind !== 'getSubdivisionBuffer')
  assert.deepEqual(main.map(sound => sound.beatNumber), [1, 2])
  near(main[1].time, .75)
  assert.ok(main.every(sound => sound.bpm === 80))
  assert.equal(main[0].kind, 'getDownbeatBuffer')
  assert.ok(sounds.filter(sound => sound.kind === 'getSubdivisionBuffer').every(sound => sound.volume < main[0].volume))
})
test('7/8 group-only clicks and voice durations preserve unequal group spacing', () => {
  for (const groups of [[2, 2, 3], [2, 3, 2], [3, 2, 2]]) {
    const { engine, sounds } = instrument({ numerator: 7, denominator: 8, groups, groupOnly: true })
    engine.setBpm(120)
    near(runBar(engine).duration, 1.75)
    assert.equal(sounds.length, 3)
    meterGroups(engine.meter).forEach((group, index) => {
      near(sounds[index].time, group.start * .25)
      near(sounds[index].bpm, 60 / (group.length * .25))
    })
  }
})
test('muted groups remain muted through subdivision-stage changes; Accent retains quiet internal clicks', () => {
  const { engine, sounds } = instrument(normalizeMeter({ numerator: 6, denominator: 8 }))
  engine.cycleBeatAccent(0)
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['OFF', 'OFF', 'OFF'])
  engine.setSubdivision(4)
  assert.ok(engine.subdivisionAccents.slice(0, 12).every(level => level === 'OFF'))
  runBar(engine)
  assert.ok(sounds.every(sound => sound.time >= writtenNoteSeconds(engine.meter, engine.bpm) * 3))
  assert.equal(sounds[0].volume, 1)
  assert.ok(sounds.slice(1).every(sound => sound.volume < 1))
})
test('all three production trainers progress on full meter bars and return group-only mode when disabled', () => {
  for (const meter of METER_PRESETS) {
    const { engine, sounds } = instrument({ ...meter, groupOnly: meter.denominator === 8 })
    engine.setGapTraining(true, 2, 1)
    engine.setTempoTrainer(true, 100, 120, 5, 2)
    engine.setSubdivisionTrainer(true, [{ subdivision: 1, bars: 2 }, { subdivision: 2, bars: 2 }])
    for (let barIndex = 0; barIndex < 6; barIndex++) {
      const before = sounds.length
      const bpm = engine.bpm
      const expectedSubdivision = Math.floor(barIndex / 2) % 2 ? 2 : 1
      const result = runBar(engine)
      near(result.duration, meter.numerator * writtenNoteSeconds(engine.meter, bpm))
      assert.equal(result.count, meter.numerator * expectedSubdivision)
      assert.equal(sounds.length - before, barIndex % 3 === 2 ? 0 : result.count)
      assert.equal(engine.bpm, Math.min(120, 100 + Math.floor((barIndex + 1) / 2) * 5))
    }
    engine.setSubdivisionTrainer(false)
    assert.equal(engine.meter.groupOnly, meter.denominator === 8)
  }
})
test('legacy settings migrate to N/4 without losing tempo, detailed accents or stages', () => {
  const engine = restoreEngineSettings(new AudioEngine(), { beatsPerBar: 7, subdivision: 2, bpm: 137, subdivisionAccents: ['OFF', 'ON', 'ACCENT'] })
  assert.equal(engine.meter.numerator, 7)
  assert.equal(engine.meter.denominator, 4)
  assert.deepEqual(engine.meter.groups, Array(7).fill(1))
  assert.equal(engine.bpm, 137)
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['OFF', 'ON', 'ACCENT'])
})
test('saved non-quarter tempo units reset to quarter without losing BPM or grouping', () => {
  for (const tempoUnit of ['dotted', 'eighth']) {
    const engine = restoreEngineSettings(new AudioEngine(), { bpm: 120, meter: { numerator: 7, denominator: 8, groups: [2, 3, 2], tempoUnit } })
    assert.equal(engine.meter.tempoUnit, 'quarter')
    assert.equal(engine.bpm, 120)
    assert.deepEqual(engine.meter.groups, [2, 3, 2])
    near(writtenNoteSeconds(engine.meter, engine.bpm), .25)
  }
})
test('meter snapshots round-trip, resist malformed settings, and cannot mutate engine groups', () => {
  const first = instrument({ numerator: 7, denominator: 8, groups: [3, 2, 2], tempoUnit: 'quarter', groupOnly: true }).engine
  first.setSubdivision(3)
  first.cycleBeatAccent(3)
  const state = first.getState()
  const restored = restoreEngineSettings(new AudioEngine(), state)
  assert.deepEqual(restored.meter, first.meter)
  assert.deepEqual(restored.subdivisionAccents, first.subdivisionAccents)
  state.meter.groups[0] = 999
  assert.equal(first.meter.groups[0], 3)
  for (const invalid of [null, {}, { numerator: 999, denominator: 3, groups: [-1], tempoUnit: '__proto__' }, { numerator: 7, denominator: 8, groups: [2, 2] }]) {
    const meter = normalizeMeter(invalid)
    assert.equal(meter.groups.reduce((a, b) => a + b, 0), meter.numerator)
    assert.ok(Number.isFinite(writtenNoteSeconds(meter, 100)))
  }
})
test('meter edits stop transport and cancel scheduled sources; polyrhythm retains the standard meter', () => {
  const { engine } = instrument(normalizeMeter({ numerator: 7, denominator: 8 }))
  let stops = 0
  engine._sources.add({ stop() { stops++ } })
  engine.isPlaying = true
  engine.setMeter(normalizeMeter({ numerator: 6, denominator: 8 }))
  assert.equal(engine.isPlaying, false)
  assert.equal(stops, 1)
  engine.setPolyrhythmMode(true)
  assert.deepEqual(engine.meter, normalizeMeter({ numerator: 6, denominator: 8 }))
  engine.setPolyrhythmMode(false)
  assert.deepEqual(engine.meter, normalizeMeter({ numerator: 6, denominator: 8 }))
})
test('notation follows the written eighth-note unit and readouts announce actual meter/grouping', () => {
  assert.equal(getSubdivisionNotation(1, 8).name, 'Eighth notes')
  assert.equal(getSubdivisionNotation(2, 8).name, 'Sixteenth notes')
  assert.equal(getSubdivisionNotation(3, 8).name, 'Sixteenth-note triplets')
  assert.match(getSubdivisionLabel(3, 8), /3 clicks per eighth note/)
  assert.match(getRhythmReadoutLabel({ meter: normalizeMeter({ numerator: 7, denominator: 8 }), subdivision: 0 }), /7\/8, grouped 2 \+ 2 \+ 3, group pulses only/)
})

test('changing meter while audio is still loading cancels the pending start', async () => {
  const engine = new AudioEngine()
  let finishLoading
  engine.ctx = { state: 'running' }
  engine._ensureContext = () => true
  engine._unlockAudio = async () => true
  engine.init = () => new Promise(resolve => { finishLoading = resolve })
  engine.soundBank = { prepareSound: async () => {} }
  engine._scheduler = () => { throw new Error('Cancelled playback must not start') }
  const starting = engine.start()
  await Promise.resolve()
  engine.setMeter(normalizeMeter({ numerator: 7, denominator: 8 }))
  finishLoading(true)
  await starting
  assert.equal(engine.isPlaying, false)
  assert.equal(engine._timerId, null)
})
