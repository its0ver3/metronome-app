import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import { getSoundIndexById } from '../src/audio/constants.js'
import { normalizeSessionSettings, formatSessionTime } from '../src/audio/sessionSettings.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'
import { saveSettings, loadSettings } from '../src/storage/settingsStorage.js'

const female = getSoundIndexById('female-count')
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`)

function instrument(t) {
  const engine = new AudioEngine()
  const notes = [], prepared = [], notifications = [], events = []
  engine.ctx = {
    state: 'running', currentTime: 0,
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, stop(time) { this.stopTime = time },
        start(time) { this.time = time; notes.push(this) } }
      return source
    },
    createGain: () => ({ gain: {}, connect() {}, disconnect() {} }),
  }
  engine._ensureContext = () => true
  engine._unlockAudio = async () => true
  engine.init = async () => true
  engine.soundBank = {
    prepareSound: async sound => { prepared.push(sound) },
    ...Object.fromEntries(['getBuffer', 'getDownbeatBuffer', 'getSubdivisionBuffer'].map(kind =>
      [kind, (sound, options) => ({ kind, sound, ...options })])),
  }
  engine._notifyAtAudioTime = (time, callback) => notifications.push({ time, callback })
  engine.onBeat(event => events.push(event))
  const advance = time => {
    while (engine.ctx.currentTime + .005 < time) {
      engine.ctx.currentTime += .005
      engine._scheduler()
      notifications.sort((a, b) => a.time - b.time)
      while (notifications[0]?.time <= engine.ctx.currentTime + 1e-8) {
        const event = notifications.shift()
        if (engine.isPlaying) event.callback()
      }
    }
    engine.ctx.currentTime = time
    engine._scheduler()
  }
  t.after(() => engine.stop())
  return { engine, notes, prepared, events, advance }
}

for (const countInBars of [0, 1, 2]) {
  test(`${countInBars} count-in bars precede exactly two click bars without advancing trainers`, async t => {
    const { engine, notes, prepared, events, advance } = instrument(t)
    engine.setBpm(120)
    engine.setSubdivision(3)
    engine.setGapTraining(true, 1, 1)
    engine.setTempoTrainer(true, 120, 140, 10, 1)
    engine.setSubdivisionTrainer(true, [{ subdivision: 3, bars: 1 }, { subdivision: 2, bars: 1 }])
    engine.setSessionSettings({ countInBars, mode: 'bars', bars: 2 })
    await engine.start()
    clearInterval(engine._timerId)
    advance(countInBars * 2 + .051)
    assert.equal(notes.filter(n => n.buffer.sound === female).length, countInBars * 4)
    assert.equal(prepared.includes(female), countInBars > 0)
    const clicks = notes.filter(n => n.buffer.sound !== female)
    near(clicks[0].time, countInBars * 2 + .05)
    assert.equal(engine._tempoBarCount, 0)
    assert.equal(engine.bpm, 120)
    assert.equal(engine._subdivTrainerStageIndex, 0)
    assert.equal(engine.getSessionState().remainingBars, 2)
    // The second bar is silent and faster; it still counts toward the limit.
    advance(countInBars * 2 + 4.1)
    assert.equal(engine.isPlaying, false)
    assert.equal(engine.getSessionState().phase, 'complete')
    assert.equal(engine.getSessionState().remainingBars, 0)
    const clickEvents = events.filter(event => !event.countIn)
    assert.ok(clickEvents.some(event => event.inGap))
    assert.ok(clickEvents.every(event => event.bar <= 2))
  })
}

test('compound and unequal meters speak group counts with the correct whole-bar duration', async t => {
  for (const [meter, expected] of [
    [{ numerator: 6, denominator: 8 }, [0, .75]],
    [{ numerator: 7, denominator: 8, groups: [2, 2, 3] }, [0, .5, 1]],
  ]) {
    const { engine, notes, advance } = instrument(t)
    engine.setMeter(meter)
    engine.setSessionSettings({ countInBars: 1 })
    await engine.start()
    clearInterval(engine._timerId)
    advance(2)
    const voice = notes.filter(n => n.buffer.sound === female)
    assert.deepEqual(voice.map(n => n.buffer.beatNumber), expected.map((_, i) => i + 1))
    voice.forEach((note, i) => near(note.time, .05 + expected[i]))
    near(notes.find(n => n.buffer.sound !== female).time, .05 + meter.numerator * .25)
    assert.ok(voice.every(n => n.stopTime <= .05 + meter.numerator * .25 + 1e-8))
  }
})

test('polyrhythm speaks the primary rhythm then stops after full shared cycles, without extending the deadline', async t => {
  const { engine, notes, advance } = instrument(t)
  engine.setPolyrhythmMode(true)
  engine.setSessionSettings({ countInBars: 1, mode: 'bars', bars: 2 })
  await engine.start()
  clearInterval(engine._timerId)
  advance(4.49)
  const voice = notes.filter(n => n.buffer.sound === female)
  assert.deepEqual(voice.map(n => n.buffer.beatNumber), [1, 2, 3])
  near(engine._sessionEndTime, 4.55)
  advance(4.54)
  near(engine._sessionEndTime, 4.55)
  assert.equal(engine.isPlaying, true)
  assert.equal(notes.filter(n => n.buffer.sound === 0).length, 6)
  assert.equal(notes.filter(n => n.buffer.sound === 1).length, 8)
  advance(4.56)
  assert.equal(engine.isPlaying, false)
})

test('minute duration excludes count-in, survives tempo changes, and clips sound at the exact deadline', async t => {
  const { engine, notes, advance } = instrument(t)
  engine.setSessionSettings({ countInBars: 2, mode: 'minutes', minutes: 1 })
  await engine.start()
  clearInterval(engine._timerId)
  advance(3.8)
  assert.equal(engine.getSessionState().phase, 'count-in')
  assert.equal(engine.getSessionState().remainingSeconds, 60)
  near(engine._sessionEndTime, 64.05)
  advance(24.05)
  assert.equal(engine.getSessionState().remainingSeconds, 40)
  engine.setBpm(73)
  advance(64.04)
  assert.equal(engine.isPlaying, true)
  const clicks = notes.filter(n => n.buffer.sound !== female)
  assert.ok(clicks.every(n => n.time < 64.05 && n.stopTime === 64.05))
  advance(64.06)
  assert.equal(engine.isPlaying, false)
  assert.equal(engine.getSessionState().remainingSeconds, 0)
})

test('stopping a count-in cancels its audio and restarting begins with one again', async t => {
  const { engine, notes, advance } = instrument(t)
  engine.setSessionSettings({ countInBars: 2, mode: 'bars', bars: 10 })
  await engine.start()
  clearInterval(engine._timerId)
  advance(.7)
  engine.stop()
  assert.equal(engine._sources.size, 0)
  assert.ok(notes.every(n => n.stopTime === undefined))
  assert.equal(engine.getSessionState().phase, 'idle')
  notes.length = 0
  await engine.start()
  clearInterval(engine._timerId)
  advance(.8)
  assert.equal(notes[0].buffer.beatNumber, 1)
  assert.equal(engine.getSessionState().remainingBars, 10)
})

test('bar limits work for dense one-beat bars and muted downbeats', async t => {
  const { engine, notes, advance } = instrument(t)
  engine.setBeatsPerBar(1)
  engine.setBpm(300)
  engine.setSubdivision(13)
  engine.subdivisionAccents.fill('OFF')
  engine.setSessionSettings({ mode: 'bars', bars: 100 })
  await engine.start()
  clearInterval(engine._timerId)
  advance(20.04)
  assert.equal(engine.isPlaying, true)
  near(engine._sessionEndTime, 20.05)
  advance(20.06)
  assert.equal(engine.isPlaying, false)
  assert.equal(notes.length, 0)
})

test('legacy defaults, invalid settings, persistence, and formatting stay predictable', () => {
  assert.deepEqual(new AudioEngine().sessionSettings, { countInBars: 0, mode: 'off', minutes: 5, bars: 50 })
  assert.deepEqual(normalizeSessionSettings({ countInBars: 8, mode: 'bad', minutes: -1, bars: Infinity }),
    { countInBars: 2, mode: 'off', minutes: 1, bars: 50 })
  const sessionSettings = { countInBars: 2, mode: 'bars', minutes: 5, bars: 100 }
  let stored
  globalThis.localStorage = { setItem: (_, value) => { stored = value }, getItem: () => stored }
  try {
    saveSettings({ sessionSettings })
    const engine = restoreEngineSettings(new AudioEngine(), loadSettings())
    assert.deepEqual(engine.sessionSettings, sessionSettings)
  } finally { delete globalThis.localStorage }
  assert.equal(formatSessionTime(300), '5:00')
  assert.equal(formatSessionTime(59.2), '1:00')
  assert.equal(formatSessionTime(-1), '0:00')
})
