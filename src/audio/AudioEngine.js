import {
  LOOKAHEAD_MS,
  SCHEDULE_AHEAD_S,
  DEFAULT_BPM,
  DEFAULT_BEATS_PER_BAR,
  ACCENT_LEVELS,
  SUBDIVISION_OPTIONS,
  SUBDIVISION_TRAINER_MIN_STAGES,
  SUBDIVISION_TRAINER_MAX_STAGES,
  DEFAULT_SUBDIVISION_TRAINER_STAGES,
  clampBpm,
  cycleAccentLevel,
  buildDefaultSubdivisionAccents,
  buildDefaultPolyAccents,
} from './constants.js'
import SoundBank from './SoundBank.js'

function normalizeSubdivisionTrainerStages(stages) {
  const source = Array.isArray(stages) ? stages : []
  const normalized = source
    .slice(0, SUBDIVISION_TRAINER_MAX_STAGES)
    .map((stage, index) => {
      const subdivision = Number(stage?.subdivision)
      const bars = Number(stage?.bars)
      const fallback = DEFAULT_SUBDIVISION_TRAINER_STAGES[
        Math.min(index, DEFAULT_SUBDIVISION_TRAINER_STAGES.length - 1)
      ]

      return {
        subdivision: SUBDIVISION_OPTIONS.some((option) => option.type === subdivision)
          ? subdivision
          : fallback.subdivision,
        bars: Number.isFinite(bars) ? Math.max(1, Math.min(16, Math.round(bars))) : fallback.bars,
      }
    })

  while (normalized.length < SUBDIVISION_TRAINER_MIN_STAGES) {
    normalized.push({ ...DEFAULT_SUBDIVISION_TRAINER_STAGES[normalized.length] })
  }

  return normalized
}

export default class AudioEngine {
  constructor() {
    this.ctx = null
    this.soundBank = null
    this.isPlaying = false

    // Timing state
    this.bpm = DEFAULT_BPM
    this.beatsPerBar = DEFAULT_BEATS_PER_BAR
    this.subdivision = 1
    this.volume = 1.0
    this.soundIndex = 0

    // Subdivision accent pattern — one entry per click (beatsPerBar * subdivision)
    this.subdivisionAccents = buildDefaultSubdivisionAccents(DEFAULT_BEATS_PER_BAR, 1)

    // Scheduler state
    this._nextNoteTime = 0
    this._currentBeat = 0
    this._currentSubdivision = 0
    this._currentBar = 1
    this._timerId = null
    this._visualTimerIds = new Set()

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
    this._tempoPendingActivation = false

    // Subdivision trainer
    this.subdivTrainerEnabled = false
    this.subdivTrainerStages = DEFAULT_SUBDIVISION_TRAINER_STAGES.map((stage) => ({ ...stage }))
    this._subdivTrainerBarCount = 0
    this._subdivTrainerStageIndex = 0
    this._subdivTrainerPendingActivation = false
    this._subdivTrainerConfigDirty = false

    // Polyrhythm mode
    this.polyrhythmMode = false
    this.polyRhythm1 = 3
    this.polyRhythm2 = 4
    this.polySoundIndex1 = 0
    this.polySoundIndex2 = 1
    this.polyAccents1 = buildDefaultPolyAccents(3)
    this.polyAccents2 = buildDefaultPolyAccents(4)
    this._polyBeat1 = 0
    this._polyBeat2 = 0
    this._polyCycleStart = 0

    // Callbacks
    this._onBeat = null
    this._onBarChange = null
    this._onBpmChange = null
    this._onStateChange = null
    this._onGapChange = null

    // Gain node
    this._gainNode = null
    this._audioSessionConfigured = false

  }

  _configureAudioSession() {
    if (this._audioSessionConfigured) return
    this._audioSessionConfigured = true

    try {
      if (typeof navigator !== 'undefined' && navigator.audioSession) {
        navigator.audioSession.type = 'playback'
      }
    } catch {
      // Ignore unsupported or restricted audioSession assignments.
    }
  }

