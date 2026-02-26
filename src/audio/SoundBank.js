import { SOUND_NAMES } from './constants'

/**
 * Synthesizes click sounds directly using Web Audio API.
 * No external WAV files needed — generates 8 distinct sounds.
 */

function createClickBuffer(ctx, freq, duration, type = 'sine', noiseAmount = 0) {
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
    } else if (type === 'noise') {
      sample = Math.random() * 2 - 1
    }

    if (noiseAmount > 0) {
      sample = sample * (1 - noiseAmount) + (Math.random() * 2 - 1) * noiseAmount
    }

    data[i] = sample * envelope * 0.8
  }

  return buffer
}

function synthesizeSounds(ctx) {
  return [
    // Classic Click - short high-pitched tick
    createClickBuffer(ctx, 1000, 0.03, 'square'),
    // Woodblock - hollow mid tone
    createClickBuffer(ctx, 600, 0.05, 'triangle'),
    // Rimshot - snappy noise burst
    createClickBuffer(ctx, 900, 0.04, 'sine', 0.5),
    // Cowbell - metallic ring
    createClickBuffer(ctx, 540, 0.08, 'square', 0.1),
    // Hi-Hat - noise burst
    createClickBuffer(ctx, 8000, 0.04, 'noise'),
    // Electronic Beep - clean sine
    createClickBuffer(ctx, 880, 0.05, 'sine'),
    // Soft Tone - low gentle tone
    createClickBuffer(ctx, 440, 0.06, 'sine'),
    // Stick Click - very short attack
    createClickBuffer(ctx, 2500, 0.015, 'noise', 0.3),
  ]
}

export default class SoundBank {
  constructor(audioContext) {
    this.ctx = audioContext
    this.buffers = []
    this.ready = false
  }

  async init() {
    this.buffers = synthesizeSounds(this.ctx)
    this.ready = true
  }

  getBuffer(index) {
    return this.buffers[index] || this.buffers[0]
  }

  getAccentBuffer(index) {
    // Return a higher-pitched version for accent beats
    // We just use the same buffer — volume differentiation handles accents
    return this.getBuffer(index)
  }

  getSubdivisionBuffer(index) {
    // Quieter, shorter version for subdivision clicks
    // We synthesize on the fly a softer variant
    if (!this._subBuffers) {
      this._subBuffers = [
        createClickBuffer(this.ctx, 1200, 0.015, 'square'),
        createClickBuffer(this.ctx, 800, 0.025, 'triangle'),
        createClickBuffer(this.ctx, 1100, 0.02, 'sine', 0.3),
        createClickBuffer(this.ctx, 700, 0.04, 'square', 0.1),
        createClickBuffer(this.ctx, 10000, 0.02, 'noise'),
        createClickBuffer(this.ctx, 1200, 0.025, 'sine'),
        createClickBuffer(this.ctx, 600, 0.03, 'sine'),
        createClickBuffer(this.ctx, 3500, 0.01, 'noise', 0.3),
      ]
    }
    return this._subBuffers[index] || this._subBuffers[0]
  }

  get count() {
    return this.buffers.length
  }
}
