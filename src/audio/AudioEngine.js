import {
  LOOKAHEAD_MS,
  SCHEDULE_AHEAD_S,
  MAX_SCHEDULER_STEPS,
  DEFAULT_BPM,
  MAX_BPM,
  JAM_MAX_BPM,
  DEFAULT_BEATS_PER_BAR,
  ACCENT_LEVELS,
  SUBDIVISION_OPTIONS,
  SUBDIVISION_TRAINER_MIN_STAGES,
  SUBDIVISION_TRAINER_MAX_STAGES,
  DEFAULT_SUBDIVISION_TRAINER_STAGES,
  clampBpm,
  cycleAccentLevel,
  normalizeAccentLevel,
  buildDefaultSubdivisionAccents,
  buildDefaultPolyAccents,
  normalizeSoundIndex,
  getSoundIndexById,
} from './constants.js'
import SoundBank from './SoundBank.js'
import { getGapPattern } from './gapPatterns.js'
import { normalizeMeter, meterGroups, meterAccents, writtenNoteSeconds } from './meter.js'
import { normalizeSessionSettings } from './sessionSettings.js'

const COUNT_IN_SOUND = getSoundIndexById('female-count')

export const TAP_TEMPO_FEEDBACK_FREQUENCIES = Object.freeze([
  261.63,
  329.63,
  392,
  523.25,
])