  _ensureContext() {
    if (this.ctx) return true
    this._configureAudioSession()

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
    this._tempoPendingActivation = false
    this._subdivTrainerBarCount = 0
    this._subdivTrainerStageIndex = 0
    this._subdivTrainerPendingActivation = false
    this._subdivTrainerConfigDirty = false

    if (this.subdivTrainerEnabled && !this.polyrhythmMode) {
      this.setSubdivision(this.subdivTrainerStages[0].subdivision)
    }

    if (this.tempoTrainerEnabled && !this.polyrhythmMode) {
      this.bpm = this.tempoStartBpm
      this._onBpmChange?.(this.bpm)
    }

    this._nextNoteTime = this.ctx.currentTime + 0.05
    if (this.polyrhythmMode) {
      this._polyBeat1 = 0
      this._polyBeat2 = 0
      this._polyCycleStart = this.ctx.currentTime + 0.05
    }
    this._scheduler()
    this._timerId = setInterval(() => this._scheduler(), LOOKAHEAD_MS)
    this._onStateChange?.(true)
  }

  stop() {
    const wasPlaying = this.isPlaying
    this.isPlaying = false
    clearInterval(this._timerId)
    this._timerId = null
    this._clearVisualTimers()
    if (wasPlaying) this._onStateChange?.(false)
  }

  toggle() {
    if (this.isPlaying) this.stop()
    else this.start().catch(() => {})
  }

  setBpm(bpm) {
    this.bpm = clampBpm(bpm)
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

  setBeatsPerBar(beatsPerBar) {
    this.beatsPerBar = beatsPerBar
    this.subdivisionAccents = buildDefaultSubdivisionAccents(beatsPerBar, this.subdivision)
  }

  setSubdivision(type) {
    this.subdivision = type
    this.subdivisionAccents = buildDefaultSubdivisionAccents(this.beatsPerBar, type)
  }

  setSubdivisionAccent(index, level) {
    if (index >= 0 && index < this.subdivisionAccents.length) {
      this.subdivisionAccents[index] = level
    }
  }

  cycleSubdivisionAccent(index) {
    if (index >= 0 && index < this.subdivisionAccents.length) {
      this.subdivisionAccents[index] = cycleAccentLevel(this.subdivisionAccents[index])
      return this.subdivisionAccents[index]
    }
  }

  // Gap training config
  setGapTraining(enabled, clickBars, silentBars) {
    const changed = this.gapEnabled !== enabled
      || (clickBars !== undefined && this.gapClickBars !== clickBars)
      || (silentBars !== undefined && this.gapSilentBars !== silentBars)

    this.gapEnabled = enabled
    if (clickBars !== undefined) this.gapClickBars = clickBars
    if (silentBars !== undefined) this.gapSilentBars = silentBars

    if (changed) {
      this._gapBarCount = 0
      this._inGap = false
      this._onGapChange?.(false)
    }
  }

  // Tempo trainer config
  setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars) {
    const wasEnabled = this.tempoTrainerEnabled
    const configChanged = (startBpm !== undefined && this.tempoStartBpm !== startBpm)
      || (targetBpm !== undefined && this.tempoTargetBpm !== targetBpm)
      || (increment !== undefined && this.tempoIncrement !== increment)
      || (everyBars !== undefined && this.tempoEveryBars !== everyBars)

    this.tempoTrainerEnabled = enabled
    if (startBpm !== undefined) this.tempoStartBpm = clampBpm(startBpm)
    if (targetBpm !== undefined) this.tempoTargetBpm = clampBpm(targetBpm)
    if (increment !== undefined) this.tempoIncrement = increment
    if (everyBars !== undefined) this.tempoEveryBars = everyBars

    if (!enabled) {
      this._tempoBarCount = 0
      this._tempoReached = false
      this._tempoPendingActivation = false
      return
    }

    if (!wasEnabled || configChanged) {
      this._tempoBarCount = 0
      this._tempoReached = false

      if (this.isPlaying && !this.polyrhythmMode) {
        this._tempoPendingActivation = true
      } else if (!this.polyrhythmMode) {
        this._tempoPendingActivation = false
        this.bpm = this.tempoStartBpm
        this._onBpmChange?.(this.bpm)
      }
    }
  }

