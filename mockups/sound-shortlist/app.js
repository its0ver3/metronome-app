const STORAGE_KEY = 'drums-only-sound-shortlist-v1'
const DEFAULT_SELECTIONS = ['vcsl-hihat', 'vcsl-cajon']
const PREVIEW_BPM = 120

const sounds = [
  {
    id: 'current-classic-click',
    group: 'current',
    name: 'Classic Click',
    detail: 'Current app · synthesized',
    tone: '#477ce8',
    preview: {
      type: 'synth',
      main: { frequency: 1000, duration: 0.03, wave: 'square' },
      accent: { frequency: 1500, duration: 0.035, wave: 'square' },
    },
  },
  {
    id: 'current-woodblock',
    group: 'current',
    name: 'Woodblock',
    detail: 'Current app · synthesized',
    tone: '#9a704e',
    preview: {
      type: 'synth',
      main: { frequency: 600, duration: 0.05, wave: 'triangle' },
      accent: { frequency: 900, duration: 0.06, wave: 'triangle' },
    },
  },
  {
    id: 'current-rimshot',
    group: 'current',
    name: 'Rimshot',
    detail: 'Current app · synthesized',
    tone: '#d15f54',
    preview: {
      type: 'synth',
      main: { frequency: 900, duration: 0.04, wave: 'sine', noise: 0.5 },
      accent: { frequency: 1350, duration: 0.055, wave: 'sine', noise: 0.35 },
    },
  },
  {
    id: 'current-cowbell',
    group: 'current',
    name: 'Cowbell',
    detail: 'Current app · synthesized',
    tone: '#d1a82e',
    preview: {
      type: 'synth',
      main: { frequency: 540, duration: 0.08, wave: 'square', noise: 0.1 },
      accent: { frequency: 810, duration: 0.1, wave: 'square', noise: 0.05 },
    },
  },
  {
    id: 'current-hihat',
    group: 'current',
    name: 'Hi-Hat',
    detail: 'Current app · synthesized',
    tone: '#e26b58',
    preview: {
      type: 'synth',
      main: { frequency: 8000, duration: 0.04, wave: 'noise' },
      accent: { frequency: 8000, duration: 0.065, wave: 'noise' },
    },
  },
  {
    id: 'current-electronic-beep',
    group: 'current',
    name: 'Electronic Beep',
    detail: 'Current app · synthesized',
    tone: '#8a66d1',
    preview: {
      type: 'synth',
      main: { frequency: 880, duration: 0.05, wave: 'sine' },
      accent: { frequency: 1320, duration: 0.07, wave: 'sine' },
    },
  },
  {
    id: 'current-soft-tone',
    group: 'current',
    name: 'Soft Tone',
    detail: 'Current app · synthesized',
    tone: '#4e9e7c',
    preview: {
      type: 'synth',
      main: { frequency: 440, duration: 0.06, wave: 'sine' },
      accent: { frequency: 660, duration: 0.08, wave: 'sine' },
    },
  },
  {
    id: 'current-stick-click',
    group: 'current',
    name: 'Stick Click',
    detail: 'Current app · synthesized',
    tone: '#6e7d8d',
    preview: {
      type: 'synth',
      main: { frequency: 2500, duration: 0.015, wave: 'noise', noise: 0.3 },
      accent: { frequency: 2500, duration: 0.026, wave: 'noise', noise: 0.2 },
    },
  },
  {
    id: 'vcsl-cowbell',
    group: 'candidate',
    name: 'Cowbell',
    detail: 'VCSL recording · CC0',
    tone: '#d1a82e',
    preview: samplePreview('cowbell'),
  },
  {
    id: 'vcsl-hihat',
    group: 'candidate',
    name: 'Hi-hat',
    detail: 'VCSL recording · chosen',
    tone: '#e26b58',
    preview: samplePreview('hihat'),
  },
  {
    id: 'vcsl-cajon',
    group: 'candidate',
    name: 'Cajón',
    detail: 'VCSL recording · chosen',
    tone: '#ba7a55',
    preview: samplePreview('cajon'),
  },
  {
    id: 'freepats-shaker',
    group: 'candidate',
    name: 'Shaker',
    detail: 'FreePats recording · CC0',
    tone: '#509b77',
    preview: roundRobinPreview('shaker'),
  },
  {
    id: 'freepats-tambourine',
    group: 'candidate',
    name: 'Tambourine',
    detail: 'FreePats recording · CC0',
    tone: '#c77f42',
    preview: roundRobinPreview('tamb'),
  },
  {
    id: 'voice-male',
    group: 'candidate',
    name: 'Male Count',
    detail: 'Spoken 1–4 · fixed pitch',
    tone: '#5570c1',
    preview: { type: 'voice', folder: 'voice-male' },
  },
  {
    id: 'voice-female',
    group: 'candidate',
    name: 'Female Count',
    detail: 'Spoken 1–4 · fixed pitch',
    tone: '#9465d4',
    preview: { type: 'voice', folder: 'voice-female' },
  },
]

