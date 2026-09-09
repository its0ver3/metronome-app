import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import AudioRenderTimeline from '../src/audio/AudioRenderTimeline.js'
import BrowserAudioEngine from '../src/audio/BrowserAudioEngine.js'
import { MAX_SCHEDULER_STEPS, SCHEDULE_AHEAD_S } from '../src/audio/constants.js'
import { serializeSoundBank } from '../src/audio/workletProtocol.js'

const rate = 48000
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`)
const pcm = { channels: [new Float32Array([1, 0])], length: 2, sampleRate: rate }
const bank = Array.from({ length: 9 }, (_, i) => ({ id: `test-${i}`, kind: 'synth',
  soft: [pcm], main: [pcm], accent: [pcm] }))

function renderer(configure = () => {}) {
  const source = new AudioEngine(), events = [], hits = []
  configure(source)
  const engine = new AudioRenderTimeline(rate, event => events.push(event))
  engine.begin(source.getState(), bank, .05)
  const play = engine._playSound.bind(engine)
  engine._playSound = (buffer, time, volume, stop) => { hits.push({ time, volume }); play(buffer, time, volume, stop) }
  const output = [new Float32Array(128), new Float32Array(128)]
  let frame = 0
  function advance(seconds, onBlock = () => {}) {
    while (frame < seconds * rate) {
      output.forEach(channel => channel.fill(0))
      engine.render(frame, output)
      onBlock(frame, output)
      frame += output[0].length
    }
  }
  return { engine, advance, hits, events }
}

test('audio renderer has less than one sample of phase error after ten minutes at 137 BPM', () => {
  const { advance } = renderer(e => e.setBpm(137))
  const onsets = []
  advance(600.05, (frame, output) => {
    for (let i = 0; i < output[0].length; i++) if (output[0][i] > 0) onsets.push(frame + i)
  })
  const valid = onsets.filter(frame => frame < 600.05 * rate - 1)
  assert.equal(valid.length, 1370)
  valid.forEach((frame, index) => near(frame / rate, .05 + index * 60 / 137, 1 / rate))
})

test('polyrhythm tempo changes preserve the committed cycle and the bar timer deadline', () => {
  const { engine, advance, hits } = renderer(e => {
    e.setPolyrhythmMode(true)
    e.setSessionSettings({ mode: 'bars', bars: 2 })
  })
  advance(.6)
  engine.command('setBpm', [300], 1)
  advance(2.3)
  // First 3:4 cycle remains 1.5 s; second is .6 s.
  const expected = [.05, .55, 1.05, .05, .425, .8, 1.175,
    1.55, 1.75, 1.95, 1.55, 1.7, 1.85, 2.0].sort((a,b) => a-b)
  assert.equal(hits.length, expected.length)
  hits.sort((a,b) => a.time-b.time).forEach((hit, i) => near(hit.time, expected[i]))
  near(engine._sessionEndTime, 2.15)
  assert.equal(engine.isPlaying, false)
  assert.equal(engine.getSessionState().phase, 'complete')
})

test('polyrhythm decrease and repeated edits never change already committed pulses', () => {
  const { engine, advance, hits } = renderer(e => e.setPolyrhythmMode(true))
  advance(.6)
  engine.command('setBpm', [300], 1)
  engine.command('setBpm', [60], 2)
  advance(4.56)
  for (const time of [.8, 1.05, 1.175, 1.55, 2.3, 2.55, 3.05, 3.55, 3.8, 4.55]) {
    assert.ok(hits.some(hit => Math.abs(hit.time-time) < 1e-7), `missing ${time}`)
  }
})

function fallback() {
  const engine = new AudioEngine(), hits = []
  engine.ctx = { currentTime: 0, state: 'running' }
  engine.soundBank = { getBuffer: () => pcm, getDownbeatBuffer: () => pcm, getSubdivisionBuffer: () => pcm }
  engine._playSound = (_, time) => hits.push(time)
  engine._notifyAtAudioTime = () => {}
  return { engine, hits }
}

test('fallback skips overdue clicks while preserving trainer progression and bounded catch-up', () => {
  const { engine, hits } = fallback()
  engine.setSubdivision(4)
  engine.setGapTraining(true, 1, 1)
  engine.setTempoTrainer(true, 120, 140, 10, 1)
  engine._schedulerStandard()
  hits.length = 0
  engine.ctx.currentTime = 2
  engine._schedulerStandard()
  assert.ok(hits.every(time => time >= 2))
  assert.equal(engine._currentBar, 2)
  assert.equal(engine.bpm, 130)
  assert.equal(engine._inGap, true)
  let steps = 0
  const advance = engine._advanceBeat.bind(engine)
  engine._advanceBeat = () => { steps++; advance() }
  engine.ctx.currentTime = 86400
  engine._schedulerStandard()
  assert.equal(steps, MAX_SCHEDULER_STEPS)
  assert.equal(SCHEDULE_AHEAD_S, .15)
})

test('fallback cannot emit stale polyrhythm notes after a delayed callback', () => {
  const { engine, hits } = fallback()
  engine._schedulerPoly()
  hits.length = 0
  engine.ctx.currentTime = 2
  engine._schedulerPoly()
  assert.ok(hits.every(time => time >= 2))
  assert.equal(engine._currentBar, 2)
})

test('count-in and minute cutoff are rendered without main-thread timers', () => {
  const { engine, advance, hits, events } = renderer(e => {
    e.setSessionSettings({ countInBars: 1, mode: 'minutes', minutes: 1 })
    e.setGapTraining(true, 1, 1)
    e.setTempoTrainer(true, 120, 150, 5, 1)
    e.setSubdivisionTrainer(true, [{ subdivision: 1, bars: 1 }, { subdivision: 13, bars: 1 }])
  })
  advance(62.1)
  assert.equal(engine.isPlaying, false)
  near(engine._sessionEndTime, 62.05)
  assert.equal(events.filter(e => e.type === 'beat' && e.value.countIn).length, 4)
  assert.ok(hits.every(hit => hit.time < 62.05))
  assert.ok(events.some(e => e.type === 'beat' && e.value.inGap))
  assert.ok(events.some(e => e.type === 'beat' && e.value.trainerPlayback?.subdivision.index === 1))
  assert.equal(engine._timerId, null)
  assert.equal(engine._sessionEndTimer, null)
})

test('renderer clips sample tails at a session deadline and user stop clears queued audio', () => {
  const { engine, advance } = renderer(e => e.setSessionSettings({ mode: 'bars', bars: 1 }))
  const long = { channels: [new Float32Array(rate * 3).fill(.01)], length: rate * 3, sampleRate: rate }
  engine.soundBank.entries.forEach(e => { e.main = [long]; e.accent = [long] })
  let signalAfterDeadline = 0
  advance(2.2, (frame, output) => {
    for (let i = 0; i < output[0].length; i++) if (frame+i >= 2.05*rate) signalAfterDeadline += Math.abs(output[0][i])
  })
  assert.equal(signalAfterDeadline, 0)
  assert.equal(engine.voices.length, 0)
  assert.equal(engine.notifications.length, 0)
})

test('audio-state recovery resumes an interrupted context', async () => {
  const e = new AudioEngine()
  e.ctx = { state: 'interrupted', resume: async () => { e.ctx.state = 'running' } }
  assert.equal(await e._unlockAudio(), true)
})

test('browser bridge ignores old starts and stale state but sends ordered live commands', () => {
  const e = new BrowserAudioEngine(), messages = []
  e.isPlaying = true; e._workletRunning = true
  e._workletNode = { port: { postMessage: m => messages.push(m) } }
  e.setPumpTheJam(true)
  e.setBpm(400)
  assert.deepEqual(messages.map(m => m.method), ['setPumpTheJam', 'setBpm'])
  e._receivePlayback({ generation: -1, events: [{ type: 'bpm', value: 20, runtime: { bpm: 20 }, revision: 2 }] })
  assert.equal(e.bpm, 400)
  e._receivePlayback({ generation: 0, events: [{ type: 'bpm', value: 20, runtime: { bpm: 20 }, revision: 1 }] })
  assert.equal(e.bpm, 400)
})

test('a live sound edit cannot leave the UI behind the final trainer tempo', () => {
  const e = new BrowserAudioEngine(), values = []
  e.isPlaying = true; e.bpm = 88; e._revision = 2
  e.onBpmChange(value => values.push(value))
  e._receivePlayback({ generation: 0, events: [
    { type: 'bpm', value: 90, revision: 1, runtime: { bpm: 90 } },
    { type: 'beat', value: { bar: 6, beat: 1 }, revision: 2, runtime: { bpm: 90 } },
  ] })
  assert.equal(e.bpm, 90)
  assert.deepEqual(values, [90])
})

test('the browser bridge never uses a JavaScript timeout to stop worklet audio', () => {
  const e = new BrowserAudioEngine()
  e._workletNode = {}
  e._setSessionEnd(60)
  assert.equal(e._sessionEndTime, 60)
  assert.equal(e._sessionEndTimer, null)
})

test('decoded stereo and spoken buffers survive the worklet message without detaching originals', () => {
  const channels = [new Float32Array([.5, .25]), new Float32Array([-.5, -.25])]
  const buffer = { numberOfChannels: 2, length: 2, sampleRate: rate, getChannelData: c => channels[c] }
  const payload = serializeSoundBank({ entries: [
    { id: 'test', kind: 'synth', main: [buffer], accent: [buffer], soft: [buffer] },
    { id: 'voice', kind: 'voice', voiceBuffers: new Map([['1', buffer], ['and', buffer]]), subdivision: buffer },
  ] })
  const cloned = structuredClone(payload)
  const r = new AudioRenderTimeline(rate)
  r.setBank(cloned)
  assert.deepEqual(r.soundBank.getBuffer(0).channels, channels)
  assert.deepEqual(r.soundBank.getBuffer(1).channels, channels)
  assert.deepEqual(r.soundBank.getSubdivisionBuffer(1, { spokenAnd: true }).channels, channels)
  assert.equal(channels[0].byteLength, 8)
  assert.equal(payload[0].main[0], payload[0].accent[0])
})

test('44.1 kHz rendering respects changing audio block sizes without accumulating drift', () => {
  const sampleRate = 44100, settings = new AudioEngine()
  settings.setBpm(137)
  const r = new AudioRenderTimeline(sampleRate)
  const sample = { ...pcm, sampleRate }
  r.begin(settings.getState(), bank.map(entry => ({ ...entry, main: [sample], accent: [sample], soft: [sample] })), .05)
  const onsets = []
  let frame = 0, block = 0
  while (frame < 10 * sampleRate) {
    const output = [new Float32Array([64, 128, 256][block++ % 3])]
    r.render(frame, output)
    output[0].forEach((value, i) => { if (value) onsets.push(frame + i) })
    frame += output[0].length
  }
  assert.equal(onsets.length, 23)
  onsets.forEach((frame, i) => near(frame / sampleRate, .05 + i * 60 / 137, 1 / sampleRate))
})

test('fallback recovery publishes a trainer target reached during the missed window', () => {
  const e = new BrowserAudioEngine(), values = []
  e.ctx = { currentTime: 0 }
  e.soundBank = { getBuffer: () => pcm, getDownbeatBuffer: () => pcm, getSubdivisionBuffer: () => pcm }
  e._playSound = () => {}
  e.setTempoTrainer(true, 120, 130, 10, 1)
  e._resetPlayback(.05)
  e.onBpmChange(bpm => values.push(bpm))
  e.ctx.currentTime = 3
  e._scheduler()
  assert.equal(e.bpm, 130)
  assert.deepEqual(values, [130])
  assert.equal(e._audibleSessionBar, 2)
  e.stop()
})


test('audio-thread renderer honors 15/16 grouping and stops after exactly two bars', () => {
  const { engine, advance, hits } = renderer(e => {
    e.setMeter({ numerator: 15, denominator: 16, groups: [4, 4, 4, 3], groupOnly: true })
    e.setBpm(120)
    e.setSessionSettings({ mode: 'bars', bars: 2 })
  })
  advance(4)
  assert.equal(engine.isPlaying, false)
  near(engine._sessionEndTime, 3.8)
  const expected = [.05, .55, 1.05, 1.55, 1.925, 2.425, 2.925, 3.425]
  assert.equal(hits.length, expected.length)
  hits.forEach((hit, i) => near(hit.time, expected[i]))
})
