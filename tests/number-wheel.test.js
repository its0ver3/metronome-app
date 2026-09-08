import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createWheelMotion, wheelDetentOffset } from '../src/components/training/numberWheelMotion.js'

function fixture(overrides = {}) {
  const state = { value: 80, min: 20, max: 300, disabled: false, ...overrides }
  const paints = [], commits = [], frames = new Map(), timers = new Map()
  let id = 0
  let time = 0
  const motion = createWheelMotion({
    read: () => state,
    paint: view => paints.push(view),
    commit: value => { commits.push(value); state.value = value },
    raf: fn => { frames.set(++id, fn); return id },
    caf: key => frames.delete(key),
    delay: fn => { timers.set(++id, fn); return id },
    cancelDelay: key => timers.delete(key),
    now: () => time,
  })
  const flush = map => { const work = [...map.values()]; map.clear(); work.forEach(fn => fn()) }
  return { state, paints, commits, frames, timers, motion, advance: ms => { time += ms }, frame: () => flush(frames), idle: () => flush(timers) }
}

test('wheel pointer bursts paint once per frame and commit once on release', () => {
  const f = fixture()
  f.motion.begin(100)
  for (let x = 99; x >= 64; x--) f.motion.move(x)
  assert.equal(f.frames.size, 1)
  assert.equal(f.paints.length, 0)
  assert.deepEqual(f.commits, [])
  f.frame()
  assert.equal(f.paints.length, 1)
  assert.equal(f.paints[0].value, 82)
  f.motion.finish()
  f.motion.finish() // pointerup + lostpointercapture must not double-commit
  assert.deepEqual(f.commits, [82])
  assert.equal(f.paints.at(-1).moving, false)
  assert.equal(f.frames.size + f.timers.size, 0)
})

test('partial turns settle without publishing every intermediate number', () => {
  const f = fixture()
  f.motion.begin(100)
  f.motion.move(90)
  f.frame()
  assert.ok(f.paints.at(-1).offset > 0)
  f.motion.finish()
  assert.deepEqual(f.commits, [81])
  assert.equal(f.paints.at(-1).offset, 0)
})

test('detents capture nearby numbers symmetrically and release without jumps or reversal', () => {
  for (const centre of [1, 16, 80, 120, 300]) {
    for (const distance of [-0.13, -0.05, 0, 0.05, 0.13]) {
      assert.equal(wheelDetentOffset(centre + distance), 0)
    }
    for (const distance of [0.15, 0.25, 0.4]) {
      assert.ok(Math.abs(wheelDetentOffset(centre + distance)) > 0)
      assert.ok(Math.abs(wheelDetentOffset(centre + distance) + wheelDetentOffset(centre - distance)) < 1e-10)
    }
    let previous = centre - 1
    for (let step = 0; step <= 2000; step++) {
      const raw = centre - 1 + step / 1000
      const displayed = Math.round(raw) - wheelDetentOffset(raw)
      assert.ok(displayed >= previous - 1e-10)
      assert.ok(displayed - previous < 0.003)
      previous = displayed
    }
  }
})

test('snapping during a drag keeps raw travel and does not commit early', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(100)
  f.motion.move(98)
  f.frame()
  assert.equal(f.paints.at(-1).offset, 0)
  for (let x = 97; x >= 84; x--) { f.advance(100); f.motion.move(x) }
  f.frame()
  assert.equal(f.paints.at(-1).value, 81)
  assert.equal(f.paints.at(-1).offset, 0)
  assert.deepEqual(f.commits, [])
  f.motion.finish()
  assert.deepEqual(f.commits, [81])
})

test('fast drags bypass the detent while slow drags capture the same nearby value', () => {
  for (const [elapsed, snapped] of [[8, false], [100, true]]) {
    const f = fixture()
    f.motion.begin(100)
    f.advance(elapsed)
    f.motion.move(98)
    f.frame()
    assert.equal(f.paints.at(-1).offset === 0, snapped)
    if (!snapped) assert.ok(Math.abs(f.paints.at(-1).offset + 2 / 18) < 1e-10)
    assert.deepEqual(f.commits, [])
  }
})