const selected = loadSelections()
const state = {
  audioContext: null,
  buffers: new Map(),
  bufferPromises: new Map(),
  synthBuffers: new Map(),
  activeSources: new Set(),
  previewTimer: null,
  activeSoundId: null,
  previewToken: 0,
}

const currentGrid = document.getElementById('current-grid')
const candidateGrid = document.getElementById('candidate-grid')
const selectionCount = document.getElementById('selection-count')
const audioStatus = document.getElementById('audio-status')

renderSounds()
renderSelectionState()

document.addEventListener('click', async (event) => {
  const previewButton = event.target.closest('[data-preview]')
  if (!previewButton) return
  const sound = sounds.find(({ id }) => id === previewButton.dataset.preview)
  if (sound) await previewSound(sound)
})

document.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-keep]')
  if (!checkbox) return

  if (checkbox.checked) selected.add(checkbox.dataset.keep)
  else selected.delete(checkbox.dataset.keep)

  saveSelections()
  renderSelectionState()
})

function renderSounds() {
  currentGrid.innerHTML = sounds.filter(({ group }) => group === 'current').map(soundMarkup).join('')
  candidateGrid.innerHTML = sounds.filter(({ group }) => group === 'candidate').map(soundMarkup).join('')
}

function soundMarkup(sound) {
  const isChecked = selected.has(sound.id)
  return `
    <article class="sound-pill${isChecked ? ' is-kept' : ''}" data-sound-pill="${sound.id}" style="--tone:${sound.tone}">
      <button type="button" class="sound-preview" data-preview="${sound.id}" aria-label="Preview ${sound.name}" aria-pressed="false">
        <span class="play-mark" aria-hidden="true"></span>
        <span class="sound-copy">
          <strong>${sound.name}</strong>
          <small>${sound.detail}</small>
        </span>
      </button>
      <label class="keep-control">
        <input type="checkbox" data-keep="${sound.id}" ${isChecked ? 'checked' : ''} />
        <span class="checkbox-ui" aria-hidden="true">✓</span>
        <span class="sr-only">Keep ${sound.name}: ${sound.detail}</span>
      </label>
    </article>`
}

function renderSelectionState() {
  document.querySelectorAll('[data-sound-pill]').forEach((pill) => {
    pill.classList.toggle('is-kept', selected.has(pill.dataset.soundPill))
  })
  selectionCount.textContent = `${selected.size} selected`
}

async function previewSound(sound) {
  const wasActive = state.activeSoundId === sound.id
  cancelPreview()

  if (wasActive) {
    audioStatus.textContent = 'Preview stopped'
    return
  }

  const token = state.previewToken
  const pill = document.querySelector(`[data-sound-pill="${sound.id}"]`)
  const button = pill.querySelector('[data-preview]')
  pill.classList.add('is-playing')
  button.setAttribute('aria-pressed', 'true')
  state.activeSoundId = sound.id
  audioStatus.textContent = `Loading ${sound.name}…`

  try {
    const context = await ensureAudioContext()
    await preparePreview(sound)
    if (token !== state.previewToken) return

    const startTime = context.currentTime + 0.045
    const duration = sound.preview.type === 'voice'
      ? scheduleVoicePreview(sound, startTime)
      : schedulePercussionPreview(sound, startTime)

    audioStatus.textContent = `Playing ${sound.name}`
    state.previewTimer = window.setTimeout(() => {
      finishPreview()
      audioStatus.textContent = 'Choices save automatically'
    }, duration * 1000)
  } catch (error) {
    console.error(error)
    finishPreview()
    audioStatus.textContent = `${sound.name} could not load`
  }
}

async function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) throw new Error('Web Audio is unavailable in this browser.')
    state.audioContext = new AudioContextClass({ latencyHint: 'interactive' })
  }
  if (state.audioContext.state === 'suspended') await state.audioContext.resume()
  return state.audioContext
}

async function preparePreview(sound) {
  if (sound.preview.type === 'synth') {
    synthBuffer(sound.id, 'main', sound.preview.main)
    synthBuffer(sound.id, 'accent', sound.preview.accent)
    return
  }

  const urls = sound.preview.type === 'voice'
    ? [
        '../sound-library-lab/audio/vcsl/wood-soft.wav',
        ...Array.from({ length: 4 }, (_, index) => `../sound-library-lab/audio/${sound.preview.folder}/fast-${index + 1}.wav`),
      ]
    : Object.values(sound.preview.samples).flatMap(sampleList)

  await Promise.all(urls.map(loadBuffer))
}

function schedulePercussionPreview(sound, startTime) {
  const sixteenthSeconds = 60 / PREVIEW_BPM / 4
  for (let tick = 0; tick < 8; tick += 1) {
    const time = startTime + tick * sixteenthSeconds
    const isDownbeat = tick === 0
    const isBeat = tick % 4 === 0

    if (sound.preview.type === 'synth') {
      const role = isDownbeat ? 'accent' : 'main'
      const buffer = state.synthBuffers.get(`${sound.id}:${role}`)
      scheduleBuffer(buffer, time, isDownbeat ? 1 : isBeat ? 0.72 : 0.27)
      continue
    }

    const role = isDownbeat ? 'accent' : isBeat ? 'main' : 'soft'
    const candidates = sampleList(sound.preview.samples[role])
    const url = candidates[tick % candidates.length]
    scheduleBuffer(state.buffers.get(url), time, 1)
  }
  return 1.18
}

