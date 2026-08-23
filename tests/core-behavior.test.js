import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import { clampBpm } from '../src/audio/constants.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'

test('tempo values are constrained to the single 20–300 BPM range', () => {
  assert.equal(clampBpm(19), 20)
  assert.equal(clampBpm(137.6), 138)
  assert.equal(clampBpm(301), 300)
  assert.equal(clampBpm('not-a-tempo'), 120)
})

test('saved settings are applied while the engine is created', () => {
  const engine = restoreEngineSettings(new AudioEngine(), {
    bpm: 137,
    volume: 0.4,
    beatsPerBar: 7,
    subdivision: 3,
    subdivisionAccents: ['LOUD', 'OFF', 'ON'],
    tempoEnabled: false,
  })

  assert.equal(engine.bpm, 137)
  assert.equal(engine.volume, 0.4)
  assert.equal(engine.beatsPerBar, 7)
  assert.equal(engine.subdivision, 3)
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['LOUD', 'OFF', 'ON'])
})

test('restored trainer tempos cannot reintroduce the removed extended range', () => {
  const engine = restoreEngineSettings(new AudioEngine(), {
    bpm: 600,
    tempoEnabled: true,
    tempoStartBpm: 450,
    tempoTargetBpm: 600,
  })

  assert.equal(engine.bpm, 300)
  assert.equal(engine.tempoStartBpm, 300)
  assert.equal(engine.tempoTargetBpm, 300)
})

test('visual notifications wait for audio time and are canceled when stopped', async () => {
  const engine = new AudioEngine()
  engine.ctx = { currentTime: 0 }
  engine.isPlaying = true

  let notificationCount = 0
  engine._notifyAtAudioTime(0.015, () => { notificationCount += 1 })
  assert.equal(notificationCount, 0)
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(notificationCount, 1)

  engine._notifyAtAudioTime(0.04, () => { notificationCount += 1 })
  engine.stop()
  await new Promise((resolve) => setTimeout(resolve, 60))
  assert.equal(notificationCount, 1)
})
