const MIN_BPM = 20
const MAX_BPM = 300

const schemes = [
  {
    id: 'blue-olive',
    name: 'Blue Olive',
    description: 'Pulled directly from the badge: deep teal, enamel blue, warm paper, and olive gold.',
    colors: ['#154B55', '#3D8790', '#D8D0B7', '#AAA14E'],
    stops: [0, 0.32, 0.69, 1],
    story: 'Badge-native and quietly playful',
    motion: 'Clean enamel rail + brushed hatch',
  },
  {
    id: 'backline',
    name: 'Backline Glow',
    description: 'A dark stage palette that blooms from indigo into violet, coral, and warm spotlight amber.',
    colors: ['#24245F', '#6355CF', '#C54F9B', '#EF8A4C'],
    stops: [0, 0.38, 0.7, 1],
    story: 'Night-stage colour with a warm finish',
    motion: 'Wide atmospheric bloom + glass highlight',
  },
  {
    id: 'warm-tape',
    name: 'Warm Tape',
    description: 'Cream, studio-lamp apricot, worn orange, and oxblood with a tactile grip-tape texture.',
    colors: ['#E7DDC7', '#E6A36F', '#D85A3D', '#7C2636'],
    stops: [0, 0.37, 0.7, 1],
    story: 'Warm, analog, and drum-shop familiar',
    motion: 'Chunky rail + diagonal grip texture',
  },
  {
    id: 'chrome',
    name: 'Chrome Meter',
    description: 'A restrained hardware palette that moves through steel, brushed silver, ivory, and aged brass.',
    colors: ['#4C6470', '#9DA9A9', '#EEE7D9', '#B79B5F'],
    stops: [0, 0.34, 0.68, 1],
    story: 'Premium instrument hardware, low saturation',
    motion: 'Recessed gauge + precise meter slots',
  },
  {
    id: 'afterbeat',
    name: 'Afterbeat',
    description: 'Petrol blue grows into mint, chartreuse, and a sunny yellow flash—friendly without feeling childish.',
    colors: ['#0C5961', '#2B9C8E', '#9ACB62', '#F1C453'],
    stops: [0, 0.35, 0.68, 1],
    story: 'Bright personality grounded by deep petrol',
    motion: 'Dotted pulse rail + lively localized glow',
  },
]

const stage = document.getElementById('concept-stage')
const slider = document.getElementById('tempo-slider')
const bpmReadout = document.getElementById('bpm-readout')
const energyLabel = document.getElementById('energy-label')
const conceptNumber = document.getElementById('concept-number')
const conceptName = document.getElementById('concept-name')
const conceptDescription = document.getElementById('concept-description')
const colorStory = document.getElementById('color-story')
const motionStory = document.getElementById('motion-story')
const palette = document.getElementById('palette')
const compareGrid = document.getElementById('compare-grid')
const tabs = [...document.querySelectorAll('[data-scheme]')]

let selectedScheme = schemes[0]
let lastBpm = Number(slider.value)
let settleTimer = null

function hexToRgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}

function rgbToHex(rgb) {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

function mixColor(start, end, amount) {
  const startRgb = hexToRgb(start)
  const endRgb = hexToRgb(end)
  return rgbToHex(startRgb.map((channel, index) => channel + ((endRgb[index] - channel) * amount)))
}

function colorAtProgress(scheme, progress) {
  const upperIndex = scheme.stops.findIndex((stop) => progress <= stop)
  if (upperIndex <= 0) return scheme.colors[0]

  const lowerIndex = upperIndex - 1
  const localProgress = (progress - scheme.stops[lowerIndex]) / (scheme.stops[upperIndex] - scheme.stops[lowerIndex])
  return mixColor(scheme.colors[lowerIndex], scheme.colors[upperIndex], localProgress)
}

function getEnergyLabel(bpm) {
  if (bpm < 60) return 'Low pulse'
  if (bpm < 110) return 'Laid back'
  if (bpm < 170) return 'In the pocket'
  if (bpm < 230) return 'Driving'
  if (bpm < 291) return 'Flying'
  return 'Full send'
}

function gradientFor(scheme) {
  const stops = scheme.colors.map((color, index) => `${color} ${scheme.stops[index] * 100}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

function renderPalette() {
  palette.innerHTML = selectedScheme.colors
    .map((color) => `<span style="--swatch: ${color}" title="${color}"></span>`)
    .join('')
}

function renderCompareCards(progress) {
  compareGrid.innerHTML = schemes.map((scheme, index) => {
    const current = colorAtProgress(scheme, progress)
    return `
      <button
        type="button"
        class="compare-card"
        data-compare-scheme="${scheme.id}"
        aria-pressed="${scheme.id === selectedScheme.id}"
        style="--mini-gradient: ${gradientFor(scheme)}; --card-current: ${current}"
      >
        <span>${String(index + 1).padStart(2, '0')} · ${scheme.name}</span>
        <i class="mini-track" aria-hidden="true"></i>
        <small>${slider.value} BPM</small>
      </button>
    `
  }).join('')
}

function updateTempo({ animateThumb = false } = {}) {
  const bpm = Number(slider.value)
  const progress = (bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)
  const currentColor = colorAtProgress(selectedScheme, progress)
  const direction = Math.sign(bpm - lastBpm)

  document.documentElement.style.setProperty('--progress', `${progress * 100}%`)
  document.documentElement.style.setProperty('--progress-ratio', progress)
  document.documentElement.style.setProperty('--current-color', currentColor)
  document.documentElement.style.setProperty('--thumb-tilt', animateThumb ? `${direction * 3.5}deg` : '0deg')

  bpmReadout.textContent = bpm
  energyLabel.textContent = getEnergyLabel(bpm)
  slider.setAttribute('aria-valuetext', `${bpm} beats per minute`)
  renderCompareCards(progress)

  lastBpm = bpm
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => {
    document.documentElement.style.setProperty('--thumb-tilt', '0deg')
  }, 110)
}

function selectScheme(id) {
  const nextScheme = schemes.find((scheme) => scheme.id === id)
  if (!nextScheme) return

  selectedScheme = nextScheme
  stage.className = `concept-stage scheme-${nextScheme.id}`

  const schemeIndex = schemes.indexOf(nextScheme)
  conceptNumber.textContent = `Direction ${String(schemeIndex + 1).padStart(2, '0')}`
  conceptName.textContent = nextScheme.name
  conceptDescription.textContent = nextScheme.description
  colorStory.textContent = nextScheme.story
  motionStory.textContent = nextScheme.motion

  tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.scheme === id)))
  renderPalette()
  updateTempo()
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => selectScheme(tab.dataset.scheme))
})

compareGrid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-compare-scheme]')
  if (!card) return
  selectScheme(card.dataset.compareScheme)
  stage.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

slider.addEventListener('input', () => updateTempo({ animateThumb: true }))

renderPalette()
updateTempo()
