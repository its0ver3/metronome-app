import {
  LOOKAHEAD_MS,
  SCHEDULE_AHEAD_S,
  DEFAULT_BPM,
  DEFAULT_BEATS_PER_BAR,
  DEFAULT_BEAT_UNIT,
  MIN_BPM,
  MAX_BPM,
  ACCENT_LEVELS,
  SUBDIVISION_TYPES,
  cycleAccentLevel,
  buildDefaultAccents,
} from './constants'
import SoundBank from './SoundBank'

export default class AudioEngine {
  constructor() {
    this.ctx = null
    this.soundBank = null
    this.isPlaying = false

    // Timing state
    this.bpm = DEFAULT_BPM
    this.beatsPerBar = DEFAULT_BEATS_PER_BAR
    this.beatUnit = DEFAULT_BEAT_UNIT
    this.subdivision = SUBDIVISION_TYPES.QUARTER
    this.volume = 1.0
    this.soundIndex = 0

    // Accent pattern — one entry per beat in the bar
    this.accents = buildDefaultAccents(DEFAULT_BEATS_PER_BAR)

    // Scheduler state
    this._nextNoteTime = 0
    this._currentBeat = 0
    this._currentSubdivision = 0
    this._currentBar = 1
    this._timerId = null

    // Gap training
    this.gapEnabled = false
    this.gapClickBars = 2
    this.gapSilentBars = 2
    this._gapBarCount = 0
    this._inGap = false

    // Tempo trainer
    this.tempoTrainerEnabled = false
    this.tempoStartBpm = 80
    this.tempoTargetBpm = 120
    this.tempoIncrement = 5
    this.tempoEveryBars = 4
    this._tempoBarCount = 0
    this._tempoReached = false

    // Callbacks
    this._onBeat = null
    this._onBarChange = null
    this._onBpmChange = null
    this._onStateChange = null
    this._onGapChange = null

    // Gain node
    this._gainNode = null
  }

  _ensureContext() {
    if (this.ctx) return true

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return false

    this.ctx = new AudioCtx()
    this._gainNode = this.ctx.createGain()
    this._gainNode.gain.value = this.volume
    this._gainNode.connect(this.ctx.destination)
    this.soundBank = new SoundBank(this.ctx)
    return true
  }

  async init() {
    if (!this._ensureContext()) return false
    if (!this.soundBank.ready) {
      await this.soundBank.init()
    }
    return true
  }

