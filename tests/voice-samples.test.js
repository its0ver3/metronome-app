import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const productionVoiceRoot = `${root}public/audio/metronome`
const tiers = [
  { prefix: '', minimumSeconds: 0.4 },
  { prefix: 'fast-', minimumSeconds: 0.3 },
  { prefix: 'faster-', minimumSeconds: 0.24 },
  { prefix: 'rapid-', minimumSeconds: 0.18 },
  { prefix: 'max-', minimumSeconds: 0.145 },
]

test('male and female count-three clips retain the complete spoken word at every tempo tier', () => {
  for (const voice of ['voice-male', 'voice-female']) {
    for (const { prefix, minimumSeconds } of tiers) {
      const path = `${productionVoiceRoot}/${voice}/${prefix}3.wav`
      const duration = wavDuration(path)
      assert.ok(
        duration >= minimumSeconds,
        `${voice}/${prefix}3.wav is ${duration.toFixed(3)}s; expected at least ${minimumSeconds}s`,
      )
    }
  }
})

test('male and female counts stay centered while retaining natural pitch movement', () => {
  const voices = [
    { directory: 'voice-male', targetPitch: 95, minimumPitch: 60, maximumPitch: 125 },
    { directory: 'voice-female', targetPitch: 137, minimumPitch: 105, maximumPitch: 185 },
  ]

  for (const { directory, targetPitch, minimumPitch, maximumPitch } of voices) {
    const centerPitches = []
    let countsWithNaturalMovement = 0

    for (let count = 1; count <= 10; count += 1) {
      const path = `${productionVoiceRoot}/${directory}/${count}.wav`
      const framePitches = estimatePitchFrames(path, targetPitch)
      framePitches.sort((left, right) => left - right)
      const centerPitch = percentile(framePitches, 0.5)
      const pitchMovement = percentile(framePitches, 0.9) - percentile(framePitches, 0.1)
      centerPitches.push(centerPitch)
      if (pitchMovement >= 4) countsWithNaturalMovement += 1

      assert.ok(
        centerPitch >= minimumPitch && centerPitch <= maximumPitch,
        `${directory}/${count}.wav is centered at ${centerPitch.toFixed(1)} Hz; expected the ${minimumPitch}–${maximumPitch} Hz vocal range`,
      )
    }

    const averageCenter = centerPitches.reduce((sum, pitch) => sum + pitch, 0) / centerPitches.length
    assert.ok(
      Math.abs(averageCenter - targetPitch) <= 15,
      `${directory} averages ${averageCenter.toFixed(1)} Hz; expected to remain near ${targetPitch} Hz`,
    )
    assert.ok(
      countsWithNaturalMovement >= 6,
      `${directory} has natural pitch movement in only ${countsWithNaturalMovement} counts; expected at least 6`,
    )
  }
})

test('production voices cover every count from 1–16 at every tempo tier', () => {
  const maximumDurations = {
    '': 0.56,
    'fast-': 0.43,
    'faster-': 0.35,
    'rapid-': 0.27,
    'max-': 0.22,
  }

  for (const voice of ['voice-male', 'voice-female']) {
    for (const { prefix } of tiers) {
      for (let count = 1; count <= 16; count += 1) {
        const path = `${productionVoiceRoot}/${voice}/${prefix}${count}.wav`
        const duration = wavDuration(path)
        assert.ok(duration >= 0.1, `${voice}/${prefix}${count}.wav is unexpectedly short`)
        assert.ok(
          duration <= maximumDurations[prefix],
          `${voice}/${prefix}${count}.wav is ${duration.toFixed(3)}s; expected at most ${maximumDurations[prefix]}s`,
        )
      }
    }
  }
})

function wavDuration(path) {
  const { byteRate, dataBytes } = readWav(path)
  return dataBytes / byteRate
}

function estimatePitchFrames(path, targetPitch) {
  const { sampleRate, samples } = readWav(path)
  const downsampleFactor = Math.max(1, Math.round(sampleRate / 8000))
  const analysisRate = sampleRate / downsampleFactor
  const downsampled = []

  for (let index = 0; index < samples.length; index += downsampleFactor) {
    downsampled.push(samples[index])
  }

  const frameLength = Math.round(analysisRate * 0.04)
  const hopLength = Math.round(analysisRate * 0.01)
  const minimumPitch = targetPitch * 0.65
  const maximumPitch = targetPitch * 1.4
  const minimumLag = Math.floor(analysisRate / maximumPitch)
  const maximumLag = Math.ceil(analysisRate / minimumPitch)
  const framePitches = []

  for (let start = 0; start + frameLength <= downsampled.length; start += hopLength) {
    const frame = downsampled.slice(start, start + frameLength)
    const mean = frame.reduce((sum, value) => sum + value, 0) / frame.length
    const centered = frame.map((value) => value - mean)
    const rms = Math.sqrt(centered.reduce((sum, value) => sum + value * value, 0) / centered.length)

    if (rms < 500) continue

    let bestLag = null
    let bestCorrelation = -Infinity

    for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
      let product = 0
      let leftEnergy = 0
      let rightEnergy = 0

      for (let index = 0; index < centered.length - lag; index += 1) {
        const left = centered[index]
        const right = centered[index + lag]
        product += left * right
        leftEnergy += left * left
        rightEnergy += right * right
      }

      const correlation = product / Math.sqrt(leftEnergy * rightEnergy)
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    }

    if (bestLag !== null && bestCorrelation >= 0.45) {
      framePitches.push(analysisRate / bestLag)
    }
  }

  assert.ok(framePitches.length > 0, `Could not estimate pitch for ${path}`)
  return framePitches
}

function percentile(sortedValues, fraction) {
  return sortedValues[Math.floor((sortedValues.length - 1) * fraction)]
}

function readWav(path) {
  const wav = readFileSync(path)
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF')
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE')

  let offset = 12
  let byteRate = null
  let sampleRate = null
  let audioFormat = null
  let channelCount = null
  let bitsPerSample = null
  let dataStart = null
  let dataBytes = null

  while (offset + 8 <= wav.length) {
    const chunkId = wav.toString('ascii', offset, offset + 4)
    const chunkSize = wav.readUInt32LE(offset + 4)
    const chunkStart = offset + 8

    if (chunkId === 'fmt ') {
      audioFormat = wav.readUInt16LE(chunkStart)
      channelCount = wav.readUInt16LE(chunkStart + 2)
      sampleRate = wav.readUInt32LE(chunkStart + 4)
      byteRate = wav.readUInt32LE(chunkStart + 8)
      bitsPerSample = wav.readUInt16LE(chunkStart + 14)
    }
    if (chunkId === 'data') {
      dataStart = chunkStart
      dataBytes = chunkSize
    }

    offset = chunkStart + chunkSize + (chunkSize % 2)
  }

  assert.equal(audioFormat, 1, `${path} must be PCM WAV audio`)
  assert.equal(channelCount, 1, `${path} must be mono`)
  assert.equal(bitsPerSample, 16, `${path} must be 16-bit`)
  assert.ok(sampleRate && byteRate && dataStart !== null && dataBytes !== null, `Could not read WAV data for ${path}`)

  const samples = new Int16Array(dataBytes / 2)
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = wav.readInt16LE(dataStart + index * 2)
  }

  return { sampleRate, byteRate, dataBytes, samples }
}
