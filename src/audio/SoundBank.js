import { SOUND_OPTIONS, normalizeSoundIndex } from './constants.js'

const APP_BASE = import.meta.env?.BASE_URL || '/metronome-app/'
const AUDIO_BASE = `${APP_BASE.endsWith('/') ? APP_BASE : `${APP_BASE}/`}audio/metronome/`
const VOICE_COUNT = 16

const VOICE_VARIANTS = [
  { maxBpm: 110, prefix: '' },
  { maxBpm: 155, prefix: 'fast-' },
  { maxBpm: 190, prefix: 'faster-' },
  { maxBpm: 250, prefix: 'rapid-' },
  { maxBpm: Infinity, prefix: 'max-' },
]

const SAMPLE_DEFINITIONS = {
  cowbell: {
    soft: ['vcsl/cowbell-soft.wav'],
    main: ['vcsl/cowbell-main.wav'],
    accent: ['vcsl/cowbell-accent.wav'],
  },
  'hi-hat': {
    soft: ['vcsl/hihat-soft.wav'],
    main: ['vcsl/hihat-main.wav'],
    accent: ['vcsl/hihat-accent.wav'],
  },
  shaker: {
    soft: numberedSamples('freepats/shaker-soft'),
    main: numberedSamples('freepats/shaker-main'),
    accent: ['freepats/shaker-accent-1.wav'],
  },
  tambourine: {
    soft: numberedSamples('freepats/tamb-soft'),
    main: numberedSamples('freepats/tamb-main'),
    accent: numberedSamples('freepats/tamb-accent'),
  },
}

function numberedSamples(stem) {
  return Array.from({ length: 3 }, (_, index) => `${stem}-${index + 1}.wav`)
}

function createClickBuffer(ctx, freq, duration, type = 'sine') {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * (1 / duration) * 8)
    let sample = 0

    if (type === 'sine') {
      sample = Math.sin(2 * Math.PI * freq * t)
    } else if (type === 'square') {
      sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1
    } else if (type === 'triangle') {
      sample = 2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1
    }

    data[i] = sample * envelope * 0.8
  }

  return buffer
}

function synthesizeSelectedSounds(ctx) {
  return {
    'classic-click': {
      main: createClickBuffer(ctx, 1000, 0.03, 'square'),
      accent: createClickBuffer(ctx, 1500, 0.035, 'square'),
    },
    woodblock: {
      main: createClickBuffer(ctx, 600, 0.05, 'triangle'),
      accent: createClickBuffer(ctx, 900, 0.06, 'triangle'),
    },
    'soft-tone': {
      main: createClickBuffer(ctx, 440, 0.06, 'sine'),
      accent: createClickBuffer(ctx, 660, 0.08, 'sine'),
    },
  }
}

export function voiceTierForBpm(bpm) {
  return VOICE_VARIANTS.find(({ maxBpm }) => bpm <= maxBpm)?.prefix ?? 'max-'
}

export default class SoundBank {
  constructor(audioContext) {
    this.ctx = audioContext
    this.entries = []
    this.buffers = []
    this.downbeatBuffers = []
    this.ready = false
    this._loadPromises = new Map()
    this._bufferPromises = new Map()
  }

  async init() {
    if (this.ready) return

    const synthesized = synthesizeSelectedSounds(this.ctx)
    this.entries = SOUND_OPTIONS.map((sound) => {
      if (sound.kind === 'synth') {
        const buffers = synthesized[sound.id]
        return {
          ...sound,
          soft: [buffers.main],
          main: [buffers.main],
          accent: [buffers.accent],
        }
      }

      if (sound.kind === 'voice') {
        return {
          ...sound,
          folder: sound.id === 'male-count' ? 'voice-male' : 'voice-female',
          voiceBuffers: new Map(),
          subdivision: null,
        }
      }

      return { ...sound, soft: [], main: [], accent: [] }
    })

    this._syncCompatibilityBuffers()
    this.ready = true
  }

  async prepareSound(index, { count = VOICE_COUNT, includeAnd = true } = {}) {
    if (!this.ready) await this.init()

    const soundIndex = normalizeSoundIndex(index)
    const entry = this.entries[soundIndex]
    if (entry.kind === 'synth' || entry.loaded) return
    if (entry.kind === 'voice') {
      // Counts cannot change during a run without stopping. Prepare all speed
      // tiers for the current counts so live tempo/trainer edits never wait.
      await this._loadVoice(entry, count, includeAnd)
      entry.loaded = entry.voiceBuffers.size === VOICE_VARIANTS.length * (VOICE_COUNT + 1)
      this._syncCompatibilityBuffers()
      return
    }
    if (this._loadPromises.has(entry.id)) return this._loadPromises.get(entry.id)

    const loadPromise = this._loadSample(entry)

    this._loadPromises.set(entry.id, loadPromise)

    try {
      await loadPromise
      entry.loaded = true
      this._syncCompatibilityBuffers()
    } catch (error) {
      this._loadPromises.delete(entry.id)
      throw error
    }
  }

