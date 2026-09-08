import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createWheelMotion, normalizeWheelDelta, parseWheelEntry } from '../src/components/training/numberWheelMotion.js'

function fixture(overrides = {}) {
  const state = { value: 80, min: 20, max: 300, disabled: false, ...overrides }
  const paints = [], commits = [], frames = new Map(), timers = new Map()
  let id = 0, time = 0, motion
  motion = createWheelMotion({
    read: () => state,
    paint: view => paints.push(view),
    commit: value => {
      commits.push(value)
      state.value = value
      motion.sync() // React acknowledges each update while the drag/coast continues.
    },
    raf: fn => { frames.set(++id, fn); return id },
    caf: key => frames.delete(key),
    delay: fn => { timers.set(++id, fn); return id },
    cancelDelay: key => timers.delete(key),
    now: () => time,
  })
  const flush = map => { const work = [...map.values()]; map.clear(); work.forEach(fn => fn()) }
  const frame = (ms = 16) => { time += ms; flush(frames) }
  const rest = () => {
    flush(timers)
    for (let i = 0; frames.size && i < 200; i++) frame()
    assert.equal(frames.size + timers.size, 0, 'Wheel comes to rest without an idle animation loop')
  }
  return { state, paints, commits, frames, timers, motion, advance: ms => { time += ms }, frame, rest }
}

test('dragging publishes crossed numbers before release and survives parent acknowledgments', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.move(76)
  f.frame()
  assert.equal(f.state.value, 81)
  assert.equal(f.paints.at(-1).moving, true)
  f.motion.move(52)
  f.frame()
  assert.equal(f.state.value, 82)
  f.advance(500) // Holding before release must never be required to retain a number.
  f.motion.end(52)
  f.rest()
  assert.equal(f.state.value, 82)
  assert.deepEqual(f.commits, [81, 82])
})

test('a quick swipe releases into continuous momentum, then keeps the final number', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.move(76)
  f.motion.end(76)
  assert.equal(f.state.value, 81)
  f.frame(80)
  assert.ok(f.state.value > 81, 'The cylinder free rolls after the pointer is released')
  f.rest()
  const finalValue = f.state.value
  assert.ok(finalValue > 81)
  for (let i = 1; i < f.commits.length; i++) assert.ok(f.commits[i] >= f.commits[i - 1])
  f.motion.sync()
  assert.equal(f.state.value, finalValue)
  assert.equal(f.paints.at(-1).value, finalValue)
  assert.equal(f.paints.at(-1).offset, 0)
})

test('pointer events are painted once per frame without losing their accumulated movement', () => {
  const f = fixture()
  f.motion.begin(100)
  for (let x = 99; x >= 52; x--) { f.advance(1); f.motion.move(x) }
  assert.equal(f.frames.size, 1)
  f.frame()
  assert.equal(f.paints.length, 1)
  assert.equal(f.state.value, 82)
})

test('release includes final travel even when no pointermove was delivered', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  assert.equal(f.motion.end(52), false)
  assert.equal(f.state.value, 82)
  f.rest()
  assert.ok(f.state.value >= 82)
})

test('grabbing a rolling wheel catches its fractional position without resetting to a saved integer', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.end(76)
  f.frame(25)
  const before = f.paints.at(-1).value - f.paints.at(-1).offset
  f.motion.begin(100)
  assert.equal(f.frames.size, 0)
  f.advance(24)
  f.motion.move(112)
  f.frame()
  const after = f.paints.at(-1).value - f.paints.at(-1).offset
  assert.ok(Math.abs(after - (before - .5)) < 1e-10)
  f.advance(500)
  f.motion.end(112)
  f.rest()
  assert.equal(f.state.value, Math.round(before - .5))
})

test('reversing a drag reverses both the movement and release momentum', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.move(52)
  f.frame()
  assert.equal(f.state.value, 82)
  f.advance(24)
  f.motion.move(76)
  f.motion.end(76)
  assert.equal(f.state.value, 81)
  f.rest()
  assert.ok(f.state.value < 81)
})

test('an early vertical wobble does not lock out subsequent horizontal movement', () => {
  const f = fixture()
  f.motion.begin(100, 100)
  f.advance(10)
  f.motion.move(100, 94)
  f.advance(24)
  f.motion.end(52, 94)
  assert.equal(f.state.value, 82)
  f.rest()
  assert.ok(f.state.value >= 82)
})

