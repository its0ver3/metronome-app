import test from 'node:test'
import assert from 'node:assert/strict'
import VisualTimeline, { audioOutputTime } from '../src/audio/VisualTimeline.js'
import BrowserAudioEngine from '../src/audio/BrowserAudioEngine.js'
import { nextFlashPulse, getFlashAnimation } from '../src/components/layout/flashPulse.js'

function fixture() {
  let now = 1000, frame, batches = 0
  const context = { state: 'running', currentTime: 1.1,
    getOutputTimestamp: () => ({ contextTime: 1, performanceTime: 1000 }) }
  const events = []
  const timeline = new VisualTimeline(() => context, { now: () => now,
    requestFrame: callback => { frame = callback; return 1 }, cancelFrame: () => { frame = null } })
  timeline.listen(event => events.push(event), run => { batches++; run() })
  return { timeline, context, events, batches: () => batches,
    tick(time) { now = time; const callback = frame; frame = null; callback?.() } }
}

test('visuals wait for the output timestamp rather than the ahead-of-output render clock', () => {
  const f = fixture()
  f.timeline.enqueue({ time: 1.05, beat: 1 })
  f.tick(1016); assert.equal(f.events.length, 0)
  f.tick(1049); assert.equal(f.events.length, 0)
  f.tick(1051)
  assert.equal(f.events.length, 1)
  assert.equal(f.events[0].outputTime, 1050)
  assert.equal(f.events[0].visualLate, false)
})

test('queued visuals adapt if the audio output route gains latency', () => {
  const f = fixture()
  f.timeline.enqueue({ time: 1.05, beat: 1 })
  f.context.getOutputTimestamp = () => ({ contextTime: 1, performanceTime: 1200 })
  f.tick(1100); assert.equal(f.events.length, 0)
  f.tick(1250); assert.equal(f.events.length, 1)
})

test('missing or rejected output timestamps use reported latency without producing NaN', () => {
  const context = { currentTime: 2, baseLatency: .01, outputLatency: .12 }
  assert.equal(audioOutputTime(context, 2.1, 1000), 1230)
  context.getOutputTimestamp = () => { throw Error('Unavailable route') }
  assert.equal(audioOutputTime(context, 2.1, 1000), 1230)
  context.baseLatency = NaN; context.outputLatency = undefined
  assert.ok(Math.abs(audioOutputTime(context, 2.1, 1000) - 1100) < 1e-6)
})

test('stalls recover the latest position without replaying expired flashes', () => {
  const f = fixture()
  for (let i = 0; i < 20; i++) f.timeline.enqueue({ time: 1 + i*.01, beat: i, downbeat: i === 0 })
  f.tick(1400)
  assert.ok(f.events.length <= 2)
  assert.equal(f.events.at(-1).beat, 19)
  assert.ok(f.events.every(event => event.visualLate))
  assert.equal(f.events.reduce(nextFlashPulse, null), null)
  f.timeline.enqueue({ time: 1.41, beat: 0, downbeat: true })
  f.tick(1416)
  assert.equal(f.events.at(-1).visualLate, false)
  assert.ok(nextFlashPulse(null, f.events.at(-1)).downbeat)
})

test('one frame batches both polyrhythms and preserves Flash on 1 over subdivisions', () => {
  const f = fixture()
  f.timeline.enqueue({ time: 1, beat: 0, rhythm: 2, downbeat: true })
  f.timeline.enqueue({ time: 1, beat: 0, rhythm: 1, downbeat: true })
  f.timeline.enqueue({ time: 1.005, beat: 0, rhythm: 1, downbeat: false })
  f.tick(1010)
  assert.equal(f.batches(), 1)
  const pulse = f.events.reduce(nextFlashPulse, null)
  assert.equal(pulse.downbeat, true)
  assert.equal(pulse.time, 1)
  assert.ok(getFlashAnimation(pulse, false))
  assert.deepEqual([...new Set(f.events.map(e=>e.rhythm))].sort(), [1,2])
})

test('count-in and following bar each retain their own primary downbeat', () => {
  const f = fixture()
  f.timeline.enqueue({ time: 1, beat: 0, downbeat: true, countIn: true })
  f.tick(1001)
  const countIn = nextFlashPulse(null, f.events.at(-1))
  f.timeline.enqueue({ time: 2, beat: 0, downbeat: true, bar: 1 })
  f.tick(2001)
  const bar = nextFlashPulse(countIn, f.events.at(-1))
  assert.equal(bar.sequence, countIn.sequence + 1)
  assert.equal(bar.downbeat, true)
})

test('completion waits until the final audio deadline reaches the output', () => {
  const f = fixture()
  let complete = false
  f.timeline.enqueue({ time: 1.02, beat: 3 })
  f.timeline.finishAt(1.1, () => { complete = true })
  f.tick(1030)
  assert.equal(f.events.length, 1); assert.equal(complete, false)
  f.tick(1100); assert.equal(complete, true)
})

test('stop cancels queued visuals and pending automatic completion', () => {
  const f = fixture()
  let complete = false
  f.timeline.enqueue({ time: 2, beat: 0 })
  f.timeline.finishAt(3, () => { complete = true })
  f.timeline.clear(); f.tick(4000)
  assert.equal(f.events.length, 0); assert.equal(complete, false)
  f.timeline.enqueue({ time: 5, beat: 1 }); f.tick(5000)
  assert.equal(f.events.length, 1)
})

test('an interrupted context never presents queued old flashes', () => {
  const f = fixture()
  f.timeline.enqueue({ time: 1, beat: 0 })
  f.context.state = 'interrupted'; f.tick(1010)
  f.context.state = 'running'; f.tick(1020)
  assert.equal(f.events.length, 0)
})

test('long stalls bound pending work and present only the recovered beat', () => {
  const f = fixture()
  for (let i = 0; i < 10000; i++) f.timeline.enqueue({ time: i*.01, beat: i%4 })
  assert.ok(f.timeline.pending.length <= 512)
  f.tick(101000)
  assert.equal(f.events.length, 1)
  assert.equal(f.events[0].beat, 3)
  assert.equal(f.events[0].visualLate, true)
})

test('the browser defers natural completion but a manual stop cancels it', () => {
  const engine = new BrowserAudioEngine(), f = fixture()
  engine._visualTimeline = f.timeline
  engine.isPlaying = true
  engine._receivePlayback({ generation: 0, events: [
    { type: 'stopped', time: 1.1, value: true },
  ] })
  f.tick(1050); assert.equal(engine.isPlaying, true)
  f.tick(1100); assert.equal(engine.isPlaying, false)
  assert.equal(engine.getSessionState().phase, 'complete')
  engine.isPlaying = true
  engine._finishAtOutput(2)
  engine.stop(); f.tick(2100)
  assert.equal(engine.getSessionState().phase, 'idle')
})

test('browser bridge uses the visual timeline and stop invalidates its old generation', () => {
  const engine = new BrowserAudioEngine(), f = fixture()
  engine._visualTimeline = f.timeline
  engine.onBeat(event => f.events.push(event))
  engine.isPlaying = true
  engine._receivePlayback({ generation: 0, events: [{ type: 'beat', value: { time: 1.05, beat: 0 } }] })
  assert.equal(f.events.length, 0)
  engine.stop(); f.tick(1060)
  assert.equal(f.events.length, 0)
  engine.isPlaying = true
  engine._receivePlayback({ generation: 0, events: [{ type: 'beat', value: { time: 1.05, beat: 0 } }] })
  f.tick(1070); assert.equal(f.events.length, 0)
  engine.stop()
})
