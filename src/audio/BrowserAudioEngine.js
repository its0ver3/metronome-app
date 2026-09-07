import AudioEngine from './AudioEngine.js'
import VisualTimeline from './VisualTimeline.js'
import { LIVE_COMMANDS, serializeSoundBank } from './workletProtocol.js'

export default class BrowserAudioEngine extends AudioEngine {
  constructor() {
    super()
    this._workletNode = null
    this._workletModule = null
    this._commandDepth = 0
    this._revision = 0
    this.timingBackend = 'buffer-source'
    this._visualTimeline = new VisualTimeline(() => this.ctx)
  }

  onBeat(callback, batch) {
    this._visualTimeline.listen(callback, batch)
    this._onBeat = event => this._visualTimeline.enqueue(event)
  }

  async _preparePlayback(generation) {
    if (!this.ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') return
    try {
      // Vite bundles the renderer and its shared engine as a standalone module.
      // Kept dynamic so the core and Node tests don't depend on bundler syntax.
      this._workletModule ??= import('./metronome.worklet.js?worker&url')
        .then(({ default: url }) => this.ctx.audioWorklet.addModule(url))
      await this._workletModule
      if (generation !== this._startGeneration) return
      this._workletNode = new AudioWorkletNode(this.ctx, 'metronome-renderer', {
        numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
      })
      this._workletNode.port.onmessage = ({ data }) => this._receivePlayback(data)
      this._workletNode.onprocessorerror = () => {
        // Never silently continue displaying Play after a renderer failure.
        this.stop()
      }
      this._workletNode.connect(this._gainNode)
      this.timingBackend = 'audio-worklet'
    } catch {
      this._workletNode = null
      this.timingBackend = 'buffer-source'
    }
  }

  _startScheduler() {
    if (!this._workletNode) return super._startScheduler()
    this._workletRunning = true
    this._revision = 0
    this._workletNode.port.postMessage({ type: 'start', generation: this._startGeneration,
      settings: this.getState(), bank: serializeSoundBank(this.soundBank), startTime: this._nextNoteTime })
  }

  _setSessionEnd(time) {
    if (!this._workletNode) return super._setSessionEnd(time)
    // The render clock owns the deadline. A main-thread timer could end a
    // session early if the start message was delayed while copying samples.
    this._sessionEndTime = time
  }

  _notifyAtAudioTime(time, callback) {
    if (time < this.ctx.currentTime - 0.000001) this._skippedNotification = true
    super._notifyAtAudioTime(time, callback)
  }

  _scheduler() {
    this._skippedNotification = false
    super._scheduler()
    if (this.isPlaying && this._skippedNotification) {
      // Fallback catch-up discards old animations, but must still publish the
      // recovered tempo/bar once (including a trainer that reached its target).
      this._audibleSessionBar = this._currentBar
      this._onBpmChange?.(this.bpm)
      this._onBarChange?.(this._currentBar)
      this._onGapChange?.(this._inGap)
      this._publishSession()
    }
  }

  _receivePlayback({ generation, events }) {
    if (generation !== this._startGeneration || !this.isPlaying) return
    for (const event of events) {
      // A delayed UI message cannot overwrite a newer control edit.
      if (event.revision === this._revision && event.runtime) {
        const previousBpm = this.bpm
        Object.assign(this, event.runtime)
        // A control edit may supersede the one-off trainer BPM notification.
        // The next current beat must still bring the React tempo into sync.
        if (this.bpm !== previousBpm) this._onBpmChange?.(this.bpm)
      }
      switch (event.type) {
        case 'beat':
          if (Number.isFinite(event.value.bar)) {
            this._currentBar = event.value.bar
            if (event.value.downbeat && event.value.rhythm !== 2) this._audibleSessionBar = event.value.bar
          }
          this._onBeat?.(event.value)
          break
        case 'bar': this._onBarChange?.(event.value); break
        case 'bpm': if (event.revision === this._revision) this._onBpmChange?.(event.value); break
        case 'gap': this._onGapChange?.(event.value); break
        case 'session':
          if (event.value.phase !== 'complete') {
            this._remoteSession = event.value
            this._onSessionChange?.(event.value)
          }
          break
        case 'stopped':
          if (event.value && Number.isFinite(event.time)) {
            this._finishAtOutput(event.time)
          } else this.stop(event.value)
          return
        default: break
      }
    }
  }

  getSessionState() {
    return this.isPlaying && this._workletNode && this._remoteSession
      ? this._remoteSession : super.getSessionState()
  }

  stop(completed = false) {
    if (completed && !this._completingAtOutput && Number.isFinite(this._sessionEndTime) &&
        typeof requestAnimationFrame === 'function') {
      this._finishAtOutput(this._sessionEndTime)
      return
    }
    this._visualTimeline.clear()
    this._workletRunning = false
    if (this._workletNode) {
      this._workletNode.port.postMessage({ type: 'stop' })
      this._workletNode.disconnect()
      this._workletNode.port.close()
      this._workletNode = null
    }
    this._remoteSession = null
    super.stop(completed)
  }

  _finishAtOutput(time) {
    this._visualTimeline.finishAt(time, () => {
      this._completingAtOutput = true
      try { this.stop(true) } finally { this._completingAtOutput = false }
    })
  }

  _mutate(method, args) {
    this._commandDepth++
    let result
    try { result = AudioEngine.prototype[method].apply(this, args) }
    finally { this._commandDepth-- }
    if (this._commandDepth === 0 && this.isPlaying && this._workletRunning && this._workletNode) {
      this._workletNode.port.postMessage({ type: 'command', method, args, revision: ++this._revision })
      if (['setSound', 'setPolySoundIndex1', 'setPolySoundIndex2'].includes(method)) {
        const node = this._workletNode
        this.soundBank.prepareSound(args[0]).then(() => {
          if (node === this._workletNode) node.port.postMessage({ type: 'bank', bank: serializeSoundBank(this.soundBank) })
        }).catch(() => {})
      }
    }
    return result
  }
}

for (const method of LIVE_COMMANDS) {
  Object.defineProperty(BrowserAudioEngine.prototype, method, {
    value(...args) { return this._mutate(method, args) }, configurable: true,
  })
}
