import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'
import { writtenNoteSeconds } from '../src/audio/meter.js'
import { saveSettings, loadSettings } from '../src/storage/settingsStorage.js'

function instrument(pattern, meter = { numerator: 4, denominator: 4 }, subdivision = 1) {
  const engine = new AudioEngine()
  engine.setMeter(meter)
  engine.setSubdivision(subdivision)
  engine.setGapTraining(true, 1, 1, pattern)
  const sounds = [], events = []
  engine._notifyAtAudioTime = (_, callback) => callback()
  engine.onBeat(event => events.push(event))
  engine.soundBank = {
    getBuffer: () => 'beat', getDownbeatBuffer: () => 'downbeat',
    getSubdivisionBuffer: () => 'subdivision',
  }
  engine._playSound = (buffer, time, volume) => sounds.push({ buffer, time, volume })
  return { engine, sounds, events }
}
function bar(engine) {
  const start = engine._nextNoteTime, number = engine._currentBar
  let ticks = 0
  while (engine._currentBar === number) {
    engine._scheduleNote(engine._nextNoteTime)
    engine._advanceBeat()
    assert.ok(++ticks < 1000, 'bar must complete')
  }
  return { start, duration: engine._nextNoteTime - start }
}
function near(a, b) { assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`) }

for (const [pattern, offsets] of [
  ['silence', []], ['offbeat', [.5]], ['second', [.25]],
  ['fourth', [.75]], ['triplet-second', [1 / 3]], ['triplet-third', [2 / 3]],
]) {
  test(`${pattern} sounds only at its written positions, then restores the saved click pattern`, () => {
    for (const meter of [{ numerator: 4, denominator: 4 }, { numerator: 7, denominator: 8, groups: [2, 2, 3], groupOnly: true }]) {
      for (const subdivision of [1, 3, 7]) {
        const { engine, sounds, events } = instrument(pattern, meter, subdivision)
        const saved = [...engine.subdivisionAccents]
        const unit = writtenNoteSeconds(engine.meter, engine.bpm)
        bar(engine)
        const firstClicks = sounds.map(sound => ({ ...sound }))
        sounds.length = 0
        const gap = bar(engine)
        near(gap.duration, meter.numerator * unit)
        const expected = Array.from({ length: meter.numerator }, (_, beat) => offsets.map(offset => gap.start + (beat + offset) * unit)).flat()
        assert.equal(sounds.length, expected.length)
        sounds.forEach((sound, index) => {
          near(sound.time, expected[index])
          assert.equal(sound.buffer, 'beat')
        })
        assert.deepEqual(engine.subdivisionAccents, saved)
        assert.equal(engine.subdivision, subdivision)
        assert.ok(events.some(event => event.inGap && event.gapPattern === pattern))
        sounds.length = 0
        const returned = bar(engine)
        assert.equal(sounds.length, firstClicks.length)
        sounds.forEach((sound, index) => {
          near(sound.time - returned.start, firstClicks[index].time)
          assert.equal(sound.volume, firstClicks[index].volume)
          assert.equal(sound.buffer, firstClicks[index].buffer)
        })
      }
    }
  })
}

test('pattern edits and disabling apply at the next bar without changing the current bar length', () => {
  const { engine, sounds } = instrument('offbeat')
  bar(engine)
  engine.isPlaying = true
  const start = engine._nextNoteTime
  engine._scheduleNote(start)
  engine._advanceBeat()
  engine.setGapTraining(true, 1, 3, 'second')
  assert.equal(engine._playbackSubdivision(), 2)
  while (engine._currentBar === 2) {
    engine._scheduleNote(engine._nextNoteTime)
    engine._advanceBeat()
  }
  near(engine._nextNoteTime - start, 2)
  assert.deepEqual(sounds.slice(-4).map(sound => Number((sound.time - start).toFixed(4))), [.25, .75, 1.25, 1.75])
  assert.equal(engine._inGap, false) // bar-count edits restart the cycle at a boundary
  bar(engine)
  assert.equal(engine._playbackSubdivision(), 4)
  engine._scheduleNote(engine._nextNoteTime)
  engine._advanceBeat()
  engine.setGapTraining(false)
  assert.equal(engine._playbackSubdivision(), 4)
  while (engine._currentBar === 4) {
    engine._scheduleNote(engine._nextNoteTime)
    engine._advanceBeat()
  }
  assert.equal(engine._playbackSubdivision(), 1)
  assert.equal(engine._inGap, false)
})

test('pattern-only edits retain progress and the subdivision and tempo trainers keep advancing', () => {
  const { engine } = instrument('offbeat')
  engine.setGapTraining(true, 1, 3)
  engine.setSubdivisionTrainer(true, [{ subdivision: 3, bars: 1 }, { subdivision: 7, bars: 1 }])
  engine.setTempoTrainer(true, 100, 140, 5, 1)
  bar(engine)
  engine.isPlaying = true
  engine.setGapTraining(true, 1, 3, 'fourth')
  assert.equal(engine._playbackSubdivision(), 2)
  const oldBpm = engine.bpm
  const gapBar = bar(engine)
  near(gapBar.duration, 4 * 60 / oldBpm)
  assert.equal(engine._gapBarCount, 1)
  assert.equal(engine._inGap, true)
  assert.equal(engine._playbackSubdivision(), 4)
  assert.equal(engine.subdivision, 3)
  assert.equal(engine.bpm, 110)
  bar(engine)
  bar(engine)
  assert.equal(engine._inGap, false)
  assert.equal(engine._playbackSubdivision(), engine.subdivision)
})

test('saved patterns round-trip while legacy and invalid patterns fall back to silence', () => {
  let stored
  const original = globalThis.localStorage
  globalThis.localStorage = { setItem: (_, value) => { stored = value }, getItem: () => stored }
  try {
    saveSettings({ gapEnabled: true, gapClickBars: 3, gapSilentBars: 5, gapPattern: 'fourth' })
    const restored = restoreEngineSettings(new AudioEngine(), loadSettings())
    assert.equal(restored.getState().gapPattern, 'fourth')
    assert.equal(restored.gapSilentBars, 5)
    for (const gapPattern of [undefined, 'unknown', 'all', null]) {
      const engine = restoreEngineSettings(new AudioEngine(), { gapEnabled: true, gapPattern })
      assert.equal(engine.gapPattern, 'silence')
    }
  } finally { globalThis.localStorage = original }
})


test('gap clicks use the regular beat sound and match its accent gain', () => {
  for (const pattern of ['offbeat', 'second', 'fourth', 'triplet-second', 'triplet-third']) {
    const { engine, sounds } = instrument(pattern)
    engine.setSubdivisionAccent(0, 'ACCENT')
    engine.setSubdivisionAccent(1, 'ON')
    engine.setSubdivisionAccent(2, 'ACCENT')
    engine.setSubdivisionAccent(3, 'ON')
    bar(engine)
    const levels = sounds.map(sound => sound.volume)
    assert.deepEqual(levels, [1, .25, 1, .25])
    sounds.length = 0
    bar(engine)
    assert.deepEqual(sounds.map(sound => sound.volume), levels)
    assert.ok(sounds.every(sound => sound.buffer === 'beat'))
  }
})

test('switching from straight to triplet gaps preserves the phase and exact bar timing', () => {
  const { engine, sounds } = instrument('offbeat')
  engine.setGapTraining(true, 1, 4, 'offbeat')
  bar(engine)
  engine.isPlaying = true
  for (const [pattern, divisions, offset] of [['triplet-second', 3, 1 / 3], ['triplet-third', 3, 2 / 3], ['fourth', 4, .75]]) {
    const before = engine._playbackSubdivision()
    engine.setGapTraining(true, 1, 4, pattern)
    assert.equal(engine._playbackSubdivision(), before)
    bar(engine)
    assert.equal(engine._playbackSubdivision(), divisions)
    sounds.length = 0
    const time = engine._nextNoteTime
    // Schedule one denominator note without crossing the next bar boundary.
    for (let tick = 0; tick < divisions; tick++) {
      engine._scheduleNote(engine._nextNoteTime)
      engine._advanceBeat()
    }
    near(engine._nextNoteTime - time, .5)
    assert.equal(sounds.length, 1)
    near(sounds[0].time - time, .5 * offset)
  }
})
