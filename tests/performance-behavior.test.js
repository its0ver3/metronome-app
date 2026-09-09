import test from 'node:test'
import assert from 'node:assert/strict'
import SoundBank from '../src/audio/SoundBank.js'
import BrowserAudioEngine from '../src/audio/BrowserAudioEngine.js'
import AudioEngine from '../src/audio/AudioEngine.js'
import AudioRenderTimeline from '../src/audio/AudioRenderTimeline.js'
import PlaybackVisualStore from '../src/audio/PlaybackVisualStore.js'
import { serializeSoundBank } from '../src/audio/workletProtocol.js'

function context() {
  return { state: 'running', currentTime: 0, sampleRate: 48000,
    createBuffer(numberOfChannels, length, sampleRate) {
      const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
      return { numberOfChannels, length, sampleRate, getChannelData: c => channels[c] }
    },
    createBufferSource() { return { connect() {}, start() {}, stop() {} } },
  }
}
function deferred() {
  let resolve, reject
  const promise = new Promise((a, b) => { resolve = a; reject = b })
  return { promise, resolve, reject }
}
async function fixture(t) {
  const engine = new BrowserAudioEngine(), messages = []
  engine.ctx = context()
  engine._gainNode = { gain: {} }
  engine.soundBank = new SoundBank(engine.ctx)
  await engine.soundBank.init()
  engine.soundBank._fetchBuffer = async path => Object.assign(engine.ctx.createBuffer(1, 2, 48000), { path })
  engine._preparePlayback = async () => {
    engine._workletNode = { port: { postMessage: m => messages.push(structuredClone(m)), close() {} }, disconnect() {} }
    engine.timingBackend = 'audio-worklet'
  }
  t.after(() => engine.stop())
  return { engine, messages }
}

test('4/4 voice readiness loads only four counts, deduplicates requests, and expands safely', async () => {
  const ctx = context(), bank = new SoundBank(ctx), requests = []
  bank._fetchBuffer = async path => { requests.push(path); return { path } }
  await Promise.all([bank.prepareSound(8, { count: 4 }), bank.prepareSound(8, { count: 4 })])
  assert.equal(requests.length, 26)
  for (const bpm of [80, 120, 170, 220, 300, 800]) {
    assert.match(bank.getBuffer(8, { beatNumber: 4, bpm }).path, /4.wav$/)
    assert.match(bank.getSubdivisionBuffer(8, { spokenAnd: true, bpm }).path, /and.wav$/)
  }
  await bank.prepareSound(8, { count: 6 })
  assert.equal(requests.length, 36)
  await bank.prepareSound(8, { count: 6 })
  assert.equal(requests.length, 36)
  assert.match(bank.getBuffer(8, { beatNumber: 6, bpm: 300 }).path, /max-6.wav$/)
})

test('partial voice failure retries only failed clips and retains successful decoding', async () => {
  const bank = new SoundBank(context()), requests = []
  let fail = true
  bank._fetchBuffer = async path => {
    requests.push(path)
    if (fail && path.endsWith('/fast-1.wav')) throw new Error('offline')
    return { path }
  }
  await assert.rejects(bank.prepareSound(8, { count: 1, includeAnd: false }))
  fail = false
  await bank.prepareSound(8, { count: 1, includeAnd: false })
  assert.equal(requests.length, 7)
  assert.equal(bank.entries[8].voiceBuffers.size, 5)
})

test('a shared poly voice also loads the larger primary count-in', async t => {
  const { engine } = await fixture(t), prepared = []
  engine.setPolyrhythmMode(true)
  engine.setPolyRhythm1(16)
  engine.setPolyRhythm2(3)
  engine.setPolySoundIndex2(8)
  engine.setSessionSettings({ countInBars: 1 })
  const prepare = engine.soundBank.prepareSound.bind(engine.soundBank)
  engine.soundBank.prepareSound = (index, options) => { prepared.push({ index, options }); return prepare(index, options) }
  await engine.start()
  assert.equal(prepared.find(p => p.index === 8).options.count, 16)
  assert.match(engine.soundBank.getBuffer(8, { beatNumber: 16, bpm: 300 }).path, /max-16.wav$/)
})

test('a second transport tap cancels loading and never starts the retired request', async t => {
  const { engine, messages } = await fixture(t), gate = deferred()
  engine.soundBank.prepareSound = () => gate.promise
  const pending = engine.start()
  assert.equal(engine.loadState.starting, true)
  engine.toggle()
  gate.resolve()
  await pending
  assert.equal(engine.isPlaying, false)
  assert.equal(engine.loadState.starting, false)
  assert.equal(messages.filter(m => m.type === 'start').length, 0)
})

test('failed startup reports a retryable error and a retry clears it', async t => {
  const { engine } = await fixture(t)
  const prepare = engine.soundBank.prepareSound.bind(engine.soundBank)
  engine.soundBank.prepareSound = async () => { throw new Error('offline') }
  await engine.start()
  assert.equal(engine.isPlaying, false)
  assert.equal(engine.loadState.starting, false)
  assert.match(engine.loadState.error, /retry/)
  engine.soundBank.prepareSound = prepare
  await engine.start()
  assert.equal(engine.isPlaying, true)
  assert.equal(engine.loadState.error, null)
})

