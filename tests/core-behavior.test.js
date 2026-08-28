import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import SoundBank from '../src/audio/SoundBank.js'
import {
  ACCENT_LEVELS,
  ACCENT_ORDER,
  ACCENT_WEDGES,
  buildDefaultPolyAccents,
  buildDefaultSubdivisionAccents,
  clampBpm,
  cycleAccentLevel,
  normalizeAccentLevel,
} from '../src/audio/constants.js'
import { restoreEngineSettings } from '../src/audio/engineSettings.js'
import {
  getOrbitAccentLevel,
  getStandardOrbitAccentIndex,
} from '../src/components/metronome/orbitAccents.js'
import {
  getParallelCutPoint,
  parallelSegmentPath,
} from '../src/components/metronome/orbitGeometry.js'

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
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['ACCENT', 'OFF', 'ON'])
})

test('accent patterns use only Off, On, and Accent with Accent as the loudest state', () => {
  assert.deepEqual(ACCENT_ORDER, ['OFF', 'ON', 'ACCENT'])
  assert.deepEqual(Object.keys(ACCENT_LEVELS), ['OFF', 'ON', 'ACCENT'])
  assert.equal(ACCENT_LEVELS.ACCENT.volume, 1)
  assert.ok(ACCENT_LEVELS.ACCENT.volume > ACCENT_LEVELS.ON.volume)
  assert.deepEqual(ACCENT_WEDGES, { OFF: 0, ON: 1, ACCENT: 2 })
  assert.equal(cycleAccentLevel('OFF'), 'ON')
  assert.equal(cycleAccentLevel('ON'), 'ACCENT')
  assert.equal(cycleAccentLevel('ACCENT'), 'OFF')
  assert.equal(normalizeAccentLevel('LOUD'), 'ACCENT')
  assert.deepEqual(buildDefaultSubdivisionAccents(2, 2), ['ACCENT', 'ON', 'ACCENT', 'ON'])
  assert.deepEqual(buildDefaultPolyAccents(3), ['ACCENT', 'ON', 'ON'])
})

test('standard orbit segments address the main click of each beat', () => {
  assert.deepEqual(
    Array.from({ length: 4 }, (_, beat) => getStandardOrbitAccentIndex(beat, 3)),
    [0, 3, 6, 9],
  )
  assert.equal(getOrbitAccentLevel(['OFF', 'ON', 'ACCENT'], 0), 'OFF')
  assert.equal(getOrbitAccentLevel(['OFF', 'ON', 'ACCENT'], 1), 'ON')
  assert.equal(getOrbitAccentLevel(['OFF', 'ON', 'ACCENT'], 2), 'ACCENT')
  assert.equal(getOrbitAccentLevel([], 0), 'ON')
})

test('standard orbit accents preserve subdivision dynamics while Off mutes the whole beat', () => {
  const engine = new AudioEngine()
  engine.subdivision = 3
  engine.beatsPerBar = 2
  engine.subdivisionAccents = ['ON', 'OFF', 'ACCENT', 'OFF', 'ON', 'ACCENT']

  assert.equal(engine.cycleBeatAccent(0), 'ACCENT')
  assert.deepEqual(engine.subdivisionAccents, [
    'ACCENT', 'OFF', 'ACCENT',
    'OFF', 'ON', 'ACCENT',
  ])

  assert.equal(engine.cycleBeatAccent(0), 'OFF')
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['OFF', 'OFF', 'OFF'])

  assert.equal(engine.cycleBeatAccent(0), 'ON')
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['ON', 'ON', 'ON'])

  assert.equal(engine.cycleBeatAccent(0), 'ACCENT')
  assert.deepEqual(engine.subdivisionAccents.slice(0, 3), ['ACCENT', 'ON', 'ON'])
})

test('opposing orbit segment cuts are parallel at every break', () => {
  const gapDistance = 1.4

  for (const angle of [0, 90, 180, 270]) {
    const beforeOuter = getParallelCutPoint(angle, 48, -gapDistance)
    const beforeInner = getParallelCutPoint(angle, 37.5, -gapDistance)
    const afterOuter = getParallelCutPoint(angle, 48, gapDistance)
    const afterInner = getParallelCutPoint(angle, 37.5, gapDistance)
    const beforeDirection = {
      x: beforeOuter.x - beforeInner.x,
      y: beforeOuter.y - beforeInner.y,
    }
    const afterDirection = {
      x: afterOuter.x - afterInner.x,
      y: afterOuter.y - afterInner.y,
    }
    const crossProduct = beforeDirection.x * afterDirection.y
      - beforeDirection.y * afterDirection.x

    assert.ok(Math.abs(crossProduct) < 1e-9)
  }

  assert.doesNotMatch(parallelSegmentPath(-90, 0, gapDistance, 48, 37.5), /NaN/)
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

test('beat 1 uses the distinct downbeat voice in standard and polyrhythm playback', () => {
  const engine = new AudioEngine()
  const played = []
  const events = []

  engine.soundBank = {
    getBuffer: (index) => `regular-${index}`,
    getSubdivisionBuffer: (index) => `subdivision-${index}`,
    getDownbeatBuffer: (index) => `downbeat-${index}`,
  }
  engine._playSound = (buffer, time, volume) => played.push({ buffer, time, volume })
  engine._notifyAtAudioTime = (_time, callback) => callback()
  engine._onBeat = (event) => events.push(event)

  engine.soundIndex = 2
  engine.subdivisionAccents = ['ACCENT', 'ON', 'ACCENT', 'ON']
  engine._currentBeat = 0
  engine._currentSubdivision = 0
  engine._scheduleNote(1)
  engine._currentBeat = 1
  engine._scheduleNote(2)

  engine.polySoundIndex1 = 3
  engine.polyAccents1 = ['ACCENT', 'ON']
  engine._scheduleNotePoly(3, 1, 0)
  engine._scheduleNotePoly(4, 1, 1)

  assert.deepEqual(played.map(({ buffer }) => buffer), [
    'downbeat-2',
    'regular-2',
    'downbeat-3',
    'regular-3',
  ])
  assert.deepEqual(events.map(({ downbeat }) => downbeat), [true, false, true, false])
})

test('every selectable click sound has its own synthesized downbeat companion', async () => {
  const context = {
    sampleRate: 48000,
    createBuffer: (_channels, length, sampleRate) => {
      const data = new Float32Array(length)
      return {
        length,
        sampleRate,
        getChannelData: () => data,
      }
    },
  }
  const soundBank = new SoundBank(context)

  await soundBank.init()

  assert.equal(soundBank.buffers.length, 8)
  assert.equal(soundBank.downbeatBuffers.length, 8)
  soundBank.buffers.forEach((buffer, index) => {
    assert.notStrictEqual(soundBank.getDownbeatBuffer(index), buffer)
  })
})
