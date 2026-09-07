// UI presentation follows the output clock; it never controls audio rendering.
export const MAX_VISUAL_LATENESS_MS = 50
const MAX_PENDING_EVENTS = 512

export function audioOutputTime(context, audioTime, now) {
  try {
    const stamp = context.getOutputTimestamp?.()
    if (stamp?.contextTime > 0 && stamp?.performanceTime > 0 &&
        Number.isFinite(stamp.contextTime) && Number.isFinite(stamp.performanceTime)) {
      return stamp.performanceTime + (audioTime - stamp.contextTime) * 1000
    }
  } catch { /* Some output routes cannot provide a timestamp. */ }
  const latency = [context.baseLatency, context.outputLatency]
    .reduce((sum, value) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0)
  return now + (audioTime - context.currentTime + latency) * 1000
}

export default class VisualTimeline {
  constructor(context, { now = () => performance.now(),
    requestFrame = callback => globalThis.requestAnimationFrame?.(callback),
    cancelFrame = id => globalThis.cancelAnimationFrame?.(id) } = {}) {
    this.context = context
    this.now = now
    this.requestFrame = requestFrame
    this.cancelFrame = cancelFrame
    this.pending = []
    this.frame = null
    this.batch = run => run()
  }

  listen(callback, batch = run => run()) { this.callback = callback; this.batch = batch }

  enqueue(event) {
    if (!Number.isFinite(event.time)) { this.callback?.(event); return }
    this.pending.push(event)
    if (this.pending.length > MAX_PENDING_EVENTS) this.pending.splice(0, this.pending.length - MAX_PENDING_EVENTS)
    this._request()
  }

  finishAt(time, callback) { this.end = { time, callback }; this._request() }

  clear() {
    if (this.frame != null) this.cancelFrame(this.frame)
    this.frame = null
    this.pending.length = 0
    this.end = null
  }

  _request() {
    if (this.frame == null) this.frame = this.requestFrame(() => this._present()) ?? null
  }

  _present() {
    this.frame = null
    const context = this.context(), now = this.now()
    if (!context || context.state && context.state !== 'running') { this.clear(); return }
    const due = [], future = []
    for (const event of this.pending) {
      const outputTime = audioOutputTime(context, event.time, now)
      if (outputTime <= now) due.push({ ...event, outputTime, presentationFrame: now,
        visualLate: now - outputTime > MAX_VISUAL_LATENESS_MS })
      else future.push(event)
    }
    this.pending = future
    // Catch up to each rhythm's current position in one React commit. Retain
    // the most recent primary downbeat for trainer state / Flash on 1 even
    // when several subdivisions land within a single display frame.
    const latest = new Map()
    let downbeat
    for (const event of due) {
      latest.set(event.rhythm ?? 0, event)
      if (event.downbeat && event.rhythm !== 2) downbeat = event
    }
    const selected = [...new Set([...latest.values(), ...(downbeat ? [downbeat] : [])])]
      .sort((a, b) => a.time - b.time)
    if (selected.length) this.batch(() => selected.forEach(event => this.callback?.(event)))
    if (this.end && audioOutputTime(context, this.end.time, now) <= now) {
      const callback = this.end.callback
      this.clear()
      this.batch(callback)
    } else if (this.pending.length || this.end) this._request()
  }
}
