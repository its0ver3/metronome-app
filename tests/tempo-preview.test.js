import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'

function playableEngine(t) {
  const engine = new AudioEngine()
  engine.ctx = { state: 'running', currentTime: 0 }
  engine._ensureContext = () => true
  engine._unlockAudio = async () => true
  engine.init = async () => true
  engine.soundBank = { prepareSound: async () => {} }
  engine._scheduler = () => {}
  t.after(() => engine.stop())
  return engine
}

test('cancelling a stopped tempo preview restores the original BPM and notifies the UI', () => {
  const engine = new AudioEngine()
  const updates = []
  engine.setBpm(137)
  engine.onBpmChange(bpm => updates.push(bpm))
  engine.setTempoTrainer(true, 80, 140, 5, 4)
  assert.equal(engine.bpm, 80)
  // Editing the preview must not overwrite the captured original tempo.
  engine.setTempoTrainer(true, 95, 150, 3, 2)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 137)
  assert.deepEqual(updates, [80, 95, 137])
  assert.equal(engine.tempoStartBpm, 95)
  assert.equal(engine.tempoTargetBpm, 150)
  engine.setTempoTrainer(false)
  assert.deepEqual(updates, [80, 95, 137])
  engine.setBpm(168)
  engine.setTempoTrainer(true)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 168)
})

test('successful playback commits the trainer tempo even after stopping', async t => {
  for (const stopFirst of [false, true]) {
    const engine = playableEngine(t)
    engine.setBpm(137)
    engine.setTempoTrainer(true, 80)
    await engine.start()
    assert.equal(engine.isPlaying, true)
    engine.setBpm(90)
    if (stopFirst) engine.stop()
    engine.setTempoTrainer(false)
    assert.equal(engine.bpm, 90)
  }
})

test('enabling during playback never creates a tempo to restore later', async t => {
  const engine = playableEngine(t)
  engine.setBpm(137)
  await engine.start()
  engine.setTempoTrainer(true, 80)
  assert.equal(engine.bpm, 137)
  assert.equal(engine._tempoPendingActivation, true)
  engine.stop()
  engine.setTempoTrainer(true, 95)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 95)
})

test('failed audio startup does not commit the preview', async t => {
  const engine = playableEngine(t)
  engine._unlockAudio = async () => false
  engine.setBpm(137)
  engine.setTempoTrainer(true, 80)
  await engine.start()
  assert.equal(engine.isPlaying, false)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 137)
})

test('a trainer enabled while paused by Polyrhythm does not overwrite the BPM on disable', () => {
  const engine = new AudioEngine()
  engine.setPolyrhythmMode(true)
  engine.setBpm(137)
  engine.setTempoTrainer(true, 80)
  engine.setBpm(145)
  engine.setTempoTrainer(false)
  assert.equal(engine.bpm, 145)
})
