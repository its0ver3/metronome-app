const MIN_BPM = 20
const MAX_BPM = 300
const SCHEDULE_INTERVAL_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.08
const VOICE_VARIANTS = [
  { maxBpm: 110, prefix: '' },
  { maxBpm: 155, prefix: 'fast-' },
  { maxBpm: 190, prefix: 'faster-' },
  { maxBpm: 250, prefix: 'rapid-' },
  { maxBpm: Infinity, prefix: 'max-' },
]

const palettes = [
  {
    id: 'cowbell',
    name: 'Cowbell',
    description: 'Muted supporting strikes with a more open, unmistakable first beat.',
    color: '#e5b92d',
    source: 'VCSL · CC0',
    samples: {
      soft: 'audio/vcsl/cowbell-soft.wav',
      main: 'audio/vcsl/cowbell-main.wav',
      accent: 'audio/vcsl/cowbell-accent.wav',
    },
  },
  {
    id: 'hihat',
    name: 'Hi-hat',
    description: 'A compact VCSL hi-hat: crisp, controlled, and intentionally consistent.',
    color: '#e06b58',
    source: 'VCSL · CC0',
    samples: {
      soft: 'audio/vcsl/hihat-soft.wav',
      main: 'audio/vcsl/hihat-main.wav',
      accent: 'audio/vcsl/hihat-accent.wav',
    },
  },
  {
    id: 'cajon',
    name: 'Cajón',
    description: 'A compact VCSL cajón: dry, direct, and easy to hear through a practice mix.',
    color: '#bb7d58',
    source: 'VCSL · CC0',
    samples: {
      soft: 'audio/vcsl/cajon-soft.wav',
      main: 'audio/vcsl/cajon-main.wav',
      accent: 'audio/vcsl/cajon-accent.wav',
    },
  },
  {
    id: 'shaker',
    name: 'Shaker',
    description: 'A real egg shaker with separate soft, fast, and accented gestures plus alternate hits.',
    color: '#5b9e7d',
    source: 'FreePats · CC0',
    samples: {
      soft: [
        'audio/freepats/shaker-soft-1.wav',
        'audio/freepats/shaker-soft-2.wav',
        'audio/freepats/shaker-soft-3.wav',
      ],
      main: [
        'audio/freepats/shaker-main-1.wav',
        'audio/freepats/shaker-main-2.wav',
        'audio/freepats/shaker-main-3.wav',
      ],
      accent: [
        'audio/freepats/shaker-accent-1.wav',
        'audio/freepats/shaker-accent-2.wav',
        'audio/freepats/shaker-accent-3.wav',
      ],
    },
  },
  {
    id: 'tamb',
    name: 'Tambourine',
    description: 'A new natural tambourine set with short subdivision strokes and fuller beat accents.',
    color: '#ca8548',
    source: 'FreePats · CC0',
    samples: {
      soft: [
        'audio/freepats/tamb-soft-1.wav',
        'audio/freepats/tamb-soft-2.wav',
        'audio/freepats/tamb-soft-3.wav',
      ],
      main: [
        'audio/freepats/tamb-main-1.wav',
        'audio/freepats/tamb-main-2.wav',
        'audio/freepats/tamb-main-3.wav',
      ],
      accent: [
        'audio/freepats/tamb-accent-1.wav',
        'audio/freepats/tamb-accent-2.wav',
        'audio/freepats/tamb-accent-3.wav',
      ],
    },
  },
  {
    id: 'voice-male',
    kind: 'voice',
    voiceFolder: 'voice-male',
    name: 'Male count',
    description: 'A clear, neutral male count generated locally from a public-domain voice dataset.',
    color: '#5a75c7',
    source: 'Piper John · public domain',
    samples: {
      soft: 'audio/vcsl/wood-soft.wav',
    },
  },
  {
    id: 'voice-female',
    kind: 'voice',
    voiceFolder: 'voice-female',
    name: 'Female count',
    description: 'A direct, friendly female count generated locally from public-domain recordings.',
    color: '#9c6ade',
    source: 'Piper Kristin · public domain',
    samples: {
      soft: 'audio/vcsl/wood-soft.wav',
    },
  },
]

