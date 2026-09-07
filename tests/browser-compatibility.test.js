import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import BrowserAudioEngine from '../src/audio/BrowserAudioEngine.js'

function globalForTest(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
  t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name])
}

test('a browser without AudioWorklet keeps the BufferSource backend', async () => {
  const engine = new BrowserAudioEngine()
  engine.ctx = {}
  await engine._preparePlayback(engine._startGeneration)
  assert.equal(engine.timingBackend, 'buffer-source')
  assert.equal(engine._workletNode, null)
})

test('a rejected worklet module falls back without failing playback preparation', async t => {
  globalForTest(t, 'AudioWorkletNode', class { constructor() { assert.fail('module failed to load') } })
  const engine = new BrowserAudioEngine()
  engine.ctx = { audioWorklet: {} }
  engine._workletModule = Promise.reject(new Error('Module rejected by browser or hosting policy'))
  await engine._preparePlayback(engine._startGeneration)
  assert.equal(engine.timingBackend, 'buffer-source')
  assert.equal(engine._workletNode, null)
})

test('Web Audio uses a prefixed context when only the legacy API is exposed', t => {
  let connected = false
  class PrefixedContext {
    destination = {}
    createGain() { return { gain: { value: 0 }, connect: () => { connected = true } } }
  }
  globalForTest(t, 'window', { webkitAudioContext: PrefixedContext })
  const engine = new AudioEngine()
  assert.equal(engine._ensureContext(), true)
  assert.ok(engine.ctx instanceof PrefixedContext)
  assert.equal(connected, true)
})

test('a denied browser audio resume leaves playback stopped', async () => {
  const engine = new BrowserAudioEngine()
  engine.ctx = { state: 'suspended', resume: async () => { throw new Error('NotAllowedError') } }
  assert.equal(await engine._unlockAudio(), false)
  assert.equal(engine.isPlaying, false)
})
