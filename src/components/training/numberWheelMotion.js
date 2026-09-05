export const clampWheelValue = (value, min, max) => Math.max(min, Math.min(max, value))

// A shallow detent holds the cylinder at a number when the finger is close.
// Keep the raw gesture position intact so small movements accumulate and the
// wheel never gets stuck. The eased shoulder makes entering/leaving it continuous.
export function wheelDetentOffset(position) {
  const offset = Math.round(position) - position
  const distance = Math.abs(offset)
  const capture = 0.14
  if (distance <= capture) return 0
  const t = (distance - capture) / (0.5 - capture)
  return Math.sign(offset) * 0.5 * t * t * (2 - t)
}

// One frame at a time; engine/settings updates happen only at the end of a gesture.
// Injected scheduling also lets tests exercise cancellation without a browser.
export function createWheelMotion({ read, paint, commit, raf, caf, delay, cancelDelay, now = () => performance.now() }) {
  let position = read().value
  let gesture = null
  let x = 0
  let frame = null
  let timer = null
  let lastMotionTime = now()
  let snapStrength = 1
  let sampledSpeed = false
  const startSpeed = () => { lastMotionTime = now(); snapStrength = 1; sampledSpeed = false }
  const trackSpeed = delta => {
    const time = now()
    const elapsed = Math.max(4, time - lastMotionTime)
    const speed = Math.abs(delta) * 1000 / elapsed // number steps per second
    const t = clampWheelValue((speed - 2) / 6, 0, 1)
    const target = 1 - t * t * (3 - 2 * t)
    // Release the detent immediately at speed; restore it gently as motion slows.
    snapStrength = !sampledSpeed || target < snapStrength
      ? target
      : snapStrength + (target - snapStrength) * (1 - Math.exp(-elapsed / 90))
    sampledSpeed = true
    lastMotionTime = time
  }
  const clear = () => {
    if (frame !== null) caf(frame)
    if (timer !== null) cancelDelay(timer)
    frame = timer = null
  }
  const display = (moving) => {
    const value = Math.round(position)
    const rawOffset = value - position
    const offset = rawOffset + (wheelDetentOffset(position) - rawOffset) * snapStrength
    paint({ value, offset: moving ? offset : 0, moving })
  }
  const schedule = () => {
    if (frame !== null) return
    frame = raf(() => {
      frame = null
      if (read().disabled) { reset(); return }
      display(true)
    })
  }
  function reset() {
    clear()
    gesture = null
    position = read().value
    display(false)
  }
  function finish() {
    if (!gesture) return
    if (read().disabled) { reset(); return }
    clear()
    gesture = null
    const { min, max, value } = read()
    position = clampWheelValue(Math.round(position), min, max)
    display(false)
    if (position !== value) commit(position)
  }
  return {
    reset,
    finish,
    begin(clientX) {
      if (read().disabled) return
      const start = gesture ? Math.round(position) : read().value
      finish()
      gesture = 'drag'
      x = clientX
      position = start
      startSpeed()
    },
    move(clientX) {
      if (gesture !== 'drag' || read().disabled) return
      const { min, max } = read()
      const delta = (x - clientX) / 18
      trackSpeed(delta)
      position = clampWheelValue(position + delta, min, max)
      x = clientX
      schedule()
    },
    scroll(delta) {
      if (read().disabled || gesture === 'drag') return
      if (gesture !== 'scroll') {
        position = read().value
        startSpeed()
        // The first wheel event has no prior timestamp; use one display frame.
        lastMotionTime -= 16
      }
      gesture = 'scroll'
      const { min, max } = read()
      trackSpeed(delta / 30)
      position = clampWheelValue(position + delta / 30, min, max)
      schedule()
      if (timer !== null) cancelDelay(timer)
      timer = delay(finish, 120)
    },
    key(key) {
      if (read().disabled) return false
      const steps = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
      if (!(key in steps) && key !== 'Home' && key !== 'End') return false
      reset()
      const { min, max, value } = read()
      position = key === 'Home' ? min : key === 'End' ? max : clampWheelValue(value + steps[key], min, max)
      display(false)
      if (position !== value) commit(position)
      return true
    },
    dispose() { clear(); gesture = null },
  }
}
