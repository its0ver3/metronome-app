import { buildBar } from './meter.js'

// Isolated audition clock: no production AudioEngine or saved settings.
export class MeterPlayer {
  constructor(onPulse, onStopped) {
    this.onPulse = onPulse
    this.onStopped = onStopped
    this.generation = 0
    this.sources = new Set()
    this.queue = []
  }
  async start(settings) {
    this.stop()
    const token = ++this.generation
    this.ctx ||= new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' })
    await this.ctx.resume()
    if (token !== this.generation) return false
    if (this.ctx.state !== 'running') throw new Error('Tap Play again to enable audio.')
    this.settings = structuredClone(settings)
    this.running = true
    this.barIndex = 0
    this.eventIndex = 0
    this.bar = buildBar(this.settings, 0)
    this.barStart = this.ctx.currentTime + .05
    this.timer = setInterval(() => this.schedule(), 20)
    this.schedule()
    const paint = () => {
      if (!this.running) return
      // getOutputTimestamp aligns visuals to heard audio rather than lookahead.
      const stamp = this.ctx.getOutputTimestamp?.()
      const audioNow = stamp?.performanceTime > 0
        ? stamp.contextTime + Math.max(0, performance.now() - stamp.performanceTime) / 1000
        : this.ctx.currentTime
      let latest
      while (this.queue.length && this.queue[0].time <= audioNow) latest = this.queue.shift()
      if (latest) this.onPulse(latest)
      this.frame = requestAnimationFrame(paint)
    }
    this.frame = requestAnimationFrame(paint)
    this.ctx.onstatechange = () => { if (this.running && this.ctx.state !== 'running') this.stop() }
    return true
  }
  schedule() {
    if (!this.running) return
    const now = this.ctx.currentTime
    // Never replay a burst of missed clicks after a stalled/backgrounded tab.
    if (this.barStart + this.bar.events[this.eventIndex].offset < now - .15) { this.stop(); return }
    while (this.barStart + this.bar.events[this.eventIndex].offset < now + .1) {
      const event = this.bar.events[this.eventIndex]
      const time = this.barStart + event.offset
      if (event.audible) this.click(event, time)
      this.queue.push({ ...event, time, bpm: this.bar.bpm, barIndex: this.barIndex, silent: this.bar.silent, stage: this.bar.stage, division: this.bar.division })
      this.eventIndex++
      if (this.eventIndex === this.bar.events.length) {
        this.barStart += this.bar.duration
        this.bar = buildBar(this.settings, ++this.barIndex)
        this.eventIndex = 0
      }
    }
  }
  click(event, time) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.value = event.frequency
    const length = Math.min(.04, event.duration * .6)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(event.level * .3, time + .001)
    gain.gain.exponentialRampToValueAtTime(.0001, time + length)
    osc.connect(gain).connect(this.ctx.destination)
    this.sources.add(osc)
    osc.onended = () => { this.sources.delete(osc); osc.disconnect(); gain.disconnect() }
    osc.start(time)
    osc.stop(time + length + .005)
  }
  stop() {
    this.generation++
    this.running = false
    clearInterval(this.timer)
    cancelAnimationFrame(this.frame)
    for (const source of this.sources) { try { source.stop() } catch { /* Already ended. */ } }
    this.sources.clear()
    this.queue = []
    this.onStopped?.()
  }
  dispose() { this.stop(); if (this.ctx) { this.ctx.onstatechange = null; void this.ctx.close() } }
}
