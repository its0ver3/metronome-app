export const clampWheelValue = (value, min, max) => Math.max(min, Math.min(max, value))

export function parseWheelEntry(text, min, max) {
  if (!/^\d+$/.test(text.trim())) return null
  const value = Number(text)
  return Number.isSafeInteger(value) ? clampWheelValue(value, min, max) : null
}

// One scale for every wheel. Pixel trackpads already supply their own momentum.
export const WHEEL_DRAG_PIXELS = 24
export function normalizeWheelDelta(delta, mode = 0) {
  if (!Number.isFinite(delta)) return 0
  return mode === 1 ? delta / 3 : mode === 2 ? Math.sign(delta) : delta / 48
}

// A single continuous position drives the cylinder AND the saved integer.
// Parent echoes of our own updates must never interrupt a drag or its momentum.
export function createWheelMotion({ read, paint, commit, raf, caf, delay, cancelDelay, now = () => performance.now() }) {
  let position = read().value
  let published = position
  let mode = 'idle'
  let pointer = null
  let velocity = 0
  let lastMovement = 0
  let lastFrame = 0
  let frame = null
  let timer = null
  let target = position
  const bounded = value => clampWheelValue(value, read().min, read().max)
  const clear = () => {
    if (frame !== null) caf(frame)
    if (timer !== null) cancelDelay(timer)
    frame = timer = null
  }
  function display() {
    const value = bounded(Math.round(position))
    paint({ value, offset: value - position, moving: mode !== 'idle' })
    if (value !== published) {
      published = value // Record before commit: the parent may acknowledge synchronously.
      commit(value)
    }
  }
  function reset() {
    clear()
    pointer = null
    mode = 'idle'
    velocity = 0
    position = published = bounded(read().value)
    paint({ value: published, offset: 0, moving: false })
  }
  function sync() {
    if (read().disabled || read().value !== published || bounded(position) !== position) {
      reset()
      return true
    }
    return false
  }
  function schedule() {
    if (frame === null) frame = raf(tick)
  }
  function settle() {
    clear()
    pointer = null
    velocity = 0
    target = bounded(Math.round(position))
    if (read().reducedMotion || Math.abs(target - position) < .001) {
      position = target
      mode = 'idle'
    } else {
      mode = 'snap'
      lastFrame = now()
      schedule()
    }
    display()
  }
  function tick() {
    frame = null
    if (read().disabled) { reset(); return }
    const time = now()
    const dt = Math.max(0, time - lastFrame)
    lastFrame = time
    if (mode === 'coast') {
      // Exponential friction: frame-rate independent, no bounce at the bounds.
      const decay = Math.exp(-dt / 180)
      const next = position + velocity * 180 * (1 - decay)
      position = bounded(next)
      velocity *= decay
      if (next !== position || Math.abs(velocity) < .001) { settle(); return }
    } else if (mode === 'snap') {
      position += (target - position) * (1 - Math.exp(-dt / 45))
      if (Math.abs(target - position) < .001) { position = target; mode = 'idle' }
    }
    display()
    if (mode === 'coast' || mode === 'snap') schedule()
  }
  function begin(clientX, clientY = 0) {
    if (read().disabled || pointer) return
    clear() // Catch the moving cylinder exactly where it is; never round on grab.
    mode = 'drag'
    pointer = { x: clientX, startX: clientX, startY: clientY, time: now(), dragged: false }
    velocity = 0
    lastMovement = now()
  }
  function move(clientX, clientY = 0) {
    if (!pointer || read().disabled) return
    const time = now()
    const dx = pointer.x - clientX
    pointer.dragged ||= Math.hypot(pointer.startX - clientX, pointer.startY - clientY) > 3
    if (dx !== 0) {
      const previous = position
      position = bounded(position + dx / WHEEL_DRAG_PIXELS)
      const dt = clampWheelValue(time - pointer.time, 8, 40)
      const instantaneous = (position - previous) / dt
      // Reversing your hand immediately reverses the wheel and its momentum.
      if (Math.sign(instantaneous) !== Math.sign(velocity)) velocity = instantaneous
      else velocity += (instantaneous - velocity) * (1 - Math.exp(-dt / 30))
      velocity = clampWheelValue(velocity, -.025, .025)
      lastMovement = time
      pointer.x = clientX
      schedule()
    }
    pointer.time = time
  }
  function end(clientX, clientY = 0) {
    if (!pointer || read().disabled) return false
    move(clientX, clientY) // Include travel delivered only with pointerup.
    const tapped = !pointer.dragged
    pointer = null
    clear()
    velocity *= Math.exp(-(now() - lastMovement) / 60)
    if (tapped || read().reducedMotion || Math.abs(velocity) < .001) settle()
    else {
      mode = 'coast'
      lastFrame = now()
      display() // Flush release before the first inertia frame.
      schedule()
    }
    return tapped
  }
  function finish() {
    if (read().disabled) { reset(); return }
    settle() // Blur/capture loss preserves the current selection, not the starting value.
  }
  return {
    begin, move, end, finish, reset, sync,
    isActive: () => mode !== 'idle',
    scroll(delta, deltaMode = 0) {
      if (read().disabled || pointer || !Number.isFinite(delta) || !delta) return
      clear()
      velocity = 0
      mode = 'scroll'
      position = bounded(position + normalizeWheelDelta(delta, deltaMode))
      schedule()
      // Keep all native trackpad events, including their natural momentum tail.
      timer = delay(settle, 140)
    },
    key(key) {
      if (read().disabled) return false
      const steps = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
      if (!(key in steps) && key !== 'Home' && key !== 'End') return false
      clear()
      pointer = null
      mode = 'idle'
      velocity = 0
      position = key === 'Home' ? read().min : key === 'End' ? read().max : bounded(Math.round(position) + steps[key])
      display()
      return true
    },
    dispose() { clear(); pointer = null; mode = 'idle' },
  }
}
