import test from 'node:test'
import assert from 'node:assert/strict'
import BrowserAudioEngine from '../src/audio/BrowserAudioEngine.js'

function fixture(t, { worklet = false } = {}) {
  const originals = new Map()
  const replace = (name, value) => {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
  }
  let now = 0, nextTimer = 0
  const timers = new Map(), contexts = [], nodes = [], notes = [], moduleContexts = []
  replace('performance', { now: () => now })
  replace('document', { hidden: false })
  replace('setInterval', callback => { timers.set(++nextTimer, callback); return nextTimer })
  replace('clearInterval', id => timers.delete(id))
  class Context {
    state = 'running'
    currentTime = 0
    sampleRate = 48000
    destination = {}
    constructor() { contexts.push(this) }
    createGain() { return { gain: {}, connect() {}, disconnect() {} } }
    createBuffer(channels, length, sampleRate) {
      const data = new Float32Array(length)
      return { numberOfChannels: channels, length, sampleRate, getChannelData: () => data }
    }
    createBufferSource() {
      return { connect() {}, disconnect() {}, stop() {}, start: time => notes.push({ context: this, time }) }
    }
    async resume() { this.state = 'running'; this.onstatechange?.() }
    async close() { this.state = 'closed'; this.onstatechange?.() }
    changeState(state) { this.state = state; this.onstatechange?.() }
  }
  replace('window', { AudioContext: Context })
  if (worklet) {
    Context.prototype.audioWorklet = {}
    replace('AudioWorkletNode', class {
      messages = []
      port = { postMessage: message => this.messages.push(message), close() {} }
      constructor(context) { this.context = context; nodes.push(this) }
      connect() {}
      disconnect() { this.disconnected = true }
    })
  }
  const engine = new BrowserAudioEngine()
  // The bundler-only module import is covered by the production build. Keep
  // real engine startup, sound synthesis, scheduling, and resource lifetimes.
  if (worklet) engine._loadWorkletModule = async context => { moduleContexts.push(context) }
  t.after(() => {
    engine.stop()
    for (const [name, original] of originals) {
      if (original) Object.defineProperty(globalThis, name, original)
      else delete globalThis[name]
    }
  })
  return { engine, contexts, nodes, notes, timers, moduleContexts,
    tick(ms = 500, audioAdvance = 0) {
      now += ms
      if (engine.ctx) engine.ctx.currentTime += audioAdvance
      for (const callback of [...timers.values()]) callback()
    },
  }
}

for (const worklet of [false, true]) {
  test(`${worklet ? 'worklet' : 'fallback'} stops a frozen running clock and Play rebuilds audio`, async t => {
    const f = fixture(t, { worklet }), states = []
    f.engine.onStateChange(value => states.push(value))
    f.engine.setBpm(137)
    f.engine.setMeter({ numerator: 7, denominator: 8, groups: [2, 2, 3] })
    await f.engine.start()
    const oldContext = f.engine.ctx, oldBank = f.engine.soundBank
    for (let i = 0; i < 4; i++) f.tick()
    assert.equal(f.engine.isPlaying, false, 'the UI must leave its frozen playing state')
    assert.deepEqual(states, [true, false])
    assert.equal(f.timers.size, 0)
    await f.engine.start()
    assert.notEqual(f.engine.ctx, oldContext, 'Play must replace the unusable context')
    assert.equal(oldContext.state, 'closed')
    assert.notEqual(f.engine.soundBank, oldBank)
    assert.equal(f.engine.soundBank.ctx, f.engine.ctx)
    assert.equal(f.engine.isPlaying, true)
    assert.equal(f.engine.bpm, 137)
    assert.deepEqual(f.engine.meter.groups, [2, 2, 3])
    if (worklet) {
      assert.deepEqual(f.moduleContexts, f.contexts, 'each context must register its own module')
      assert.equal(f.engine.timingBackend, 'audio-worklet')
      assert.equal(f.nodes[1].context, f.engine.ctx)
      assert.equal(f.nodes[1].messages[0].type, 'start')
    } else assert.ok(f.notes.some(note => note.context === f.engine.ctx))
  })
}

test('silent bars and slow tempos do not count as a frozen audio clock', async t => {
  const f = fixture(t)
  f.engine.setBpm(20)
  f.engine.setGapTraining(true, 1, 16)
  f.engine.setSubdivisionAccent(0, 'OFF')
  await f.engine.start()
  for (let i = 0; i < 40; i++) f.tick(500, .5)
  assert.equal(f.engine.isPlaying, true)
  assert.equal(f.contexts.length, 1)
})