function scheduleVoicePreview(sound, startTime) {
  const sixteenthSeconds = 60 / PREVIEW_BPM / 4
  const beatSeconds = 60 / PREVIEW_BPM
  const wood = state.buffers.get('../sound-library-lab/audio/vcsl/wood-soft.wav')

  for (let tick = 0; tick < 16; tick += 1) {
    if (tick % 4 === 0) continue
    scheduleBuffer(wood, startTime + tick * sixteenthSeconds, 0.34)
  }

  for (let number = 1; number <= 4; number += 1) {
    const url = `../sound-library-lab/audio/${sound.preview.folder}/fast-${number}.wav`
    scheduleBuffer(state.buffers.get(url), startTime + (number - 1) * beatSeconds, number === 1 ? 1.05 : 0.92)
  }
  return 2.2
}

function synthBuffer(soundId, role, definition) {
  const key = `${soundId}:${role}`
  if (state.synthBuffers.has(key)) return state.synthBuffers.get(key)

  const context = state.audioContext
  const length = Math.floor(context.sampleRate * definition.duration)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  const noiseAmount = definition.noise || 0

  for (let index = 0; index < length; index += 1) {
    const time = index / context.sampleRate
    const envelope = Math.exp(-time * (1 / definition.duration) * 8)
    let sample = 0

    if (definition.wave === 'sine') sample = Math.sin(2 * Math.PI * definition.frequency * time)
    if (definition.wave === 'square') sample = Math.sin(2 * Math.PI * definition.frequency * time) > 0 ? 1 : -1
    if (definition.wave === 'triangle') sample = 2 * Math.abs(2 * (time * definition.frequency - Math.floor(time * definition.frequency + 0.5))) - 1
    if (definition.wave === 'noise') sample = Math.random() * 2 - 1

    if (noiseAmount > 0) {
      sample = sample * (1 - noiseAmount) + (Math.random() * 2 - 1) * noiseAmount
    }
    data[index] = sample * envelope * 0.8
  }

  state.synthBuffers.set(key, buffer)
  return buffer
}

async function loadBuffer(url) {
  if (state.buffers.has(url)) return state.buffers.get(url)
  if (state.bufferPromises.has(url)) return state.bufferPromises.get(url)

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${url}`)
      return response.arrayBuffer()
    })
    .then((bytes) => state.audioContext.decodeAudioData(bytes))
    .then((buffer) => {
      state.buffers.set(url, buffer)
      state.bufferPromises.delete(url)
      return buffer
    })
    .catch((error) => {
      state.bufferPromises.delete(url)
      throw error
    })

  state.bufferPromises.set(url, promise)
  return promise
}

function scheduleBuffer(buffer, time, gainValue) {
  if (!buffer || !state.audioContext) return
  const source = state.audioContext.createBufferSource()
  const gain = state.audioContext.createGain()
  source.buffer = buffer
  gain.gain.value = gainValue
  source.connect(gain)
  gain.connect(state.audioContext.destination)
  source.addEventListener('ended', () => state.activeSources.delete(source), { once: true })
  state.activeSources.add(source)
  source.start(time)
}

function cancelPreview() {
  state.previewToken += 1
  window.clearTimeout(state.previewTimer)
  state.previewTimer = null
  state.activeSources.forEach((source) => {
    try {
      source.stop()
    } catch {
      // The source may have ended between scheduling and cleanup.
    }
  })
  state.activeSources.clear()
  finishPreview()
}

function finishPreview() {
  document.querySelectorAll('.sound-pill.is-playing').forEach((pill) => {
    pill.classList.remove('is-playing')
    pill.querySelector('[data-preview]').setAttribute('aria-pressed', 'false')
  })
  state.activeSoundId = null
}

function loadSelections() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === null) return new Set(DEFAULT_SELECTIONS)
    const parsed = JSON.parse(stored)
    return new Set(Array.isArray(parsed) ? parsed : DEFAULT_SELECTIONS)
  } catch {
    return new Set(DEFAULT_SELECTIONS)
  }
}

function saveSelections() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
  } catch {
    audioStatus.textContent = 'Selections saved for this visit'
  }
}

function samplePreview(name) {
  return {
    type: 'sample',
    samples: {
      soft: `../sound-library-lab/audio/vcsl/${name}-soft.wav`,
      main: `../sound-library-lab/audio/vcsl/${name}-main.wav`,
      accent: `../sound-library-lab/audio/vcsl/${name}-accent.wav`,
    },
  }
}

function roundRobinPreview(name) {
  const roleSamples = (role) => Array.from(
    { length: 3 },
    (_, index) => `../sound-library-lab/audio/freepats/${name}-${role}-${index + 1}.wav`,
  )
  return {
    type: 'sample',
    samples: {
      soft: roleSamples('soft'),
      main: roleSamples('main'),
      accent: roleSamples('accent'),
    },
  }
}

function sampleList(value) {
  return Array.isArray(value) ? value : [value]
}