test('blur and lost capture retain already crossed numbers, including an unpainted final move', () => {
  for (const paint of [false, true]) {
    const f = fixture()
    f.motion.begin(100)
    f.motion.move(52)
    if (paint) f.frame()
    f.motion.finish()
    f.rest()
    assert.equal(f.state.value, 82)
    assert.equal(f.paints.at(-1).value, 82)
  }
})

test('bounds stop momentum without wrapping; reversing at an endpoint responds immediately', () => {
  for (const [min, max] of [[1, 16], [1, 32], [20, 300], [1, 999]]) {
    const f = fixture({ min, max, value: max })
    f.motion.begin(100)
    f.motion.move(-1000)
    f.motion.move(-976)
    f.frame()
    assert.equal(f.state.value, max - 1)
    f.advance(24)
    f.motion.end(100000)
    f.rest()
    assert.equal(f.state.value, min)
    assert.ok(f.commits.every(value => value >= min && value <= max))
  }
})

test('tiny taps do not launch inertia or change the value', () => {
  const f = fixture()
  f.motion.begin(100, 100)
  f.advance(30)
  assert.equal(f.motion.end(99, 101), true)
  f.rest()
  assert.deepEqual(f.commits, [])
  assert.equal(f.state.value, 80)
})

test('trackpad movement accumulates fully and preserves the natural decaying tail', () => {
  const f = fixture()
  for (const delta of [48, 24, 12, 6, 3, 2, 1]) {
    f.advance(20)
    f.motion.scroll(delta)
    f.frame()
  }
  assert.equal(f.state.value, 82)
  assert.equal(f.timers.size, 1)
  f.rest()
  assert.equal(f.state.value, 82)
  assert.equal(normalizeWheelDelta(3, 1), 1)
  assert.equal(normalizeWheelDelta(-1, 2), -1)
  assert.equal(normalizeWheelDelta(96), 2)
})

test('keyboard and button steps interrupt momentum and use the current visible value', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.end(76)
  f.frame(80)
  const current = f.state.value
  assert.equal(f.motion.key('ArrowDown'), true)
  f.rest()
  assert.equal(f.state.value, current - 1)
  assert.equal(f.motion.key('Tab'), false)
  f.motion.key('Home'); assert.equal(f.state.value, 20)
  f.motion.key('End'); assert.equal(f.state.value, 300)
})

test('external value changes cancel motion, while own value echoes preserve it', () => {
  const f = fixture()
  f.motion.begin(100)
  f.advance(24)
  f.motion.end(76)
  assert.equal(f.motion.sync(), false)
  assert.equal(f.frames.size, 1)
  f.state.value = 120
  assert.equal(f.motion.sync(), true)
  f.rest()
  assert.equal(f.paints.at(-1).value, 120)
})

test('disabled and disposed wheels cannot keep publishing momentum', () => {
  for (const kind of ['disabled', 'disposed']) {
    const f = fixture()
    f.motion.begin(100)
    f.advance(24)
    f.motion.end(76)
    const count = f.commits.length
    if (kind === 'disabled') { f.state.disabled = true; f.motion.sync() }
    else f.motion.dispose()
    f.rest()
    assert.equal(f.commits.length, count)
  }
  const f = fixture({ disabled: true })
  f.motion.begin(100); f.motion.move(52); f.motion.end(52); f.motion.scroll(48); f.motion.key('End')
  assert.deepEqual(f.commits, [])
})

test('reduced motion keeps direct manipulation and skips release animations', () => {
  const f = fixture({ reducedMotion: true })
  f.motion.begin(100)
  f.advance(24)
  f.motion.end(76)
  assert.equal(f.state.value, 81)
  assert.equal(f.frames.size, 0)
  assert.equal(f.paints.at(-1).moving, false)
})

test('exact entries accept integers, clamp to bounds, and reject incomplete input', () => {
  assert.equal(parseWheelEntry('137', 20, 300), 137)
  assert.equal(parseWheelEntry('999', 20, 300), 300)
  assert.equal(parseWheelEntry('0', 1, 16), 1)
  for (const value of ['', ' ', '-', '1.5', '1e2', 'abc', 'Infinity']) assert.equal(parseWheelEntry(value, 1, 300), null)
})

test('trainer spinbuttons remain excluded from global playback shortcuts', async () => {
  const source = await readFile(new URL('../src/hooks/useKeyboard.js', import.meta.url), 'utf8')
  assert.ok(source.includes('[role="spinbutton"]'))
})