  async _unlockAudio() {
    if (!this._ensureContext()) return false
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        return false
      }
    }
    return this.ctx.state === 'running'
  }

  // --- Callbacks ---
  onBeat(cb) { this._onBeat = cb }
  onBarChange(cb) { this._onBarChange = cb }
  onBpmChange(cb) { this._onBpmChange = cb }
  onStateChange(cb) { this._onStateChange = cb }
  onGapChange(cb) { this._onGapChange = cb }

  // --- Controls ---
  async start() {
    if (!this._ensureContext()) return
    if (!(await this._unlockAudio())) return
    if (!(await this.init())) return

    if (this.ctx.state === 'interrupted') {
      await this.ctx.resume().catch(() => {})
      if (this.ctx.state !== 'running') return
    }

    if (this.isPlaying) return

    this.isPlaying = true
    this._currentBeat = 0
    this._currentSubdivision = 0
    this._currentBar = 1
    this._gapBarCount = 0
    this._inGap = false
    this._tempoBarCount = 0
    this._tempoReached = false

    if (this.tempoTrainerEnabled) {
      this.bpm = this.tempoStartBpm
      this._onBpmChange?.(this.bpm)
    }

    this._nextNoteTime = this.ctx.currentTime + 0.05
    this._scheduler()
    this._timerId = setInterval(() => this._scheduler(), LOOKAHEAD_MS)
    this._onStateChange?.(true)
  }

  stop() {
    if (!this.isPlaying) return
    this.isPlaying = false
    clearInterval(this._timerId)
    this._timerId = null
    this._onStateChange?.(false)
  }

  toggle() {
    if (this.isPlaying) this.stop()
    else this.start().catch(() => {})
  }

  setBpm(bpm) {
    this.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)))
    this._onBpmChange?.(this.bpm)
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this._gainNode) {
      this._gainNode.gain.value = this.volume
    }
  }

  setSound(index) {
    this.soundIndex = index
  }

  async preview(soundIndex) {
    if (!(await this._unlockAudio())) return
    if (!(await this.init())) return

    const buffer = this.soundBank.getBuffer(soundIndex)
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this._gainNode)
    source.start()
  }

  setTimeSignature(beatsPerBar, beatUnit) {
    this.beatsPerBar = beatsPerBar
    this.beatUnit = beatUnit
    this.accents = buildDefaultAccents(beatsPerBar)
  }

  setSubdivision(type) {
    this.subdivision = type
  }

  setAccent(beatIndex, level) {
    if (beatIndex >= 0 && beatIndex < this.accents.length) {
      this.accents[beatIndex] = level
    }
  }

  cycleAccent(beatIndex) {
    this.accents[beatIndex] = cycleAccentLevel(this.accents[beatIndex])
    return this.accents[beatIndex]
  }

  // Gap training config
  setGapTraining(enabled, clickBars, silentBars) {
    this.gapEnabled = enabled
    if (clickBars !== undefined) this.gapClickBars = clickBars
    if (silentBars !== undefined) this.gapSilentBars = silentBars
  }

  // Tempo trainer config
  setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars) {
    this.tempoTrainerEnabled = enabled
    if (startBpm !== undefined) this.tempoStartBpm = startBpm
    if (targetBpm !== undefined) this.tempoTargetBpm = targetBpm
    if (increment !== undefined) this.tempoIncrement = increment
    if (everyBars !== undefined) this.tempoEveryBars = everyBars
  }

  // --- Scheduler ---
  _scheduler() {
    while (this._nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
      this._scheduleNote(this._nextNoteTime)
      this._advanceBeat()
    }
  }

  _scheduleNote(time) {
    const beatIndex = this._currentBeat
    const subIndex = this._currentSubdivision
    const isMainBeat = subIndex === 0
    const accentLevel = this.accents[beatIndex]
    const accentVolume = ACCENT_LEVELS[accentLevel]?.volume ?? 0.5

    // Determine if in gap
    const inGap = this.gapEnabled && this._inGap
    const shouldPlay = !inGap && accentVolume > 0

    if (shouldPlay) {
      if (isMainBeat) {
        this._playSound(this.soundBank.getBuffer(this.soundIndex), time, accentVolume)
      } else {
        // Subdivision click — quieter
        this._playSound(this.soundBank.getSubdivisionBuffer(this.soundIndex), time, accentVolume * 0.5)
      }
    }

    if (isMainBeat) {
      this._onBeat?.({
        beat: beatIndex,
        bar: this._currentBar,
        time,
        accent: accentLevel,
        inGap,
      })
    }
  }

  _playSound(buffer, time, volume) {
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(this._gainNode)
    source.start(time)
  }

  _advanceBeat() {
    const secondsPerBeat = 60.0 / this.bpm
    const secondsPerSubdivision = secondsPerBeat / this.subdivision

    this._nextNoteTime += secondsPerSubdivision
    this._currentSubdivision++

    if (this._currentSubdivision >= this.subdivision) {
      this._currentSubdivision = 0
      this._currentBeat++

      if (this._currentBeat >= this.beatsPerBar) {
        this._currentBeat = 0
        this._handleBarBoundary()
      }
    }
  }

  _handleBarBoundary() {
    this._currentBar++
    this._onBarChange?.(this._currentBar)

    // Gap training logic
    if (this.gapEnabled) {
      this._gapBarCount++
      if (!this._inGap && this._gapBarCount >= this.gapClickBars) {
        this._inGap = true
        this._gapBarCount = 0
        this._onGapChange?.(true)
      } else if (this._inGap && this._gapBarCount >= this.gapSilentBars) {
        this._inGap = false
        this._gapBarCount = 0
        this._onGapChange?.(false)
      }
    }

    // Tempo trainer logic
    if (this.tempoTrainerEnabled && !this._tempoReached) {
      this._tempoBarCount++
      if (this._tempoBarCount >= this.tempoEveryBars) {
        this._tempoBarCount = 0
        const goingUp = this.tempoTargetBpm > this.tempoStartBpm

        if (goingUp) {
          this.bpm = Math.min(this.bpm + this.tempoIncrement, this.tempoTargetBpm)
        } else {
          this.bpm = Math.max(this.bpm - this.tempoIncrement, this.tempoTargetBpm)
        }

        this._onBpmChange?.(this.bpm)

        if (this.bpm === this.tempoTargetBpm) {
          this._tempoReached = true
        }
      }
    }
  }

  // --- State snapshot for UI ---
  getState() {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      beatsPerBar: this.beatsPerBar,
      beatUnit: this.beatUnit,
      subdivision: this.subdivision,
      volume: this.volume,
      soundIndex: this.soundIndex,
      accents: [...this.accents],
      gapEnabled: this.gapEnabled,
      gapClickBars: this.gapClickBars,
      gapSilentBars: this.gapSilentBars,
      tempoTrainerEnabled: this.tempoTrainerEnabled,
      tempoStartBpm: this.tempoStartBpm,
      tempoTargetBpm: this.tempoTargetBpm,
      tempoIncrement: this.tempoIncrement,
      tempoEveryBars: this.tempoEveryBars,
    }
  }
}
