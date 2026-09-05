import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  TAP_TEMPO_IDLE_RESET_MS,
  registerTempoTap,
} from '../src/components/metronome/tapTempo.js'

const tapButtonSource = await readFile(
  new URL('../src/components/metronome/TapTempoButton.jsx', import.meta.url),
  'utf8',
)
const metronomeScreenSource = await readFile(
  new URL('../src/components/metronome/MetronomeScreen.jsx', import.meta.url),
  'utf8',
)
const cssSource = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')

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

test('two seconds without input starts a fresh four-tap session', () => {
  assert.equal(TAP_TEMPO_IDLE_RESET_MS, 2000)

  const results = tapSequence([0, 500, 1000, 1500, 3500, 4000, 4500, 5000])

  assert.equal(results[3].bpm, 120)
  assert.deepEqual(results.slice(4).map(({ bpm }) => bpm), [null, null, null, 120])
  assert.deepEqual(results[4].taps, [3500])
})

test('tap tempo uses one icon-only control without losing its accessible name', () => {
  assert.match(tapButtonSource, /aria-label=\{accessibleLabel\}/)
  assert.match(tapButtonSource, /HandTapIcon/)
  assert.match(tapButtonSource, /size=\{34\} weight="regular"/)
  assert.match(tapButtonSource, /className="pulse-tap-glyph"/)
  assert.doesNotMatch(tapButtonSource, />\s*TAP\s*</)
  assert.doesNotMatch(metronomeScreenSource, /<span>Tap tempo<\/span>/)
})

test('tap tempo visually charges through four pulses and clears with the session', () => {
  assert.match(tapButtonSource, /data-tap-stage=\{tapStage\}/)
  assert.match(tapButtonSource, /className="pulse-tap-charge"/)
  assert.match(tapButtonSource, /className="pulse-tap-fill"/)
  assert.match(tapButtonSource, /className="pulse-tap-wave"/)
  assert.match(tapButtonSource, /Math\.min\(result\.taps\.length, TAP_TEMPO_MIN_TAPS\)/)
  assert.match(tapButtonSource, /setTapStage\(0\)/)
  assert.match(cssSource, /\.pulse-tap-button\[data-tap-stage="1"\]/)
  assert.match(cssSource, /--tap-charge-ring:/)
  assert.match(tapButtonSource, /--tap-reset-duration/)
  assert.match(cssSource, /animation: pulse-tap-decay var\(--tap-reset-duration, 2000ms\) linear both/)
  assert.doesNotMatch(tapButtonSource, />\s*[1-4]\s*\/\s*4\s*</)
})
