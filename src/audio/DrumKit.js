// DrumKit — voice buffer provider.
//
// Engine's only entry point is getBuffer(voice, articulation). Today this returns
// synthesised buffers; later, passing { source: 'samples', sampleUrls } will fetch
// WAV/OGG samples instead. No engine or UI change needed to swap.

function renderOffline(ctx, duration, fill) {
  const sampleRate = ctx.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  fill(data, sampleRate, length)
  return buffer
}

function synthKick(ctx, amp = 1) {
  return renderOffline(ctx, 0.35, (data, sr, length) => {
    const startFreq = 120
    const endFreq = 45
    for (let i = 0; i < length; i++) {
      const t = i / sr
      const freq = endFreq + (startFreq - endFreq) * Math.exp(-t * 22)
      const env = Math.exp(-t * 9)
      let phase = 0
      // approximate a swept sine via cumulative phase
      // (simple approximation: freq is slowly varying, phase ≈ 2πft)
      phase = 2 * Math.PI * freq * t
      data[i] = Math.sin(phase) * env * 0.95 * amp
    }
  })
}

function synthSnare(ctx, amp = 1) {
  return renderOffline(ctx, 0.22, (data, sr, length) => {
    for (let i = 0; i < length; i++) {
      const t = i / sr
      const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 40) * 0.5
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 22) * 0.8
      data[i] = (tone + noise) * amp
    }
  })
}

function synthHatClosed(ctx, amp = 1) {
  return renderOffline(ctx, 0.06, (data, sr, length) => {
    let prev = 0
    for (let i = 0; i < length; i++) {
      const t = i / sr
      const noise = Math.random() * 2 - 1
      // crude high-pass: diff with previous sample to emphasise high freqs
      const hp = noise - prev
      prev = noise
      const env = Math.exp(-t * 60)
      data[i] = hp * env * 0.6 * amp
    }
  })
}

function synthHatOpen(ctx, amp = 1) {
  return renderOffline(ctx, 0.35, (data, sr, length) => {
    let prev = 0
    for (let i = 0; i < length; i++) {
      const t = i / sr
      const noise = Math.random() * 2 - 1
      const hp = noise - prev
      prev = noise
      const env = Math.exp(-t * 8)
      data[i] = hp * env * 0.55 * amp
    }
  })
}

function synthTom(ctx, freq, amp = 1) {
  return renderOffline(ctx, 0.4, (data, sr, length) => {
    for (let i = 0; i < length; i++) {
      const t = i / sr
      const f = freq * Math.exp(-t * 2)
      const tone = Math.sin(2 * Math.PI * f * t)
      const env = Math.exp(-t * 7)
      data[i] = tone * env * 0.8 * amp
    }
  })
}

export const KIT_VOICES = ['kick', 'snare', 'hh', 'tom1', 'tom2', 'tom3']

export default class DrumKit {
  constructor(audioContext, options = {}) {
    this.ctx = audioContext
    this.source = options.source || 'synth'
    this.sampleUrls = options.sampleUrls || null
    this.buffers = {}
    this.ready = false
  }

  async init() {
    if (this.source === 'samples' && this.sampleUrls) {
      this.buffers = await this._loadSamples(this.sampleUrls)
    } else {
      this.buffers = this._synthesizeKit()
    }
    this.ready = true
  }

  // Engine's only entry point. Articulation is the raw symbol from the pattern
  // ('x', 'X', 'o', 'O', 'g'). Falls back to 'normal' if that articulation is
  // missing for the voice.
  getBuffer(voice, articulation = 'normal') {
    const key = this._articulationKey(voice, articulation)
    const byArt = this.buffers[voice]
    if (!byArt) return null
    return byArt[key] || byArt.normal || null
  }

  _articulationKey(voice, symbol) {
    if (symbol === 'g') return 'ghost'
    if (voice === 'hh' && symbol === 'o') return 'open'
    if (symbol === 'X' || symbol === 'O') return 'accent'
    return 'normal'
  }

  _synthesizeKit() {
    const c = this.ctx
    return {
      kick: {
        normal: synthKick(c, 0.95),
        accent: synthKick(c, 1),
      },
      snare: {
        normal: synthSnare(c, 0.85),
        accent: synthSnare(c, 1),
        ghost: synthSnare(c, 0.3),
      },
      hh: {
        normal: synthHatClosed(c, 0.7),
        accent: synthHatClosed(c, 1),
        open: synthHatOpen(c, 0.8),
      },
      tom1: { normal: synthTom(c, 220, 0.9) },
      tom2: { normal: synthTom(c, 165, 0.9) },
      tom3: { normal: synthTom(c, 120, 0.9) },
    }
  }

  async _loadSamples(urlMap) {
    const entries = await Promise.all(
      Object.entries(urlMap).map(async ([voice, aMap]) => {
        const artEntries = await Promise.all(
          Object.entries(aMap).map(async ([art, url]) => {
            const res = await fetch(url)
            const arr = await res.arrayBuffer()
            const buf = await this.ctx.decodeAudioData(arr)
            return [art, buf]
          }),
        )
        return [voice, Object.fromEntries(artEntries)]
      }),
    )
    return Object.fromEntries(entries)
  }
}