const state = {
  paletteIndex: 0,
  bpm: 120,
  beats: 4,
  subdivision: 4,
  playing: false,
  currentBeat: -1,
  currentSubdivision: -1,
  audioContext: null,
  buffers: new Map(),
  loadingPromise: null,
  scheduleTimer: null,
  nextTickTime: 0,
  tickIndex: 0,
  visualTimers: new Set(),
  activeSources: new Set(),
}

const paletteButtons = [...document.querySelectorAll('[data-palette]')]
const paletteName = document.getElementById('palette-name')
const paletteDescription = document.getElementById('palette-description')
const palettePosition = document.getElementById('palette-position')
const footerName = document.getElementById('footer-name')
const beatOrbit = document.getElementById('beat-orbit')
const transport = document.getElementById('transport')
const transportLabel = document.getElementById('transport-label')
const bpmValue = document.getElementById('bpm-value')
const bpmSlider = document.getElementById('bpm-slider')
const beatsSelect = document.getElementById('beats-select')
const loadStatus = document.getElementById('load-status')
const modeNote = document.getElementById('mode-note')
const voiceNumber = document.getElementById('voice-number')
const soundScreen = document.querySelector('.sound-screen')

renderAll()

document.addEventListener('click', async (event) => {
  const paletteControl = event.target.closest('[data-palette]')
  if (paletteControl) {
    await selectPalette(palettes.findIndex((palette) => palette.id === paletteControl.dataset.palette), true)
    return
  }

  const actionControl = event.target.closest('[data-action]')
  if (!actionControl) return

  const action = actionControl.dataset.action
  if (action === 'toggle-play') await togglePlay()
  if (action === 'bpm-down') setBpm(state.bpm - 1)
  if (action === 'bpm-up') setBpm(state.bpm + 1)
  if (action === 'previous-palette') await selectPalette(state.paletteIndex - 1, true)
  if (action === 'next-palette') await selectPalette(state.paletteIndex + 1, true)
})

bpmSlider.addEventListener('input', () => setBpm(Number(bpmSlider.value)))

beatsSelect.addEventListener('change', () => {
  state.beats = Number(beatsSelect.value)
  restartSequence()
  renderOrbit()
})

document.addEventListener('keydown', async (event) => {
  if (event.code !== 'Space' || event.target.matches('button, input, select')) return
  event.preventDefault()
  await togglePlay()
})

async function selectPalette(index, audition = false) {
  const wasPlaying = state.playing
  stopActiveSources()
  state.paletteIndex = (index + palettes.length) % palettes.length
  state.currentBeat = -1
  state.currentSubdivision = -1
  renderAll()

  if (wasPlaying) {
    restartSequence()
    return
  }

  if (audition) await auditionCurrentPalette()
}

function setBpm(nextBpm) {
  state.bpm = clamp(Math.round(nextBpm), MIN_BPM, MAX_BPM)
  bpmSlider.value = String(state.bpm)
  bpmSlider.setAttribute('aria-valuetext', `${state.bpm} beats per minute`)
  bpmValue.textContent = String(state.bpm)
  if (state.playing) restartSequence()
}

async function togglePlay() {
  if (state.playing) {
    stopTransport()
    renderTransport()
    return
  }

  try {
    await ensureAudioReady()
    state.playing = true
    state.tickIndex = 0
    state.nextTickTime = state.audioContext.currentTime + 0.045
    scheduler()
    renderTransport()
  } catch (error) {
    showLoadError(error)
  }
}

async function ensureAudioReady() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) throw new Error('Web Audio is not available in this browser.')
    state.audioContext = new AudioContextClass({ latencyHint: 'interactive' })
  }

  if (state.audioContext.state === 'suspended') await state.audioContext.resume()
  if (state.buffers.size) return
  if (state.loadingPromise) return state.loadingPromise

  loadStatus.textContent = 'Loading sound library…'
  state.loadingPromise = loadAudioLibrary()

  try {
    await state.loadingPromise
    loadStatus.textContent = 'Sound library ready'
    loadStatus.classList.add('is-ready')
  } finally {
    state.loadingPromise = null
  }
}