  getBuffer(index, options = {}) {
    const entry = this._entry(index)
    if (entry?.kind === 'voice') return this._voiceBuffer(entry, options)
    return this._pick(entry?.main, options.sequenceIndex) || this._fallbackBuffer()
  }

  getSubdivisionBuffer(index, options = {}) {
    const entry = this._entry(index)
    if (entry?.kind === 'voice') {
      if (options.spokenAnd) {
        return entry.voiceBuffers.get(`${voiceTierForBpm(options.bpm ?? 120)}and`)
          || entry.voiceBuffers.get('and') || entry.subdivision || this._fallbackBuffer()
      }
      return entry.subdivision || this._fallbackBuffer()
    }
    return this._pick(entry?.soft, options.sequenceIndex) || this.getBuffer(index, options)
  }

  getDownbeatBuffer(index, options = {}) {
    const entry = this._entry(index)
    if (entry?.kind === 'voice') return this._voiceBuffer(entry, options)
    return this._pick(entry?.accent, options.sequenceIndex) || this.getBuffer(index, options)
  }

  _entry(index) {
    return this.entries[normalizeSoundIndex(index)] || this.entries[0]
  }

  _pick(buffers, sequenceIndex = 0) {
    if (!buffers?.length) return null
    const safeIndex = Number.isFinite(sequenceIndex) ? Math.abs(Math.floor(sequenceIndex)) : 0
    return buffers[safeIndex % buffers.length]
  }

  _fallbackBuffer() {
    return this.entries[0]?.main?.[0] || null
  }

  _voiceBuffer(entry, { beatNumber = 1, bpm = 120, voiceBpm = bpm } = {}) {
    const number = Math.max(1, Math.min(VOICE_COUNT, Math.round(beatNumber)))
    const key = `${voiceTierForBpm(voiceBpm)}${number}`
    return entry.voiceBuffers.get(key) || entry.voiceBuffers.get(String(number)) || this._fallbackBuffer()
  }

  async _loadSample(entry) {
    const definition = SAMPLE_DEFINITIONS[entry.id]
    const [soft, main, accent] = await Promise.all([
      this._loadBuffers(definition.soft),
      this._loadBuffers(definition.main),
      this._loadBuffers(definition.accent),
    ])
    entry.soft = soft
    entry.main = main
    entry.accent = accent
  }

  async _loadVoice(entry, count, includeAnd) {
    const requests = []
    const load = key => {
      if (!entry.voiceBuffers.has(key)) requests.push(this._loadBuffer(`${entry.folder}/${key}.wav`)
        .then(buffer => entry.voiceBuffers.set(key, buffer)))
    }
    for (const { prefix } of VOICE_VARIANTS) {
      if (includeAnd) load(`${prefix}and`)
      for (let number = 1; number <= Math.max(1, Math.min(VOICE_COUNT, count)); number++) load(`${prefix}${number}`)
    }
    if (!entry.subdivision) requests.push(this._loadBuffer('vcsl/wood-soft.wav').then(buffer => { entry.subdivision = buffer }))
    await Promise.all(requests)
  }

  async _loadBuffers(paths) {
    return Promise.all(paths.map((path) => this._loadBuffer(path)))
  }

  _loadBuffer(path) {
    if (!this._bufferPromises.has(path)) {
      const pending = this._fetchBuffer(path).catch(error => {
        this._bufferPromises.delete(path)
        throw error
      })
      this._bufferPromises.set(path, pending)
    }
    return this._bufferPromises.get(path)
  }

  async _fetchBuffer(path) {
    const response = await fetch(`${AUDIO_BASE}${path}`)
    if (!response.ok) throw new Error(`Could not load metronome sound: ${path}`)
    const bytes = await response.arrayBuffer()
    return this.ctx.decodeAudioData(bytes)
  }

  _syncCompatibilityBuffers() {
    this.buffers = this.entries.map((entry) => (
      entry.kind === 'voice'
        ? entry.voiceBuffers.get('1') || null
        : entry.main?.[0] || null
    ))
    this.downbeatBuffers = this.entries.map((entry) => (
      entry.kind === 'voice'
        ? entry.voiceBuffers.get('1') || null
        : entry.accent?.[0] || entry.main?.[0] || null
    ))
  }
}