test('live sound changes are latest-wins and deliver PCM before the command', async t => {
  const { engine, messages } = await fixture(t), gate = deferred()
  await engine.start()
  const fetch = engine.soundBank._fetchBuffer
  engine.soundBank._fetchBuffer = async path => { await gate.promise; return fetch(path) }
  const slow = engine.setSound(8)
  assert.equal(engine.soundIndex, 0, 'old sound remains until the new one is ready')
  await engine.setSound(2)
  gate.resolve()
  await slow
  assert.equal(engine.soundIndex, 2)
  assert.equal(engine.loadState.soundLoading, false)
  const updates = messages.filter(m => m.type !== 'start')
  assert.deepEqual(updates.map(m => m.type), ['bank', 'command'])
  assert.equal(updates[0].bank.filter(Boolean).length, 1)
  assert.equal(updates[1].args[0], 2)
  messages.length = 0
  await engine.setSound(2)
  assert.deepEqual(messages.map(m => m.type), ['command'], 'warm switch transfers no PCM')
})

test('new renderer excludes previously loaded inactive voice banks', async t => {
  const { engine, messages } = await fixture(t)
  await engine.soundBank.prepareSound(8)
  await engine.soundBank.prepareSound(7)
  await engine.start()
  assert.deepEqual(messages[0].bank.map((entry, i) => entry ? i : null).filter(i => i !== null), [0])
})

test('voice deltas merge without detaching or resending previously loaded PCM', async () => {
  const ctx = context(), bank = new SoundBank(ctx), known = new Map()
  bank._fetchBuffer = async () => ctx.createBuffer(1, 4, 48000)
  await bank.prepareSound(8, { count: 4 })
  const first = serializeSoundBank(bank, { indexes: [0, 8], known })
  const renderer = new AudioRenderTimeline(48000)
  renderer.setBank(structuredClone(first))
  await bank.prepareSound(8, { count: 6 })
  const next = serializeSoundBank(bank, { indexes: [8], known })
  assert.equal(next[8].voiceBuffers.length, 10)
  assert.equal(next[8].subdivision, undefined)
  renderer.setBank(structuredClone(next))
  assert.equal(renderer.soundBank.entries[8].voiceBuffers.size, 35)
  assert.equal(renderer.soundBank.getBuffer(8, { beatNumber: 1 }).length, 4)
  assert.equal(renderer.soundBank.getBuffer(8, { beatNumber: 6 }).length, 4)
  assert.equal(bank.entries[8].voiceBuffers.get('1').getChannelData(0).byteLength, 16)
})

test('an obsolete slow preview cannot play after a newer selection', async t => {
  const { engine } = await fixture(t), gate = deferred(), played = []
  const fetch = engine.soundBank._fetchBuffer
  engine.soundBank._fetchBuffer = async path => { await gate.promise; return fetch(path) }
  engine.ctx.createBufferSource = () => ({ connect() {}, start() { played.push(this.buffer) }, stop() {} })
  const old = engine.preview(8)
  await engine.preview(2)
  gate.resolve()
  await old
  assert.equal(played.length, 1)
  assert.equal(played[0], engine.soundBank.getBuffer(2))
})

test('visual subscriptions suppress duplicate beats and disabled flash work', () => {
  const store = new PlaybackVisualStore()
  let beats = 0, flashes = 0
  store.subscribeBeat(() => beats++)
  store.present({ beat: 0, subdivision: 0, time: 1, downbeat: true })
  assert.equal(store.getPulse(), null)
  store.present({ beat: 0, subdivision: 0, time: 1, downbeat: true })
  assert.equal(beats, 1)
  const unsubscribe = store.subscribeFlash(() => flashes++)
  store.present({ beat: 0, subdivision: 1, time: 1.1 })
  assert.equal(beats, 2)
  assert.equal(flashes, 1)
  store.present({ beat: 1, subdivision: 0, time: 1.2, visualLate: true })
  assert.equal(store.getBeat().currentBeat, -1)
  assert.equal(flashes, 1)
  unsubscribe()
  store.clear()
  assert.deepEqual(store.getBeat(), { currentBeat: -1, currentSubdivision: -1 })
})

test('audio blocks publish status only for meaningful changes while minute cutoffs stay exact', () => {
  const ctx = context(), buffer = ctx.createBuffer(1, 2, 48000)
  const bank = serializeSoundBank({ entries: [{ id: 'click', kind: 'synth', main: [buffer], accent: [buffer], soft: [buffer] }] })
  for (const minutes of [false, true]) {
    const source = new AudioEngine(), events = []
    if (minutes) source.setSessionSettings({ mode: 'minutes', minutes: 1 })
    const engine = new AudioRenderTimeline(48000, event => events.push(event))
    engine.begin(source.getState(), bank, .05)
    let reads = 0
    const getState = engine.getSessionState.bind(engine)
    engine.getSessionState = () => { reads++; return getState() }
    const output = [new Float32Array(128)]
    for (let frame = 0; frame < (minutes ? 60.1 : 10) * 48000; frame += 128) {
      output[0].fill(0)
      engine.render(frame, output)
    }
    assert.ok(reads < (minutes ? 100 : 10), `unexpected status allocation: ${reads}`)
    if (minutes) {
      assert.equal(engine.isPlaying, false)
      assert.equal(engine._sessionEndTime, 60.05)
      assert.equal(engine.getSessionState().remainingSeconds, 0)
      assert.ok(events.some(e => e.type === 'session' && e.value.remainingSeconds === 59))
    }
  }
})