test('scroll detents fade back in as motion slows, with no extra timers or early commit', () => {
  const f = fixture()
  f.motion.scroll(33) // Fast turn to 81.1: inside the capture zone but unsnapped.
  f.frame()
  assert.ok(Math.abs(f.paints.at(-1).offset + .1) < 1e-10)
  f.advance(100)
  f.motion.scroll(.3)
  f.frame()
  const partial = f.paints.at(-1).offset
  assert.ok(partial < 0 && Math.abs(partial) < .11)
  f.advance(100)
  f.motion.scroll(.3)
  f.frame()
  assert.ok(Math.abs(f.paints.at(-1).offset) < Math.abs(partial))
  assert.equal(f.timers.size, 1)
  assert.deepEqual(f.commits, [])
  f.idle()
  assert.deepEqual(f.commits, [81])
})

test('trackpad scrolling uses one idle timer and commits only after stopping', () => {
  const f = fixture()
  for (let i = 0; i < 30; i++) f.motion.scroll(2)
  assert.equal(f.timers.size, 1)
  assert.equal(f.frames.size, 1)
  assert.deepEqual(f.commits, [])
  f.idle()
  assert.deepEqual(f.commits, [82])
  assert.equal(f.frames.size, 0)
})

test('wheel bounds apply to every trainer range and reverse immediately at endpoints', () => {
  for (const [min, max] of [[20, 300], [1, 16], [1, 20], [1, 32], [1, 13]]) {
    const f = fixture({ min, max, value: max })
    f.motion.begin(100)
    f.motion.move(-1000)
    f.motion.move(-982)
    f.motion.finish()
    assert.deepEqual(f.commits, [max - 1])
    f.motion.scroll(-100000)
    f.idle()
    assert.equal(f.state.value, min)
    f.motion.key('ArrowLeft')
    assert.equal(f.state.value, min)
  }
})

test('disabled, cancelled, externally changed and unmounted wheels cannot publish stale gestures', () => {
  for (const cancel of ['disable', 'cancel', 'external', 'unmount']) {
    const f = fixture()
    f.motion.begin(100)
    f.motion.move(20)
    if (cancel === 'disable') { f.state.disabled = true; f.motion.finish() }
    if (cancel === 'cancel') f.motion.reset()
    if (cancel === 'external') { f.state.value = 120; f.motion.reset() }
    if (cancel === 'unmount') f.motion.dispose()
    f.frame(); f.idle()
    f.motion.finish()
    assert.deepEqual(f.commits, [])
    assert.equal(f.frames.size + f.timers.size, 0)
  }
  const f = fixture({ disabled: true })
  f.motion.begin(10); f.motion.move(-100); f.motion.scroll(100); f.motion.key('End'); f.motion.finish()
  assert.deepEqual(f.commits, [])
})

test('keyboard controls update exact values and ignore unrelated keys', () => {
  const f = fixture()
  assert.equal(f.motion.key('Tab'), false)
  for (const key of ['ArrowRight', 'PageUp', 'ArrowLeft', 'PageDown']) f.motion.key(key)
  assert.deepEqual(f.commits, [81, 91, 90, 80])
  f.motion.key('Home'); f.motion.key('End')
  assert.equal(f.state.value, 300)
})

test('trainer spinbuttons are excluded from global tempo/playback shortcuts', async () => {
  const keyboard = await readFile(new URL('../src/hooks/useKeyboard.js', import.meta.url), 'utf8')
  assert.ok(keyboard.includes('[role="spinbutton"]'))
})

test('grip activation has no parent opacity change and production has no mockup dependency', async () => {
  const css = await readFile(new URL('../src/components/training/numberWheel.css', import.meta.url), 'utf8')
  const source = await readFile(new URL('../src/components/training/NumberWheel.jsx', import.meta.url), 'utf8')
  const textureRules = [...css.matchAll(/[^{}]*\.wheel-texture[^{}]*\{([^}]+)\}/g)]
  assert.ok(textureRules.length)
  for (const [, rule] of textureRules) assert.doesNotMatch(rule, /opacity\s*:/)
  assert.match(source, /disabled \? 0\.25 : 1/)
  assert.match(source, /memo\(function CylinderFace/)
  assert.doesNotMatch(source + css, /mockups\//)
})

test('wheel activation does not launch texture, number, or filter fades', async () => {
  const css = await readFile(new URL('../src/components/training/numberWheel.css', import.meta.url), 'utf8')
  const transitions = [...css.matchAll(/transition:\s*([^;}]+)/g)].map(([, value]) => value)
  assert.ok(transitions.some(value => value.startsWith('transform 170ms')), 'Rotation still settles into place')
  transitions.forEach(value => assert.doesNotMatch(value, /opacity|color|background|filter/))
  assert.match(css, /prefers-reduced-motion: reduce/)
})
