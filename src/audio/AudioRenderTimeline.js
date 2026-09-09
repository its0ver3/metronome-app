import AudioEngine from './AudioEngine.js'
import SoundBank from './SoundBank.js'
import { meterGroups } from './meter.js'
import { PLAYBACK_CONFIG_KEYS, LIVE_COMMANDS, playbackRuntime } from './workletProtocol.js'

// The audio thread uses exactly the same rhythm/trainer rules as the fallback.
// Only the clock, output, and notification delivery differ. No fetch, DOM,
// AudioContext, or JavaScript timers are used by this renderer.
export default class AudioRenderTimeline extends AudioEngine {
  constructor(sampleRate, emit = () => {}) {
    super()
    this.ctx = { currentTime: 0, sampleRate }
    this.soundBank = new SoundBank(this.ctx)
    this.voices = []
    this.notifications = []
    this.emit = emit
    this.revision = 0
    this.onBeat(event => this._emit('beat', event))
    this.onBarChange(bar => this._emit('bar', bar))
    this.onBpmChange(bpm => this._emit('bpm', bpm))
    this.onGapChange(gap => this._emit('gap', gap))
    this.onSessionChange(session => this._emit('session', session))
  }

  _emit(type, value) {
    this.emit({ type, value, ...(type === 'stopped' ? { time: this._sessionEndTime } : {}),
      revision: this._notificationRevision ?? this.revision,
      runtime: this._notificationRuntime ?? playbackRuntime(this) })
  }

  setBank(entries) {
    entries.forEach((entry, index) => {
      if (!entry) return
      const previous = this.soundBank.entries[index]
      this.soundBank.entries[index] = { ...previous, ...entry,
        voiceBuffers: entry.voiceBuffers ? new Map([...(previous?.voiceBuffers || []), ...entry.voiceBuffers]) : previous?.voiceBuffers,
      }
    })
    this.soundBank.ready = true
  }

  begin(settings, entries, startTime) {
    this.revision = 0
    for (const key of PLAYBACK_CONFIG_KEYS) this[key] = settings[key]
    this._meterGroups = meterGroups(this.meter)
    this.soundBank.entries = []
    this.setBank(entries)
    this.voices.length = 0
    this.notifications.length = 0
    this._resetPlayback(startTime, { ...this.sessionSettings })
  }

  command(method, args, revision) {
    if (!LIVE_COMMANDS.includes(method)) return
    this.revision = revision
    this[method](...args)
  }

  // Samples arrive already decoded at this context's sample rate.
  setSound(index) { this.soundIndex = index }
  setPolySoundIndex1(index) { this.polySoundIndex1 = index }
  setPolySoundIndex2(index) { this.polySoundIndex2 = index }

  _playSound(buffer, time, volume, stopTime = this._sessionEndTime) {
    if (!buffer || time < this.ctx.currentTime - 0.000001) return
    this.voices.push({ buffer, volume, start: Math.round(time * this.ctx.sampleRate),
      end: Math.round(stopTime * this.ctx.sampleRate) })
  }

  _notifyAtAudioTime(time, callback) {
    if (time < this.ctx.currentTime - 0.000001) return
    this.notifications.push({ time, callback, revision: this.revision, runtime: playbackRuntime(this) })
  }

  _setSessionEnd(time) {
    this._sessionEndTime = time
    const frame = Math.round(time * this.ctx.sampleRate)
    for (const voice of this.voices) voice.end = Math.min(voice.end, frame)
  }

  stop(completed = false) {
    this.isPlaying = false
    this._sessionPhase = completed ? 'complete' : 'idle'
    this.voices.length = 0
    this.notifications.length = 0
    this._publishSession()
    this._emit('stopped', completed)
  }

  render(frame, output) {
    if (!this.isPlaying || !output[0]) return
    const length = output[0].length, rate = this.ctx.sampleRate
    this.ctx.currentTime = frame / rate
    // Plan the block being rendered. This runs on every audio quantum, without
    // waiting for a message from the UI. Keep fractional times until rendering.
    this._scheduleAheadS = length / rate
    this._scheduler()
    const end = frame + length
    for (let v = this.voices.length - 1; v >= 0; v--) {
      const voice = this.voices[v]
      const from = Math.max(frame, voice.start)
      const to = Math.min(end, voice.start + voice.buffer.length, voice.end)
      for (let channel = 0; channel < output.length; channel++) {
        const samples = voice.buffer.channels[Math.min(channel, voice.buffer.channels.length - 1)]
        for (let f = from; f < to; f++) output[channel][f - frame] += samples[f - voice.start] * voice.volume
      }
      if (Math.min(voice.start + voice.buffer.length, voice.end) <= end) this.voices.splice(v, 1)
    }
    this.notifications.sort((a, b) => a.time - b.time)
    while (this.notifications[0]?.time < end / rate) {
      const event = this.notifications.shift()
      this._notificationRuntime = event.runtime
      this._notificationRevision = event.revision
      event.callback()
    }
    this._notificationRuntime = null
    this._notificationRevision = null
    if (end / rate >= this._sessionEndTime) this.stop(true)
  }
}