test('background time and delayed main-thread callbacks get a fresh observation window', async t => {
  const f = fixture(t)
  await f.engine.start()
  globalThis.document.hidden = true
  for (let i = 0; i < 8; i++) f.tick()
  assert.equal(f.engine.isPlaying, true)
  globalThis.document.hidden = false
  f.tick(10000)
  assert.equal(f.engine.isPlaying, true)
  f.tick(500, .1)
  assert.equal(f.engine.isPlaying, true)
  assert.equal(f.contexts.length, 1)
})

for (const state of ['suspended', 'interrupted', 'closed']) {
  test(`${state} during playback stops the UI and allows a new Start`, async t => {
    const f = fixture(t, { worklet: true })
    await f.engine.start()
    f.engine.ctx.changeState(state)
    assert.equal(f.engine.isPlaying, false)
    assert.equal(f.timers.size, 0)
    await f.engine.start()
    assert.equal(f.engine.isPlaying, true)
    assert.equal(f.engine.ctx.state, 'running')
  })
}

test('a meter edit while a start is loading cancels it before allocating a renderer', async t => {
  const f = fixture(t, { worklet: true })
  await f.engine.init()
  let finishLoading
  f.engine.soundBank.prepareSound = () => new Promise(resolve => { finishLoading = resolve })
  const pending = f.engine.start()
  while (!finishLoading) await Promise.resolve()
  f.engine.setMeter({ numerator: 6, denominator: 8 })
  finishLoading()
  await pending
  assert.equal(f.engine.isPlaying, false)
  assert.equal(f.nodes.length, 0)
  assert.equal(f.timers.size, 0)
})

test('a context suspended during renderer preparation cannot start silently', async t => {
  const f = fixture(t, { worklet: true })
  await f.engine.init()
  const prepare = f.engine._preparePlayback.bind(f.engine)
  f.engine._preparePlayback = async generation => {
    await prepare(generation)
    f.engine.ctx.changeState('suspended')
    f.engine.ctx.resume = async () => { throw new Error('NotAllowedError') }
  }
  await f.engine.start()
  assert.equal(f.engine.isPlaying, false)
  assert.equal(f.engine._workletNode, null)
  assert.equal(f.timers.size, 0)
})

test('a late error from the renderer stopped by a meter edit cannot stop its replacement', async t => {
  const f = fixture(t, { worklet: true })
  await f.engine.start()
  const reportOldError = f.nodes[0].onprocessorerror
  f.engine.setMeter({ numerator: 3, denominator: 4 })
  await f.engine.start()
  reportOldError()
  assert.equal(f.engine.isPlaying, true)
  assert.equal(f.engine._workletNode, f.nodes[1])
  f.nodes[1].onprocessorerror()
  assert.equal(f.engine.isPlaying, false, 'an error from the active renderer must still stop playback')
})

test('repeated meter edits and starts reuse healthy audio and clear retired renderers', async t => {
  const f = fixture(t, { worklet: true })
  for (const numerator of [4, 3, 2, 5, 6, 7, 9, 12, 4]) {
    f.engine.setMeter({ numerator, denominator: numerator > 4 ? 8 : 4 })
    assert.equal(f.engine.isPlaying, false)
    assert.equal(f.timers.size, 0)
    await f.engine.start()
    f.tick(500, .5)
    assert.equal(f.engine.isPlaying, true)
    assert.equal(f.nodes.at(-1).messages[0].settings.meter.numerator, numerator)
  }
  assert.equal(f.contexts.length, 1)
  assert.equal(f.moduleContexts.length, 1)
  assert.ok(f.nodes.slice(0, -1).every(node => node.disconnected))
})

test('a recoverable suspension during loading resumes before publishing Play', async t => {
  const f = fixture(t, { worklet: true })
  f.engine._loadWorkletModule = async context => { context.changeState('suspended') }
  const states = []
  f.engine.onStateChange(playing => states.push({ playing, contextState: f.engine.ctx.state }))
  await f.engine.start()
  assert.deepEqual(states, [{ playing: true, contextState: 'running' }])
  assert.equal(f.engine.timingBackend, 'audio-worklet')
})

test('a failed obsolete module load cannot discard a newer renderer', async t => {
  const f = fixture(t, { worklet: true })
  let rejectOldModule
  f.engine._loadWorkletModule = () => new Promise((_, reject) => { rejectOldModule = reject })
  const pending = f.engine.start()
  while (!rejectOldModule) await Promise.resolve()
  f.engine.ctx.changeState('closed')
  f.engine._loadWorkletModule = async () => {}
  await f.engine.start()
  const activeNode = f.engine._workletNode
  rejectOldModule(new Error('The old context closed during module loading'))
  await pending
  assert.equal(f.engine.isPlaying, true)
  assert.equal(f.engine._workletNode, activeNode)
  assert.equal(f.engine.timingBackend, 'audio-worklet')
})