async function loadAudioLibrary() {
  const sampleUrls = new Set()
  palettes.forEach((palette) => {
    Object.values(palette.samples).forEach((sampleValue) => {
      sampleList(sampleValue).forEach((url) => sampleUrls.add(url))
    })

    if (palette.kind === 'voice') {
      VOICE_VARIANTS.forEach(({ prefix }) => {
        for (let number = 1; number <= 10; number += 1) {
          sampleUrls.add(`audio/${palette.voiceFolder}/${prefix}${number}.wav`)
        }
      })
    }
  })

  await Promise.all([...sampleUrls].map(async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not load ${url}`)
    const bytes = await response.arrayBuffer()
    const buffer = await state.audioContext.decodeAudioData(bytes)
    state.buffers.set(url, buffer)
  }))
}

function scheduler() {
  if (!state.playing || !state.audioContext) return

  while (state.nextTickTime < state.audioContext.currentTime + SCHEDULE_AHEAD_SECONDS) {
    scheduleTick(state.nextTickTime, state.tickIndex)
    state.nextTickTime += secondsPerTick()
    state.tickIndex += 1
  }

  state.scheduleTimer = window.setTimeout(scheduler, SCHEDULE_INTERVAL_MS)
}

function scheduleTick(time, tickIndex) {
  const subdivisionIndex = tickIndex % state.subdivision
  const beatIndex = Math.floor(tickIndex / state.subdivision) % state.beats
  const palette = palettes[state.paletteIndex]

  if (palette.kind === 'voice' && subdivisionIndex === 0) {
    scheduleVoice(time, beatIndex, palette)
  } else {
    const role = subdivisionIndex > 0 ? 'soft' : beatIndex === 0 ? 'accent' : 'main'
    scheduleBuffer(sampleForRole(palette, role, tickIndex), time, 1)
  }

  const delay = Math.max(0, (time - state.audioContext.currentTime) * 1000)
  const timer = window.setTimeout(() => {
    state.visualTimers.delete(timer)
    showCurrentTick(beatIndex, subdivisionIndex)
  }, delay)
  state.visualTimers.add(timer)
}

function scheduleVoice(time, beatIndex, palette) {
  const number = beatIndex + 1
  const prefix = voiceVariantForBpm(state.bpm)
  const url = `audio/${palette.voiceFolder}/${prefix}${number}.wav`
  scheduleBuffer(url, time, 1, beatIndex === 0 ? 1.08 : 0.92)
}

function scheduleBuffer(url, time, playbackRate = 1, gainValue = 1) {
  const buffer = state.buffers.get(url)
  if (!buffer || !state.audioContext) return

  const source = state.audioContext.createBufferSource()
  const gain = state.audioContext.createGain()
  source.buffer = buffer
  source.playbackRate.value = playbackRate
  gain.gain.value = gainValue
  source.connect(gain)
  gain.connect(state.audioContext.destination)
  source.addEventListener('ended', () => state.activeSources.delete(source), { once: true })
  state.activeSources.add(source)
  source.start(time)
}

async function auditionCurrentPalette() {
  try {
    await ensureAudioReady()
    const palette = palettes[state.paletteIndex]
    const now = state.audioContext.currentTime + 0.025

    const sixteenthSeconds = 60 / state.bpm / 4
    for (let tick = 0; tick < 8; tick += 1) {
      const beatIndex = Math.floor(tick / 4)
      const subdivisionIndex = tick % 4
      const time = now + tick * sixteenthSeconds

      if (palette.kind === 'voice' && subdivisionIndex === 0) {
        scheduleVoice(time, beatIndex, palette)
      } else {
        const role = subdivisionIndex > 0 ? 'soft' : beatIndex === 0 ? 'accent' : 'main'
        scheduleBuffer(sampleForRole(palette, role, tick), time, 1)
      }
    }
  } catch (error) {
    showLoadError(error)
  }
}

function restartSequence() {
  state.currentBeat = -1
  state.currentSubdivision = -1
  window.clearTimeout(state.scheduleTimer)
  state.scheduleTimer = null
  clearVisualTimers()
  if (!state.playing || !state.audioContext) return
  stopActiveSources()
  state.tickIndex = 0
  state.nextTickTime = state.audioContext.currentTime + 0.045
  scheduler()
}

function stopTransport() {
  state.playing = false
  window.clearTimeout(state.scheduleTimer)
  state.scheduleTimer = null
  clearVisualTimers()
  stopActiveSources()
  state.currentBeat = -1
  state.currentSubdivision = -1
  voiceNumber.textContent = ''
  renderOrbit()
}

function stopActiveSources() {
  state.activeSources.forEach((source) => {
    try {
      source.stop()
    } catch {
      // A source may already have ended between scheduling and cleanup.
    }
  })
  state.activeSources.clear()
}

function clearVisualTimers() {
  state.visualTimers.forEach((timer) => window.clearTimeout(timer))
  state.visualTimers.clear()
}

function showCurrentTick(beatIndex, subdivisionIndex) {
  state.currentBeat = beatIndex
  state.currentSubdivision = subdivisionIndex
  renderOrbit()

  if (palettes[state.paletteIndex].kind !== 'voice' || subdivisionIndex !== 0) return
  voiceNumber.textContent = String(beatIndex + 1)
  voiceNumber.classList.remove('is-hit')
  void voiceNumber.offsetWidth
  voiceNumber.classList.add('is-hit')
}

function renderAll() {
  const palette = palettes[state.paletteIndex]
  document.documentElement.style.setProperty('--pulse', palette.color)

  paletteButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.palette === palette.id))
  })
  paletteName.textContent = palette.name
  paletteDescription.textContent = palette.description
  palettePosition.textContent = `Option ${state.paletteIndex + 1} of ${palettes.length}`
  footerName.textContent = palette.name
  document.querySelector('.screen-footer small').textContent = palette.source
  soundScreen.classList.toggle('is-counting', palette.kind === 'voice')
  modeNote.textContent = palette.kind === 'voice'
    ? 'The voice names each beat at a pitch-preserving tempo while three quiet clicks complete the sixteenth notes.'
    : `${sampleList(palette.samples.soft).length > 1 ? 'Alternate hits rotate naturally. ' : ''}Beat one is accented; every beat is filled with four sixteenth-note clicks.`

  if (palette.kind !== 'voice') voiceNumber.textContent = ''
  renderOrbit()
  renderTransport()
  setBpm(state.bpm)
}

function renderOrbit() {
  beatOrbit.innerHTML = Array.from({ length: state.beats }, (_, index) => {
    const classes = [
      'beat-dot',
      index === 0 ? 'is-first' : '',
      index === state.currentBeat && state.currentSubdivision === 0 ? 'is-current' : '',
    ].filter(Boolean).join(' ')
    return `<span class="${classes}" style="--index:${index};--count:${state.beats}"></span>`
  }).join('')
}

function renderTransport() {
  transport.classList.toggle('is-playing', state.playing)
  transport.setAttribute('aria-label', state.playing ? 'Stop metronome' : 'Start metronome')
  transportLabel.textContent = state.playing ? 'Stop' : 'Play'
}

function showLoadError(error) {
  console.error(error)
  loadStatus.textContent = 'Sounds could not load'
  loadStatus.classList.remove('is-ready')
  loadStatus.classList.add('is-error')
  stopTransport()
  renderTransport()
}

function secondsPerTick() {
  return 60 / state.bpm / state.subdivision
}

function sampleForRole(palette, role, sequenceIndex) {
  const candidates = sampleList(palette.samples[role])
  return candidates[sequenceIndex % candidates.length]
}

function sampleList(sampleValue) {
  return Array.isArray(sampleValue) ? sampleValue : [sampleValue]
}

function voiceVariantForBpm(bpm) {
  return VOICE_VARIANTS.find(({ maxBpm }) => bpm <= maxBpm).prefix
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
