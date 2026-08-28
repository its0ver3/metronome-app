import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TAP_TEMPO_IDLE_RESET_MS,
  registerTempoTap,
} from '../src/components/metronome/tapTempo.js'

function tapSequence(times) {
  let taps = []
  return times.map((time) => {
    const result = registerTempoTap(taps, time)
    taps = result.taps
    return result
  })
}

test('tap tempo waits for four taps before selecting a BPM', () => {
  const results = tapSequence([0, 500, 1000, 1500])

  assert.deepEqual(results.map(({ bpm }) => bpm), [null, null, null, 120])
})

test('tap tempo refines an active session using no more than five taps', () => {
  const results = tapSequence([0, 500, 1000, 1500, 2000, 2500])

  assert.equal(results[4].bpm, 120)
  assert.equal(results[5].bpm, 120)
  assert.equal(results[5].taps.length, 5)
  assert.deepEqual(results[5].taps, [500, 1000, 1500, 2000, 2500])
})

test('five seconds without input starts a fresh four-tap session', () => {
  assert.equal(TAP_TEMPO_IDLE_RESET_MS, 5000)

  const results = tapSequence([0, 500, 1000, 1500, 6500, 7000, 7500, 8000])

  assert.equal(results[3].bpm, 120)
  assert.deepEqual(results.slice(4).map(({ bpm }) => bpm), [null, null, null, 120])
  assert.deepEqual(results[4].taps, [6500])
})