  // Subdivision trainer config
  setSubdivisionTrainer(enabled, stages) {
    const wasEnabled = this.subdivTrainerEnabled
    this.subdivTrainerEnabled = enabled
    if (stages !== undefined) {
      this.subdivTrainerStages = normalizeSubdivisionTrainerStages(stages)
    }

    if (!enabled) {
      this._subdivTrainerPendingActivation = false
      this._subdivTrainerConfigDirty = false
      return
    }

    if (!wasEnabled || !this.isPlaying) {
      this._subdivTrainerBarCount = 0
      this._subdivTrainerStageIndex = 0
      this._subdivTrainerConfigDirty = false

      if (this.isPlaying) {
        this._subdivTrainerPendingActivation = true
      } else {
        this._subdivTrainerPendingActivation = false
        this.setSubdivision(this.subdivTrainerStages[0].subdivision)
      }
    } else {
      this._subdivTrainerConfigDirty = true
    }
  }

  // Polyrhythm config
  setPolyrhythmMode(enabled) {
    if (this.polyrhythmMode === enabled) return
    if (this.isPlaying) this.stop()
    this.polyrhythmMode = enabled
    this._gapBarCount = 0
    this._inGap = false
    this._onGapChange?.(false)

    if (!enabled) {
      if (this.tempoTrainerEnabled) {
        this._tempoBarCount = 0
        this._tempoReached = false
        this._tempoPendingActivation = false
        this.bpm = this.tempoStartBpm
        this._onBpmChange?.(this.bpm)
      }
      if (this.subdivTrainerEnabled) {
        this._subdivTrainerBarCount = 0
        this._subdivTrainerStageIndex = 0
        this.setSubdivision(this.subdivTrainerStages[0].subdivision)
      }
    }
  }

  setPolyRhythm1(value) {
    if (this.isPlaying) this.stop()
    this.polyRhythm1 = Math.max(1, Math.min(16, value))
    this.polyAccents1 = buildDefaultPolyAccents(this.polyRhythm1)
  }

  setPolyRhythm2(value) {
    if (this.isPlaying) this.stop()
    this.polyRhythm2 = Math.max(1, Math.min(16, value))
    this.polyAccents2 = buildDefaultPolyAccents(this.polyRhythm2)
  }

  setPolyAccents1(accents) { this.polyAccents1 = accents }
  setPolyAccents2(accents) { this.polyAccents2 = accents }

  cyclePolyAccent(rhythmIndex, beatIndex) {
    const arr = rhythmIndex === 1 ? this.polyAccents1 : this.polyAccents2
    if (beatIndex >= 0 && beatIndex < arr.length) {
      arr[beatIndex] = cycleAccentLevel(arr[beatIndex])
      return arr[beatIndex]
    }
  }

  setPolySoundIndex1(index) { this.polySoundIndex1 = index }
  setPolySoundIndex2(index) { this.polySoundIndex2 = index }