export function tapTempoFeedbackFrequency(stage) {
  const numericStage = Number(stage)
  const normalizedStage = Number.isFinite(numericStage)
    ? Math.max(1, Math.min(TAP_TEMPO_FEEDBACK_FREQUENCIES.length, Math.round(numericStage)))
    : 1
  return TAP_TEMPO_FEEDBACK_FREQUENCIES[normalizedStage - 1]
}

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
    this.pumpTheJam = false
    this.beatsPerBar = DEFAULT_BEATS_PER_BAR
    this.meter = normalizeMeter()
    this._meterGroups = meterGroups(this.meter)
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
    this._soundSequence = 0
    this._sources = new Set()
    this._startGeneration = 0
    this.sessionSettings = normalizeSessionSettings()
    this._activeSession = null
    this._sessionStartTime = null
    this._sessionEndTime = Infinity
    this._sessionEndTimer = null
    this._sessionPhase = 'idle'
    this._lastSessionState = null
    this._nextSessionStatusTime = Infinity
    this._audibleSessionBar = 1
    this._audibleCountInBar = 1
    this._audibleCountInBeat = 0
    this._countInBar = 1
    this._countInBeat = 0
    this._countInRemaining = 0
    this._sessionSchedulingDone = false
    this._sourceStopTimes = new WeakMap()

    // Gap training
    this.gapEnabled = false
    this.gapClickBars = 2
    this.gapSilentBars = 2
    this.gapPattern = 'silence'
    this._gapPlayback = { enabled: false, clickBars: 2, silentBars: 2, pattern: 'silence' }
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
    // A stopped activation previews the start tempo until playback commits it.
    this._tempoPreviewBpm = null

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
    this._polyCycleDuration = null
    this._scheduleAheadS = SCHEDULE_AHEAD_S

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
    if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
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
  onSessionChange(cb) { this._onSessionChange = cb }

  setSessionSettings(value) {
    if (this.isPlaying) return
    this.sessionSettings = normalizeSessionSettings(value)
    this._activeSession = null
    this._sessionPhase = 'idle'
    this._publishSession()
  }

  getSessionState() {
    const config = this._activeSession || this.sessionSettings
    const started = this._sessionStartTime !== null && this.ctx?.currentTime >= this._sessionStartTime
    const phase = this.isPlaying ? (!started && config.countInBars ? 'count-in' : 'playing') : this._sessionPhase
    const elapsed = this.isPlaying && started && config.mode === 'minutes'
      ? Math.max(0, this.ctx.currentTime - this._sessionStartTime) : 0
    return {
      ...config, phase,
      countInBar: this._audibleCountInBar,
      countInBeat: this._audibleCountInBeat,
      remainingSeconds: phase === 'complete' ? 0 : Math.max(0, Math.ceil(config.minutes * 60 - elapsed)),
      remainingBars: phase === 'complete' ? 0 : Math.max(0, config.bars - (this.isPlaying ? this._audibleSessionBar - 1 : 0)),
    }
  }

  _publishSession() {
    const state = this.getSessionState()
    const config = this._activeSession || this.sessionSettings
    this._nextSessionStatusTime = this.isPlaying && config.mode === 'minutes' && this._sessionStartTime !== null
      ? this._sessionStartTime + Math.floor(Math.max(0, this.ctx.currentTime - this._sessionStartTime)) + 1
      : Infinity
    const previous = this._lastSessionState
    if (previous && Object.keys(state).every(key => state[key] === previous[key])) return
    this._lastSessionState = state
    this._onSessionChange?.(state)
  }

  soundRequirements(index, { countIn = false } = {}) {
    if (countIn) return { count: this.polyrhythmMode ? this.polyRhythm1 : this._meterGroups.length, includeAnd: false }
    const count = this.polyrhythmMode
      ? Math.max(this.polySoundIndex1 === index ? this.polyRhythm1 : 0, this.polySoundIndex2 === index ? this.polyRhythm2 : 0, 1)
      : this._meterGroups.length
    return { count, includeAnd: !this.polyrhythmMode }
  }

  _beginSessionPlayback(time) {
    this._sessionStartTime = time
    this._polyCycleStart = time
    if (this._activeSession.mode === 'minutes') {
      this._setSessionEnd(time + this._activeSession.minutes * 60)
    }
  }

  _stopSourceAt(source, time) {
    if (!Number.isFinite(time) || time >= (this._sourceStopTimes.get(source) ?? Infinity)) return
    this._sourceStopTimes.set(source, time)
    try { source.stop(time) } catch { /* Already ended. */ }
  }

  _setSessionEnd(time) {
    this._sessionEndTime = time
    for (const source of this._sources) this._stopSourceAt(source, time)
    clearTimeout(this._sessionEndTimer)
    const finish = () => {
      if (!this.isPlaying) return
      // Audio time may pause when the device interrupts playback.
      if (this.ctx.currentTime + 0.000001 < time) {
        this._sessionEndTimer = setTimeout(finish, Math.max(25, (time - this.ctx.currentTime) * 1000))
        return
      }
      this.stop(true)
    }
    this._sessionEndTimer = setTimeout(finish, Math.max(0, (time - this.ctx.currentTime) * 1000))
  }

  _sessionBarFinished(boundaryTime) {
    if (this._activeSession?.mode === 'bars' && this._currentBar > this._activeSession.bars) {
      this._sessionSchedulingDone = true
      this._setSessionEnd(boundaryTime)
      return true
    }
    return false
  }

  // --- Controls ---
  async start() {
    if (this.isPlaying) return
    if (!this._ensureContext()) return
    const generation = ++this._startGeneration
    const session = { ...this.sessionSettings }
    if (!(await this._unlockAudio())) return
    if (generation !== this._startGeneration) return
    if (!(await this.init())) return
    if (generation !== this._startGeneration) return

    const activeSoundIndexes = this.polyrhythmMode
      ? [this.polySoundIndex1, this.polySoundIndex2]
      : [this.soundIndex]
    if (session.countInBars) activeSoundIndexes.push(COUNT_IN_SOUND)
    await Promise.all([...new Set(activeSoundIndexes)].map((index) => {
      const requirements = this.soundRequirements(index, { countIn: index === COUNT_IN_SOUND && !(
        this.polyrhythmMode ? [this.polySoundIndex1, this.polySoundIndex2].includes(index) : this.soundIndex === index
      ) })
      if (session.countInBars && index === COUNT_IN_SOUND) {
        requirements.count = Math.max(requirements.count, this.soundRequirements(index, { countIn: true }).count)
      }
      return this.soundBank.prepareSound(index, requirements)
    }))

    if (generation !== this._startGeneration) return
    await this._preparePlayback(generation)

    if (generation !== this._startGeneration) return
    // Loading samples/the renderer can outlive a browser audio interruption.
    // Recheck every non-running state before publishing a successful start.
    if (this.ctx.state !== 'running' && !(await this._unlockAudio())) {
      if (generation === this._startGeneration) this.stop()
      return
    }

    if (this.isPlaying || generation !== this._startGeneration) return

    this._resetPlayback(this.ctx.currentTime + 0.05, session)
    this._startScheduler()
    this._onStateChange?.(true)
    this._publishSession()
  }

  // BrowserAudioEngine supplies an audio-thread renderer; the core also retains
  // a timestamped BufferSource fallback and is shared by deterministic tests.
  async _preparePlayback() {}

  _startScheduler() {
    this._scheduler()
    this._timerId = setInterval(() => this._scheduler(), LOOKAHEAD_MS)
  }

  _resetPlayback(startTime, session = { ...this.sessionSettings }) {
    this._applyGapConfig()
    this.isPlaying = true
    this._tempoPreviewBpm = null
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
    this._soundSequence = 0
    this._activeSession = session
    this._sessionPhase = 'idle'
    this._sessionStartTime = null
    this._sessionEndTime = Infinity
    this._audibleSessionBar = 1
    this._audibleCountInBar = 1
    this._audibleCountInBeat = 0
    this._countInBar = 1
    this._countInBeat = 0
    this._countInRemaining = session.countInBars
    this._sessionSchedulingDone = false

    if (this.subdivTrainerEnabled && !this.polyrhythmMode) {
      this.setSubdivision(this.subdivTrainerStages[0].subdivision)
    }

    if (this.tempoTrainerEnabled && !this.polyrhythmMode) {
      this.bpm = this.tempoStartBpm
      this._onBpmChange?.(this.bpm)
    }

    this._nextNoteTime = startTime
    this._polyCycleDuration = null
    if (!this._countInRemaining) this._beginSessionPlayback(this._nextNoteTime)
    if (this.polyrhythmMode) {
      this._polyBeat1 = 0
      this._polyBeat2 = 0
      this._polyCycleStart = startTime
    }
  }

  stop(completed = false) {
    this._startGeneration++
    const wasPlaying = this.isPlaying
    this.isPlaying = false
    clearInterval(this._timerId)
    this._timerId = null
    clearTimeout(this._sessionEndTimer)
    this._sessionEndTimer = null
    this._sessionPhase = completed ? 'complete' : 'idle'
    this._clearVisualTimers()
    for (const source of this._sources) { try { source.stop() } catch { /* Already ended. */ } }
    this._sources.clear()
    if (wasPlaying) this._onStateChange?.(false)
    this._publishSession()
  }

  toggle() {
    if (this.isPlaying || this.loadState?.starting) this.stop()
    else this.start().catch(() => {})
  }

  setBpm(bpm) {
    this.bpm = clampBpm(bpm, this.maxBpm)
    this._onBpmChange?.(this.bpm)
  }

  get maxBpm() { return this.pumpTheJam ? JAM_MAX_BPM : MAX_BPM }

  setPumpTheJam(enabled) {
    this.pumpTheJam = enabled === true
    this.tempoStartBpm = clampBpm(this.tempoStartBpm, this.maxBpm)
    this.tempoTargetBpm = clampBpm(this.tempoTargetBpm, this.maxBpm)
    if (this._tempoPreviewBpm !== null) this._tempoPreviewBpm = clampBpm(this._tempoPreviewBpm, this.maxBpm)
    this.setBpm(this.bpm)
  }

  async playTapTempoFeedback(stage) {
    if (!(await this._unlockAudio()) || !this._gainNode) return

    const now = this.ctx.currentTime
    const frequency = tapTempoFeedbackFrequency(stage)
    const oscillator = this.ctx.createOscillator()
    const toneGain = this.ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency * 1.035, now)
    oscillator.frequency.exponentialRampToValueAtTime(frequency, now + 0.055)
    toneGain.gain.setValueAtTime(0.0001, now)
    toneGain.gain.exponentialRampToValueAtTime(0.065, now + 0.008)
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)

    oscillator.connect(toneGain)
    toneGain.connect(this._gainNode)
    oscillator.start(now)
    oscillator.stop(now + 0.16)
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this._gainNode) {
      this._gainNode.gain.value = this.volume
    }
  }

  setSound(index) {
    this.soundIndex = normalizeSoundIndex(index)
    this.soundBank?.prepareSound(this.soundIndex, this.soundRequirements(this.soundIndex)).catch(() => {})
  }

  async preview(soundIndex) {
    const generation = this._previewGeneration = (this._previewGeneration || 0) + 1
    if (!(await this._unlockAudio())) return
    if (!(await this.init())) return
    const context = this.ctx, bank = this.soundBank
    const normalizedIndex = normalizeSoundIndex(soundIndex)
    await bank.prepareSound(normalizedIndex, { count: 1, includeAnd: false })
    if (generation !== this._previewGeneration || context !== this.ctx) return

    const buffer = this.soundBank.getBuffer(normalizedIndex, {
      beatNumber: 1,
      bpm: this.bpm,
      sequenceIndex: 0,
    })
    try { this._previewSource?.stop() } catch { /* Already ended. */ }
    const source = this.ctx.createBufferSource()
    this._previewSource = source
    source.buffer = buffer
    source.connect(this._gainNode)
    source.start()
  }

  setBeatsPerBar(beatsPerBar) {
    this.setMeter({ numerator: beatsPerBar, denominator: 4 })
  }

  setMeter(value) {
    const next = normalizeMeter(value)
    const sameGroups = this.meter.numerator === next.numerator && this.meter.denominator === next.denominator && this.meter.groups.join() === next.groups.join()
    this.stop()
    this.meter = next
    this._meterGroups = meterGroups(next)
    this.beatsPerBar = next.numerator
    if (!sameGroups) this.subdivisionAccents = meterAccents(next, this.subdivision)
    this._currentBeat = 0
    this._currentSubdivision = 0
    this._currentBar = 1
    this._inGap = false
    this._onGapChange?.(false)
  }

  setSubdivision(type) {
    const next = Number(type)
    if (!SUBDIVISION_OPTIONS.some(option => option.type === next)) return
    const previous = this.subdivisionAccents
    const previousSubdivision = this.subdivision
    this.subdivision = next
    this.subdivisionAccents = meterAccents(this.meter, next, previous, previousSubdivision)
  }

  setSubdivisionAccent(index, level) {
    if (index >= 0 && index < this.subdivisionAccents.length) {
      this.subdivisionAccents[index] = normalizeAccentLevel(level)
    }
  }

  cycleSubdivisionAccent(index) {
    if (index >= 0 && index < this.subdivisionAccents.length) {
      this.subdivisionAccents[index] = cycleAccentLevel(this.subdivisionAccents[index])
      return this.subdivisionAccents[index]
    }
  }

  cycleBeatAccent(beatIndex) {
    const startIndex = beatIndex * this.subdivision
    if (
      !Number.isInteger(beatIndex)
      || beatIndex < 0
      || startIndex >= this.subdivisionAccents.length
    ) {
      return undefined
    }

    const currentLevel = normalizeAccentLevel(this.subdivisionAccents[startIndex])
    const nextLevel = cycleAccentLevel(currentLevel)
    const group = this._meterGroups.find(item => item.start === beatIndex)
    const endIndex = Math.min((group?.end ?? beatIndex + 1) * this.subdivision, this.subdivisionAccents.length)

    if (nextLevel === 'OFF') {
      // Muting from the orbit silences the complete beat, including subdivisions.
      this.subdivisionAccents.fill('OFF', startIndex, endIndex)
    } else if (currentLevel === 'OFF') {
      // Bring a muted beat back as a normal sounding beat. A following tap can
      // then accent its main click while keeping the subdivisions distinct.
      this.subdivisionAccents.fill('ON', startIndex, endIndex)
    } else {
      // On and Accent remain main-click controls so subdivisions keep their
      // quieter sound and any detailed pattern edits made in the Rhythm sheet.
      this.subdivisionAccents[startIndex] = nextLevel
    }

    return nextLevel
  }

  // Gap training config
  setGapTraining(enabled, clickBars, silentBars, pattern) {
    this.gapEnabled = Boolean(enabled)
    const bars = (value, fallback) => Number.isFinite(Number(value))
      ? Math.max(1, Math.min(16, Math.round(Number(value)))) : fallback
    if (clickBars !== undefined) this.gapClickBars = bars(clickBars, this.gapClickBars)
    if (silentBars !== undefined) this.gapSilentBars = bars(silentBars, this.gapSilentBars)
    if (pattern !== undefined) this.gapPattern = getGapPattern(pattern).id
    if (!this.isPlaying) {
      this._applyGapConfig()
      this._gapBarCount = 0
      this._inGap = false
      this._onGapChange?.(false)
    }
  }

  _applyGapConfig() {
    const previous = this._gapPlayback
    this._gapPlayback = {
      enabled: this.gapEnabled, clickBars: this.gapClickBars,
      silentBars: this.gapSilentBars, pattern: this.gapPattern,
    }
    // Pattern-only edits keep the current phase and bar count.
    return previous.enabled !== this.gapEnabled
      || previous.clickBars !== this.gapClickBars
      || previous.silentBars !== this.gapSilentBars
  }

  _playbackSubdivision() {
    return this._gapPlayback.enabled && this._inGap && this._gapPlayback.pattern !== 'silence'
      ? getGapPattern(this._gapPlayback.pattern).divisions : this.subdivision
  }

  // Tempo trainer config
  setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars) {
    const wasEnabled = this.tempoTrainerEnabled
    if (enabled && !wasEnabled) {
      this._tempoPreviewBpm = !this.isPlaying && !this.polyrhythmMode ? this.bpm : null
    }
    const configChanged = (startBpm !== undefined && this.tempoStartBpm !== startBpm)
      || (targetBpm !== undefined && this.tempoTargetBpm !== targetBpm)
      || (increment !== undefined && this.tempoIncrement !== increment)
      || (everyBars !== undefined && this.tempoEveryBars !== everyBars)

    this.tempoTrainerEnabled = enabled
    if (startBpm !== undefined) this.tempoStartBpm = clampBpm(startBpm, this.maxBpm)
    if (targetBpm !== undefined) this.tempoTargetBpm = clampBpm(targetBpm, this.maxBpm)
    if (increment !== undefined) this.tempoIncrement = increment
    if (everyBars !== undefined) this.tempoEveryBars = everyBars

    if (!enabled) {
      const previousBpm = this._tempoPreviewBpm
      this._tempoPreviewBpm = null
      this._tempoBarCount = 0
      this._tempoReached = false
      this._tempoPendingActivation = false
      if (wasEnabled && !this.isPlaying && previousBpm !== null) {
        this.setBpm(previousBpm)
      }
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
    this.stop()
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
    this.stop()
    this.polyRhythm1 = Math.max(1, Math.min(16, value))
    this.polyAccents1 = buildDefaultPolyAccents(this.polyRhythm1)
  }

  setPolyRhythm2(value) {
    this.stop()
    this.polyRhythm2 = Math.max(1, Math.min(16, value))
    this.polyAccents2 = buildDefaultPolyAccents(this.polyRhythm2)
  }

  setPolyAccents1(accents) { this.polyAccents1 = accents.map(normalizeAccentLevel) }
  setPolyAccents2(accents) { this.polyAccents2 = accents.map(normalizeAccentLevel) }

  cyclePolyAccent(rhythmIndex, beatIndex) {
    const arr = rhythmIndex === 1 ? this.polyAccents1 : this.polyAccents2
    if (beatIndex >= 0 && beatIndex < arr.length) {
      arr[beatIndex] = cycleAccentLevel(arr[beatIndex])
      return arr[beatIndex]
    }
  }

  setPolySoundIndex1(index) {
    this.polySoundIndex1 = normalizeSoundIndex(index)
    this.soundBank?.prepareSound(this.polySoundIndex1, this.soundRequirements(this.polySoundIndex1)).catch(() => {})
  }

  setPolySoundIndex2(index) {
    this.polySoundIndex2 = normalizeSoundIndex(index)
    this.soundBank?.prepareSound(this.polySoundIndex2, this.soundRequirements(this.polySoundIndex2)).catch(() => {})
  }

  _notifyAtAudioTime(time, callback) {
    if (time < this.ctx.currentTime - 0.000001) return
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
    if (this.ctx.currentTime >= this._sessionEndTime) {
      this.stop(true)
      return
    }
    if (this.ctx.currentTime >= this._nextSessionStatusTime) this._publishSession()
    if (this._sessionSchedulingDone) return
    if (this._countInRemaining) {
      this._schedulerCountIn()
      if (this._countInRemaining) return
    }
    if (this.polyrhythmMode) {
      this._schedulerPoly()
    } else {
      this._schedulerStandard()
    }
  }

  _schedulerCountIn() {
    const groups = this.polyrhythmMode
      ? Array.from({ length: this.polyRhythm1 }, (_, start) => ({ start, length: 1 }))
      : this._meterGroups
    let steps = 0
    while (this._countInRemaining && this._nextNoteTime < this.ctx.currentTime + this._scheduleAheadS && steps++ < MAX_SCHEDULER_STEPS) {
      const group = groups[this._countInBeat]
      const time = this._nextNoteTime
      const duration = this.polyrhythmMode ? 60 / this.bpm : writtenNoteSeconds(this.meter, this.bpm) * group.length
      const bar = this._countInBar
      const count = this._countInBeat + 1
      const buffer = this.soundBank.getBuffer(COUNT_IN_SOUND, {
        beatNumber: count, bpm: 60 / duration, sequenceIndex: this._soundSequence++,
      })
      this._playSound(buffer, time, 1, time + duration)
      this._notifyAtAudioTime(time, () => {
        this._audibleCountInBar = bar
        this._audibleCountInBeat = count
        this._publishSession()
        this._onBeat?.({ beat: group.start, subdivision: 0, rhythm: this.polyrhythmMode ? 1 : undefined,
          downbeat: count === 1, inGap: false, countIn: true, time })
      })
      this._nextNoteTime += duration
      this._countInBeat++
      if (this._countInBeat === groups.length) {
        this._countInBeat = 0
        this._countInBar++
        this._countInRemaining--
        if (!this._countInRemaining) this._beginSessionPlayback(this._nextNoteTime)
      }
    }
  }

  _schedulerStandard() {
    let steps = 0
    while (this._nextNoteTime < this.ctx.currentTime + this._scheduleAheadS && steps++ < MAX_SCHEDULER_STEPS) {
      if (this._nextNoteTime >= this._sessionEndTime - 0.000001) break
      // Advance missed musical state, including trainer and timer boundaries,
      // without replaying old clicks or queuing old animation callbacks.
      if (this._nextNoteTime >= this.ctx.currentTime - 0.000001) this._scheduleNote(this._nextNoteTime)
      this._advanceBeat()
    }
  }

  _schedulerPoly() {
    // BPM defines quarter-note speed for Rhythm 1 (the primary rhythm).
    // e.g. 3:4 at 120 BPM → R1 plays 3 beats at 120 BPM (cycle = 1.5s),
    // R2 plays 4 beats evenly across that same 1.5s.
    const now = this.ctx.currentTime + this._scheduleAheadS

    // Outer loop: handle fast BPMs where multiple cycles fit in one tick
    // eslint-disable-next-line no-constant-condition
    let steps = 0
    while (steps++ < MAX_SCHEDULER_STEPS) {
      // Once any pulse of a cycle is committed, its duration is immutable.
      // A live BPM edit takes effect at the next uncommitted shared cycle.
      if (this._polyCycleDuration === null || (this._polyBeat1 === 0 && this._polyBeat2 === 0)) {
        this._polyCycleDuration = (60 / this.bpm) * this.polyRhythm1
      }
      const cycleDuration = this._polyCycleDuration
      let scheduled = false

      // Schedule rhythm 1 beats within lookahead window
      while (this._polyBeat1 < this.polyRhythm1) {
        const t = this._polyCycleStart + this._polyBeat1 * (cycleDuration / this.polyRhythm1)
        if (t >= now) break
        if (t >= this._sessionEndTime - 0.000001) break
        if (t >= this.ctx.currentTime - 0.000001) this._scheduleNotePoly(t, 1, this._polyBeat1)
        this._polyBeat1++
        scheduled = true
      }

      // Schedule rhythm 2 beats within lookahead window
      while (this._polyBeat2 < this.polyRhythm2) {
        const t = this._polyCycleStart + this._polyBeat2 * (cycleDuration / this.polyRhythm2)
        if (t >= now) break
        if (t >= this._sessionEndTime - 0.000001) break
        if (t >= this.ctx.currentTime - 0.000001) this._scheduleNotePoly(t, 2, this._polyBeat2)
        this._polyBeat2++
        scheduled = true
      }

      // Advance cycle only when BOTH rhythms have exhausted their beats
      if (this._polyBeat1 >= this.polyRhythm1 && this._polyBeat2 >= this.polyRhythm2) {
        this._polyCycleStart += cycleDuration
        this._polyCycleDuration = null
        this._currentBar++
        if (this._sessionBarFinished(this._polyCycleStart)) break
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
    const accentLevel = normalizeAccentLevel(accentArr[beatIndex])
    const vol = ACCENT_LEVELS[accentLevel]?.volume ?? 0.4
    const isCycleDownbeat = beatIndex === 0
    const cycleBpm = this._polyCycleDuration ? 60 * this.polyRhythm1 / this._polyCycleDuration : this.bpm
    const effectiveBpm = rhythmIndex === 1
      ? cycleBpm
      : cycleBpm * (this.polyRhythm2 / this.polyRhythm1)
    const soundOptions = {
      beatNumber: beatIndex + 1,
      bpm: effectiveBpm,
      sequenceIndex: this._soundSequence++,
    }

    if (vol > 0) {
      const buffer = isCycleDownbeat
        ? this.soundBank.getDownbeatBuffer(soundIdx, soundOptions)
        : this.soundBank.getBuffer(soundIdx, soundOptions)
      this._playSound(buffer, time, vol)
    }

    const event = {
      beat: beatIndex,
      subdivision: 0,
      rhythm: rhythmIndex,
      bar: this._currentBar,
      time,
      accent: accentLevel,
      downbeat: isCycleDownbeat,
      inGap: false,
    }
    this._notifyAtAudioTime(time, () => {
      if (rhythmIndex === 1 && beatIndex === 0) {
        this._audibleSessionBar = event.bar
        this._publishSession()
      }
      this._onBeat?.(event)
    })
  }

  _scheduleNote(time) {
    const beatIndex = this._currentBeat
    const subIndex = this._currentSubdivision
    const group = this._meterGroups.find(item => beatIndex >= item.start && beatIndex < item.end)
    const isMainBeat = subIndex === 0 && beatIndex === group.start
    const isCycleDownbeat = beatIndex === 0 && isMainBeat

    // Look up per-click accent from subdivisionAccents
    const flatIndex = beatIndex * this.subdivision + subIndex
    const inGap = this._gapPlayback.enabled && this._inGap
    const pattern = getGapPattern(this._gapPlayback.pattern)
    // Gap hits are displaced beat clicks, with the same level as that pulse.
    // A muted reference pulse must not erase the independently chosen gap pattern.
    const referenceAccent = normalizeAccentLevel(this.subdivisionAccents[group.start * this.subdivision])
    const gapAccent = referenceAccent === 'OFF' ? 'ACCENT' : referenceAccent
    const accentLevel = inGap
      ? (pattern.hits.includes(subIndex) ? gapAccent : 'OFF')
      : normalizeAccentLevel(this.subdivisionAccents[flatIndex])
    const accentVolume = ACCENT_LEVELS[accentLevel]?.volume ?? 0.5

    // Determine if in gap
    const groupOnly = this.meter.groupOnly && !this.subdivTrainerEnabled
    const shouldPlay = accentVolume > 0 && (inGap || !groupOnly || isMainBeat)
    const groupTicks = group.length * this.subdivision
    const groupTick = (beatIndex - group.start) * this.subdivision + subIndex
    // Only an exact halfway subdivision is “and”; odd tuplets keep their clicks.
    // Group-only playback and gap overrides keep their existing behavior.
    const hasSpokenOffbeat = !groupOnly && !inGap && groupTicks > 1 && groupTicks % 2 === 0
    const countBpm = 60 / (writtenNoteSeconds(this.meter, this.bpm) * group.length)
    const soundOptions = {
      beatNumber: group.index + 1,
      bpm: countBpm,
      voiceBpm: hasSpokenOffbeat ? countBpm * 2 : countBpm,
      spokenAnd: hasSpokenOffbeat && groupTick === groupTicks / 2,
      sequenceIndex: this._soundSequence++,
    }

    if (shouldPlay) {
      if (inGap) {
        this._playSound(this.soundBank.getBuffer(this.soundIndex, soundOptions), time, accentVolume)
      } else if (isMainBeat) {
        const buffer = isCycleDownbeat
          ? this.soundBank.getDownbeatBuffer(this.soundIndex, soundOptions)
          : this.soundBank.getBuffer(this.soundIndex, soundOptions)
        this._playSound(buffer, time, accentVolume)
      } else {
        this._playSound(
          this.soundBank.getSubdivisionBuffer(this.soundIndex, soundOptions),
          time,
          accentVolume,
        )
      }
    }

    // Notify UI of every click (not just main beats)
    const event = {
      beat: beatIndex,
      subdivision: subIndex,
      bar: this._currentBar,
      time,
      accent: accentLevel,
      downbeat: isCycleDownbeat,
      inGap,
      visualPulse: !groupOnly || isMainBeat || (inGap && shouldPlay),
      gapPattern: pattern.id,
      gapEnabled: this._gapPlayback.enabled,
      trainerPlayback: {
        tempo: {
          enabled: this.tempoTrainerEnabled && !this._tempoPendingActivation,
          bar: this._tempoBarCount + 1, bars: this.tempoEveryBars,
          target: this.tempoTargetBpm, reached: this._tempoReached || this.bpm === this.tempoTargetBpm,
        },
        subdivision: {
          enabled: this.subdivTrainerEnabled && !this._subdivTrainerPendingActivation,
          index: this._subdivTrainerStageIndex, bar: this._subdivTrainerBarCount + 1,
          stage: { ...this.subdivTrainerStages[this._subdivTrainerStageIndex] },
        },
      },
      gapBar: this._gapBarCount + 1,
      gapBars: inGap ? this._gapPlayback.silentBars : this._gapPlayback.clickBars,
      // Keep the saved rhythm editor's cursor on its own grid during an override.
      displaySubdivision: subIndex * this.subdivision / this._playbackSubdivision(),
      group: group.index,
    }
    this._notifyAtAudioTime(time, () => {
      if (isCycleDownbeat) {
        this._audibleSessionBar = event.bar
        this._publishSession()
      }
      this._onBeat?.(event)
    })
  }

  _playSound(buffer, time, volume, stopTime = this._sessionEndTime) {
    if (!buffer || time < this.ctx.currentTime - 0.000001) return
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(this._gainNode)
    this._sources.add(source)
    source.onended = () => { this._sources.delete(source); source.disconnect?.(); gain.disconnect?.() }
    source.start(time)
    this._stopSourceAt(source, stopTime)
  }

  _advanceBeat() {
    const secondsPerBeat = writtenNoteSeconds(this.meter, this.bpm)
    const playbackSubdivision = this._playbackSubdivision()
    const secondsPerSubdivision = secondsPerBeat / playbackSubdivision

    this._nextNoteTime += secondsPerSubdivision
    this._currentSubdivision++

    if (this._currentSubdivision >= playbackSubdivision) {
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
    if (this._sessionBarFinished(boundaryTime)) return
    const currentBar = this._currentBar
    this._notifyAtAudioTime(boundaryTime, () => this._onBarChange?.(currentBar))

    // Adopt edits only after the previous bar has been fully scheduled.
    const gapReset = this._applyGapConfig()
    if (gapReset) {
      this._gapBarCount = 0
      this._inGap = false
      this._notifyAtAudioTime(boundaryTime, () => this._onGapChange?.(false))
    }
    // Gap training logic
    if (this._gapPlayback.enabled && !gapReset) {
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
      pumpTheJam: this.pumpTheJam,
      maxBpm: this.maxBpm,
      beatsPerBar: this.beatsPerBar,
      meter: { ...this.meter, groups: [...this.meter.groups] },
      subdivision: this.subdivision,
      volume: this.volume,
      soundIndex: this.soundIndex,
      sessionSettings: { ...this.sessionSettings },
      subdivisionAccents: [...this.subdivisionAccents],
      gapEnabled: this.gapEnabled,
      gapClickBars: this.gapClickBars,
      gapSilentBars: this.gapSilentBars,
      gapPattern: this.gapPattern,
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