  _notifyAtAudioTime(time, callback) {
    const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000)
    const timerId = setTimeout(() => {
      this._visualTimerIds.delete(timerId)
      if (this.isPlaying) callback()
    }, delayMs)
    this._visualTimerIds.add(timerId)
  }

  _clearVisualTimers() {
    this._visualTimerIds.forEach((timerId) => clearTimeout(timerId))
    this._visualTimerIds.clear()
  }

  // --- Scheduler ---
  _scheduler() {
    if (this.polyrhythmMode) {
      this._schedulerPoly()
    } else {
      this._schedulerStandard()
    }
  }

  _schedulerStandard() {
    while (this._nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
      this._scheduleNote(this._nextNoteTime)
      this._advanceBeat()
    }
  }

  _schedulerPoly() {
    // BPM defines quarter-note speed for Rhythm 1 (the primary rhythm).
    // e.g. 3:4 at 120 BPM → R1 plays 3 beats at 120 BPM (cycle = 1.5s),
    // R2 plays 4 beats evenly across that same 1.5s.
    const cycleDuration = (60.0 / this.bpm) * this.polyRhythm1
    const now = this.ctx.currentTime + SCHEDULE_AHEAD_S

    // Outer loop: handle fast BPMs where multiple cycles fit in one tick
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let scheduled = false

      // Schedule rhythm 1 beats within lookahead window
      while (this._polyBeat1 < this.polyRhythm1) {
        const t = this._polyCycleStart + this._polyBeat1 * (cycleDuration / this.polyRhythm1)
        if (t >= now) break
        this._scheduleNotePoly(t, 1, this._polyBeat1)
        this._polyBeat1++
        scheduled = true
      }

      // Schedule rhythm 2 beats within lookahead window
      while (this._polyBeat2 < this.polyRhythm2) {
        const t = this._polyCycleStart + this._polyBeat2 * (cycleDuration / this.polyRhythm2)
        if (t >= now) break
        this._scheduleNotePoly(t, 2, this._polyBeat2)
        this._polyBeat2++
        scheduled = true
      }

      // Advance cycle only when BOTH rhythms have exhausted their beats
      if (this._polyBeat1 >= this.polyRhythm1 && this._polyBeat2 >= this.polyRhythm2) {
        this._polyCycleStart += cycleDuration
        this._polyBeat1 = 0
        this._polyBeat2 = 0
        // Continue outer loop to check if new cycle's beats fall within lookahead
      } else {
        break
      }

      // Safety: if nothing was scheduled this iteration, break to avoid infinite loop
      if (!scheduled) break
    }
  }

  _scheduleNotePoly(time, rhythmIndex, beatIndex) {
    const soundIdx = rhythmIndex === 1 ? this.polySoundIndex1 : this.polySoundIndex2
    const accentArr = rhythmIndex === 1 ? this.polyAccents1 : this.polyAccents2
    const accentLevel = accentArr[beatIndex] || 'ON'
    const vol = ACCENT_LEVELS[accentLevel]?.volume ?? 0.4

    if (vol > 0) {
      this._playSound(this.soundBank.getBuffer(soundIdx), time, vol)
    }

    const event = {
      beat: beatIndex,
      subdivision: 0,
      rhythm: rhythmIndex,
      bar: 1,
      time,
      accent: accentLevel,
      inGap: false,
    }
    this._notifyAtAudioTime(time, () => this._onBeat?.(event))
  }

  _scheduleNote(time) {
    const beatIndex = this._currentBeat
    const subIndex = this._currentSubdivision
    const isMainBeat = subIndex === 0

    // Look up per-click accent from subdivisionAccents
    const flatIndex = beatIndex * this.subdivision + subIndex
    const accentLevel = this.subdivisionAccents[flatIndex] || 'ON'
    const accentVolume = ACCENT_LEVELS[accentLevel]?.volume ?? 0.5

    // Determine if in gap
    const inGap = this.gapEnabled && this._inGap
    const shouldPlay = !inGap && accentVolume > 0

    if (shouldPlay) {
      if (isMainBeat) {
        this._playSound(this.soundBank.getBuffer(this.soundIndex), time, accentVolume)
      } else {
        this._playSound(this.soundBank.getSubdivisionBuffer(this.soundIndex), time, accentVolume)
      }
    }

    // Notify UI of every click (not just main beats)
    const event = {
      beat: beatIndex,
      subdivision: subIndex,
      bar: this._currentBar,
      time,
      accent: accentLevel,
      inGap,
    }
    this._notifyAtAudioTime(time, () => this._onBeat?.(event))
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
        this._handleBarBoundary(this._nextNoteTime)
      }
    }
  }

  _handleBarBoundary(boundaryTime) {
    this._currentBar++
    const currentBar = this._currentBar
    this._notifyAtAudioTime(boundaryTime, () => this._onBarChange?.(currentBar))

    // Gap training logic
    if (this.gapEnabled) {
      this._gapBarCount++
      if (!this._inGap && this._gapBarCount >= this.gapClickBars) {
        this._inGap = true
        this._gapBarCount = 0
        this._notifyAtAudioTime(boundaryTime, () => this._onGapChange?.(true))
      } else if (this._inGap && this._gapBarCount >= this.gapSilentBars) {
        this._inGap = false
        this._gapBarCount = 0
        this._notifyAtAudioTime(boundaryTime, () => this._onGapChange?.(false))
      }
    }

    // Subdivision trainer logic
    if (this.subdivTrainerEnabled) {
      if (this._subdivTrainerPendingActivation) {
        this._subdivTrainerBarCount = 0
        this._subdivTrainerStageIndex = 0
        this._subdivTrainerPendingActivation = false
        this._subdivTrainerConfigDirty = false
        this.setSubdivision(this.subdivTrainerStages[0].subdivision)
      } else if (this._subdivTrainerStageIndex >= this.subdivTrainerStages.length) {
        this._subdivTrainerBarCount = 0
        this._subdivTrainerStageIndex = 0
        this._subdivTrainerConfigDirty = false
        this.setSubdivision(this.subdivTrainerStages[0].subdivision)
      } else {
        this._subdivTrainerBarCount++
        const stage = this.subdivTrainerStages[this._subdivTrainerStageIndex]

        if (this._subdivTrainerBarCount >= stage.bars) {
          this._subdivTrainerBarCount = 0
          this._subdivTrainerStageIndex = (
            this._subdivTrainerStageIndex + 1
          ) % this.subdivTrainerStages.length
          this._subdivTrainerConfigDirty = false
          this.setSubdivision(
            this.subdivTrainerStages[this._subdivTrainerStageIndex].subdivision,
          )
        } else if (this._subdivTrainerConfigDirty) {
          this._subdivTrainerConfigDirty = false
          this.setSubdivision(stage.subdivision)
        }
      }
    }

    // Tempo trainer logic
    if (this.tempoTrainerEnabled && this._tempoPendingActivation) {
      this._tempoPendingActivation = false
      this._tempoBarCount = 0
      this._tempoReached = false
      this.bpm = this.tempoStartBpm
      const bpm = this.bpm
      this._notifyAtAudioTime(boundaryTime, () => this._onBpmChange?.(bpm))
    } else if (this.tempoTrainerEnabled && !this._tempoReached) {
      this._tempoBarCount++
      if (this._tempoBarCount >= this.tempoEveryBars) {
        this._tempoBarCount = 0
        const goingUp = this.tempoTargetBpm > this.tempoStartBpm

        if (goingUp) {
          this.bpm = Math.min(this.bpm + this.tempoIncrement, this.tempoTargetBpm)
        } else {
          this.bpm = Math.max(this.bpm - this.tempoIncrement, this.tempoTargetBpm)
        }

        const bpm = this.bpm
        this._notifyAtAudioTime(boundaryTime, () => this._onBpmChange?.(bpm))

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
      subdivision: this.subdivision,
      volume: this.volume,
      soundIndex: this.soundIndex,
      subdivisionAccents: [...this.subdivisionAccents],
      gapEnabled: this.gapEnabled,
      gapClickBars: this.gapClickBars,
      gapSilentBars: this.gapSilentBars,
      tempoTrainerEnabled: this.tempoTrainerEnabled,
      tempoStartBpm: this.tempoStartBpm,
      tempoTargetBpm: this.tempoTargetBpm,
      tempoIncrement: this.tempoIncrement,
      tempoEveryBars: this.tempoEveryBars,
      subdivTrainerEnabled: this.subdivTrainerEnabled,
      subdivTrainerStages: this.subdivTrainerStages.map((stage) => ({ ...stage })),
      subdivTrainerStageIndex: this._subdivTrainerStageIndex,
      subdivTrainerBarCount: this._subdivTrainerBarCount,
      polyrhythmMode: this.polyrhythmMode,
      polyRhythm1: this.polyRhythm1,
      polyRhythm2: this.polyRhythm2,
      polySoundIndex1: this.polySoundIndex1,
      polySoundIndex2: this.polySoundIndex2,
      polyAccents1: [...this.polyAccents1],
      polyAccents2: [...this.polyAccents2],
    }
  }
}
