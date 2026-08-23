const MIN_BPM = 20
const MAX_BPM = 300
const ACCENT_LEVELS = ['mute', 'soft', 'click', 'accent']
const METERS = [
  { beats: 4, numerator: 4, unit: 4, label: '4/4', grouping: '4', defaultSubdivision: 2 },
  { beats: 3, numerator: 3, unit: 4, label: '3/4', grouping: '3', defaultSubdivision: 2 },
  { beats: 2, numerator: 6, unit: 8, label: '6/8', grouping: '3 + 3', defaultSubdivision: 3 },
  { beats: 5, numerator: 5, unit: 4, label: '5/4', grouping: '3 + 2', defaultSubdivision: 2 },
]
const SUBDIVISIONS = [
  { value: 1, label: 'Beat', count: '1' },
  { value: 2, label: 'Eighths', count: '1 &amp;' },
  { value: 3, label: 'Triplets', count: '1-trip-let' },
  { value: 4, label: 'Sixteenths', count: '1 e &amp; a' },
]
const COMPOUND_SUBDIVISIONS = [
  { value: 1, label: 'Pulse', count: '1' },
  { value: 3, label: 'Eighths', count: '1 2 3' },
]

const concepts = [
  {
    name: 'Pulse Core',
    description: 'Tempo and beat movement form one clear performance instrument.',
    render: renderPulseCore,
  },
  {
    name: 'Beat Tide',
    description: 'A fluid bar timeline where beats crest and subdivisions travel like a musical swell.',
    render: renderBeatTide,
  },
  {
    name: 'Rhythm Loom',
    description: 'A tactile woven rhythm where beats become strands and accents become knots.',
    render: renderRhythmLoom,
  },
  {
    name: 'Kinetic Poster',
    description: 'A bold typographic metronome that behaves like an animated concert poster.',
    render: renderKineticPoster,
  },
  {
    name: 'Soft Utility',
    description: 'The same straightforward structure, expressed with warmth and playful color.',
    render: () => renderUtility('soft-utility', 'Tempo'),
  },
]

const state = {
  variant: 0,
  bpm: 120,
  beats: 4,
  meterNumerator: 4,
  beatUnit: 4,
  subdivision: 2,
  accents: [],
  accentTool: 'accent',
  playing: false,
  currentBeat: 0,
  currentSubdivision: 0,
  panelOpen: false,
  tapTimes: [],
  timer: null,
}

let panelReturnFocus = null

const stage = document.getElementById('metronome-stage')
const variantButtons = [...document.querySelectorAll('[data-variant]')]
const conceptNumber = document.getElementById('concept-number')
const conceptName = document.getElementById('concept-name')
const conceptDescription = document.getElementById('concept-description')
const previousConcept = document.getElementById('previous-concept')
const nextConcept = document.getElementById('next-concept')
const variantPosition = document.getElementById('variant-position')
const variantShortName = document.getElementById('variant-short-name')

ensureAccents()
render()

variantButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectVariant(Number(button.dataset.variant))
  })
})

previousConcept.addEventListener('click', () => selectVariant(state.variant - 1))
nextConcept.addEventListener('click', () => selectVariant(state.variant + 1))

stage.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]')
  if (!control) return

  const action = control.dataset.action

  if (action === 'toggle-play') {
    togglePlaying()
    return
  }

  if (action === 'tap') {
    registerTap()
    return
  }

  if (action === 'bpm-down') {
    setBpm(state.bpm - 1)
    return
  }

  if (action === 'bpm-up') {
    setBpm(state.bpm + 1)
    return
  }

  if (action === 'toggle-panel') {
    const opening = !state.panelOpen
    if (opening) panelReturnFocus = focusDescriptor(control)
    state.panelOpen = !state.panelOpen
    render()
    if (opening) {
      const sheetClose = stage.querySelector('.sheet-close')
      if (sheetClose) sheetClose.focus({ preventScroll: true })
    } else {
      restoreFocus(panelReturnFocus)
    }
    return
  }

  if (action === 'close-panel') {
    closePanel()
    return
  }

  if (action === 'set-meter') {
    state.beats = Number(control.dataset.beats)
    state.meterNumerator = Number(control.dataset.numerator)
    state.beatUnit = Number(control.dataset.unit)
    state.subdivision = Number(control.dataset.defaultSubdivision)
    state.currentBeat = 0
    state.currentSubdivision = 0
    ensureAccents(true)
    render()
    if (state.playing) scheduleTick()
    return
  }

  if (action === 'set-subdivision') {
    state.subdivision = Number(control.dataset.value)
    state.currentSubdivision = 0
    ensureAccents(true)
    render()
    if (state.playing) scheduleTick()
    return
  }

  if (action === 'set-accent-tool') {
    state.accentTool = control.dataset.level
    render()
    return
  }

  if (action === 'apply-accent-preset') {
    applyAccentPreset(control.dataset.preset)
    render()
    return
  }

  if (action === 'apply-accent') {
    const index = Number(control.dataset.index)
    state.accents[index] = state.accentTool
    render()
  }
})

stage.addEventListener('input', (event) => {
  if (event.target.matches('[data-control="bpm"]')) {
    setBpm(Number(event.target.value), false)
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.panelOpen) {
    event.preventDefault()
    closePanel()
    return
  }
  if (event.key === 'Tab' && state.panelOpen) {
    const sheet = stage.querySelector('.control-sheet')
    if (sheet) {
      const focusable = [...sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }
  if (event.target.matches('input, select, button')) return
  if (event.key === 'ArrowLeft') {
    selectVariant(state.variant - 1)
  }
  if (event.key === 'ArrowRight') {
    selectVariant(state.variant + 1)
  }
  if (event.code === 'Space') {
    event.preventDefault()
    togglePlaying()
  }
  if (event.key.toLowerCase() === 't') registerTap()
})

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function selectVariant(index) {
  state.variant = (index + concepts.length) % concepts.length
  state.panelOpen = false
  render()
}

function setBpm(value, rerender = true, preserveTapSequence = false) {
  state.bpm = clamp(value, MIN_BPM, MAX_BPM)
  if (!preserveTapSequence) state.tapTimes = []
  if (state.playing) scheduleTick()
  if (rerender) render()
  else updateLiveBpm()
}

function togglePlaying() {
  state.playing = !state.playing
  if (state.playing) {
    state.currentBeat = 0
    state.currentSubdivision = 0
    scheduleTick()
  } else {
    stopTicker()
  }
  render()
}

function closePanel() {
  state.panelOpen = false
  render()
  restoreFocus(panelReturnFocus)
}

function updateLiveBpm() {
  stage.querySelectorAll('[data-bpm-value]').forEach((element) => {
    element.textContent = state.bpm
  })
  stage.querySelectorAll('[data-control="bpm"]').forEach((element) => {
    if (Number(element.value) !== state.bpm) element.value = state.bpm
  })
}

function registerTap() {
  const now = performance.now()
  const previousTap = state.tapTimes[state.tapTimes.length - 1]
  if (previousTap && now - previousTap > 3000) state.tapTimes = []

  state.tapTimes.push(now)
  state.tapTimes = state.tapTimes.slice(-5)

  if (state.tapTimes.length >= 4) {
    const intervals = state.tapTimes.slice(1).map((tap, index) => tap - state.tapTimes[index])
    const average = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    setBpm(60000 / average, true, true)
  } else {
    flashTapControl()
  }
}

function flashTapControl() {
  const control = stage.querySelector('[data-action="tap"]')
  if (!control) return
  control.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
    { duration: 140, easing: 'ease-out' },
  )
}

function defaultAccentLevel(beat, subdivision) {
  if (subdivision > 0) return 'soft'
  return beat === 0 ? 'accent' : 'click'
}

function ensureAccents(reset = false) {
  const previous = [...state.accents]
  const total = state.beats * state.subdivision
  state.accents = Array.from({ length: total }, (_, index) => {
    if (!reset && previous[index]) return previous[index]
    const beat = Math.floor(index / state.subdivision)
    const subdivision = index % state.subdivision
    return defaultAccentLevel(beat, subdivision)
  })
}

function applyAccentPreset(preset) {
  state.accents = state.accents.map((_, index) => {
    const beat = Math.floor(index / state.subdivision)
    const subdivision = index % state.subdivision

    if (preset === 'all-beats') return subdivision === 0 ? 'accent' : 'soft'
    if (preset === 'backbeat') {
      const isBackbeat = state.beatUnit === 4 && state.beats >= 4 && (beat === 1 || beat === 3)
      if (subdivision === 0) return isBackbeat ? 'accent' : 'click'
      return 'soft'
    }
    if (preset === 'offbeats') {
      const upbeat = state.subdivision % 2 === 0 ? state.subdivision / 2 : -1
      if (subdivision === 0) return 'click'
      return subdivision === upbeat ? 'accent' : 'soft'
    }
    return defaultAccentLevel(beat, subdivision)
  })
}

function scheduleTick() {
  stopTicker()
  if (!state.playing) return
  const interval = 60000 / state.bpm / state.subdivision
  state.timer = window.setTimeout(() => {
    state.currentSubdivision += 1
    if (state.currentSubdivision >= state.subdivision) {
      state.currentSubdivision = 0
      state.currentBeat = (state.currentBeat + 1) % state.beats
    }
    updatePlaybackVisuals()
    scheduleTick()
  }, interval)
}

function stopTicker() {
  window.clearTimeout(state.timer)
  state.timer = null
}

function render() {
  variantButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === state.variant))
  })

  const concept = concepts[state.variant]
  conceptNumber.textContent = `Concept ${String(state.variant + 1).padStart(2, '0')}`
  conceptName.textContent = concept.name
  conceptDescription.textContent = concept.description
  variantPosition.textContent = `${state.variant + 1} of ${concepts.length}`
  variantShortName.textContent = concept.name
  renderStage()
}

function renderStage() {
  const focusedControl = focusDescriptor(document.activeElement)
  stage.innerHTML = concepts[state.variant].render()
  isolateModalSheet()
  if (state.playing) updatePlaybackVisuals()
  restoreFocus(focusedControl)
}

function isolateModalSheet() {
  const sheet = stage.querySelector('.control-sheet')
  if (!sheet) return

  ;[...sheet.parentElement.children].forEach((element) => {
    if (element === sheet || element.classList.contains('sheet-backdrop')) return
    element.inert = true
    element.setAttribute('aria-hidden', 'true')
  })
}

function focusDescriptor(element) {
  if (!(element instanceof HTMLElement) || !stage.contains(element)) return null

  const action = element.dataset.action
  if (action) {
    const controls = [...stage.querySelectorAll(`[data-action="${action}"]`)]
    return { type: 'action', value: action, index: controls.indexOf(element) }
  }

  const control = element.dataset.control
  if (control) return { type: 'control', value: control, index: 0 }
  return null
}

function restoreFocus(descriptor) {
  if (!descriptor) return
  const attribute = descriptor.type === 'action' ? 'data-action' : 'data-control'
  const controls = stage.querySelectorAll(`[${attribute}="${descriptor.value}"]`)
  const control = controls[Math.max(0, descriptor.index)] || controls[0]
  control?.focus({ preventScroll: true })
}

function updatePlaybackVisuals() {
  const currentBeat = state.currentBeat
  const currentStep = (currentBeat * state.subdivision) + state.currentSubdivision

  stage.querySelectorAll('[data-live-beat]').forEach((element) => {
    element.textContent = currentBeat + 1
  })
  stage.querySelectorAll('[data-live-beat-word]').forEach((element) => {
    const words = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT']
    element.textContent = words[currentBeat] || currentBeat + 1
  })
  stage.querySelectorAll('[data-live-status]').forEach((element) => {
    element.textContent = state.playing ? `Beat ${currentBeat + 1}` : 'Ready'
  })
  stage.querySelectorAll('[data-beat-index]').forEach((element) => {
    element.classList.toggle('is-active', state.playing && Number(element.dataset.beatIndex) === currentBeat)
  })
  stage.querySelectorAll('[data-step-index]').forEach((element) => {
    element.classList.toggle('is-current', state.playing && Number(element.dataset.stepIndex) === currentStep)
  })

  const pulseOrbit = stage.querySelector('.pulse-orbit')
  if (pulseOrbit) {
    pulseOrbit.setAttribute('aria-label', `Tempo ${state.bpm} BPM, beat ${currentBeat + 1} of ${state.beats}`)
  }
  const pulseScreen = stage.querySelector('.pulse-core')
  if (pulseScreen) {
    const progress = state.playing
      ? (currentBeat + (state.currentSubdivision / state.subdivision)) / state.beats
      : 0
    pulseScreen.style.setProperty('--beat-progress', progress)
  }

  stage.querySelectorAll('[data-bar-progress]').forEach((element) => {
    const progress = (currentStep + 1) / (state.beats * state.subdivision)
    element.style.setProperty('--bar-progress', progress)
    const shuttleTop = 8 + (((state.currentSubdivision + 0.5) / state.subdivision) * 72)
    element.style.setProperty('--shuttle-top', `${shuttleTop}%`)
  })
}

function playIcon() {
  return `<span class="${state.playing ? 'icon-pause' : 'icon-play'}" aria-hidden="true"></span>`
}

function playLabel() {
  return state.playing ? 'Pause' : 'Play'
}

function beatDots(className, tagName = 'i') {
  return Array.from({ length: state.beats }, (_, index) => (
    `<${tagName} class="${className}${state.playing && index === state.currentBeat ? ' is-active' : ''}" data-beat-index="${index}" aria-hidden="true"></${tagName}>`
  )).join('')
}

function meterLabel() {
  return `${state.meterNumerator}/${state.beatUnit}`
}

function availableSubdivisions() {
  return state.meterNumerator === 6 && state.beatUnit === 8 ? COMPOUND_SUBDIVISIONS : SUBDIVISIONS
}

function subdivisionDefinition() {
  const choices = availableSubdivisions()
  return choices.find((option) => option.value === state.subdivision) || choices[0]
}

function subdivisionLabel() {
  return subdivisionDefinition().label
}

function rhythmSummary() {
  return `${meterLabel()} · ${subdivisionLabel()}`
}

function stepCountLabel(beat, subdivision) {
  if (state.meterNumerator === 6 && state.beatUnit === 8 && state.subdivision === 3) {
    return String((beat * 3) + subdivision + 1)
  }
  if (subdivision === 0) return String(beat + 1)
  if (state.subdivision === 2) return '&'
  if (state.subdivision === 3) return subdivision === 1 ? 'trip' : 'let'
  return ['1', 'e', '&', 'a'][subdivision] || String(subdivision + 1)
}

function patternPreview(className = '') {
  return `
    <div class="pattern-preview ${className}" aria-label="${rhythmSummary()} accent pattern">
      ${Array.from({ length: state.beats }, (_, beat) => `
        <span class="pattern-preview-beat${state.meterNumerator === 6 && state.beatUnit === 8 && beat === 1 ? ' is-group-start' : ''}">
          ${Array.from({ length: state.subdivision }, (_, subdivision) => {
            const index = (beat * state.subdivision) + subdivision
            return `<i data-level="${state.accents[index]}" data-step-index="${index}" aria-hidden="true"></i>`
          }).join('')}
        </span>
      `).join('')}
    </div>
  `
}

function meterEditor() {
  return `
    <section class="rhythm-zone" aria-labelledby="meter-title">
      <div class="rhythm-zone-head">
        <div><span>01</span><h4 id="meter-title">Meter</h4></div>
        <strong>${meterLabel()}</strong>
      </div>
      <div class="meter-options">
        ${METERS.map((meter) => {
          const selected = meter.numerator === state.meterNumerator && meter.unit === state.beatUnit
          return `
            <button type="button" data-action="set-meter" data-beats="${meter.beats}" data-numerator="${meter.numerator}" data-unit="${meter.unit}" data-default-subdivision="${meter.defaultSubdivision}" aria-pressed="${selected}">
              <strong>${meter.label}</strong><span>${meter.grouping}</span>
            </button>
          `
        }).join('')}
      </div>
      <p class="rhythm-reset-note">Changing meter starts a fresh pattern.</p>
    </section>
  `
}

function subdivisionEditor() {
  return `
    <section class="rhythm-zone" aria-labelledby="subdivision-title">
      <div class="rhythm-zone-head">
        <div><span>02</span><h4 id="subdivision-title">Subdivision</h4></div>
        <strong>${subdivisionLabel()}</strong>
      </div>
      <div class="subdivision-options${availableSubdivisions().length === 2 ? ' is-compact' : ''}">
        ${availableSubdivisions().map((option) => `
          <button type="button" data-action="set-subdivision" data-value="${option.value}" aria-pressed="${option.value === state.subdivision}">
            <strong>${option.label}</strong><span>${option.count}</span>
          </button>
        `).join('')}
      </div>
      <p class="rhythm-reset-note">Changing subdivision starts a fresh pattern.</p>
    </section>
  `
}

function accentEditor() {
  const toolLabels = { accent: 'Accent', click: 'Click', soft: 'Soft', mute: 'Mute' }
  const canBackbeat = state.beatUnit === 4 && state.beats >= 4
  const canUseOffbeats = state.subdivision >= 2 && state.subdivision % 2 === 0
  return `
    <section class="rhythm-zone accent-editor" aria-labelledby="accent-title">
      <div class="rhythm-zone-head">
        <div><span>03</span><h4 id="accent-title">Accent pattern</h4></div>
        <strong>Paint clicks</strong>
      </div>

      <div class="accent-presets" aria-label="Accent presets">
        <button type="button" data-action="apply-accent-preset" data-preset="downbeat">Downbeat</button>
        <button type="button" data-action="apply-accent-preset" data-preset="all-beats">All beats</button>
        <button type="button" data-action="apply-accent-preset" data-preset="backbeat"${canBackbeat ? '' : ' disabled'}>2 + 4</button>
        <button type="button" data-action="apply-accent-preset" data-preset="offbeats"${canUseOffbeats ? '' : ' disabled'}>Offbeats</button>
      </div>

      <p class="accent-instruction">Choose a level, then tap a click.</p>
      <div class="accent-paint-tools" role="toolbar" aria-label="Choose click intensity">
        ${ACCENT_LEVELS.slice().reverse().map((level) => `
          <button type="button" data-action="set-accent-tool" data-level="${level}" aria-pressed="${state.accentTool === level}">
            <i data-level="${level}" aria-hidden="true"></i><span>${toolLabels[level]}</span>
          </button>
        `).join('')}
      </div>

      <div class="beat-pattern-list">
        ${Array.from({ length: state.beats }, (_, beat) => `
          <section class="beat-pattern-row${beat === 0 ? ' is-downbeat' : ''}${state.meterNumerator === 6 && state.beatUnit === 8 && beat === 1 ? ' is-group-start' : ''}">
            <header><strong>${state.meterNumerator === 6 && state.beatUnit === 8 ? `Pulse ${beat + 1}` : `Beat ${beat + 1}`}</strong><span>${state.meterNumerator === 6 && state.beatUnit === 8 ? (beat === 0 ? 'Counts 1–3' : 'Counts 4–6') : beat === 0 ? 'Downbeat' : ''}</span></header>
            <div class="beat-pattern-steps" style="--step-count:${state.subdivision}">
              ${Array.from({ length: state.subdivision }, (_, subdivision) => {
                const index = (beat * state.subdivision) + subdivision
                const level = state.accents[index]
                const current = state.playing && index === ((state.currentBeat * state.subdivision) + state.currentSubdivision)
                return `
                  <button type="button" class="pattern-step${current ? ' is-current' : ''}" data-action="apply-accent" data-index="${index}" data-level="${level}" data-step-index="${index}" aria-label="${state.meterNumerator === 6 && state.beatUnit === 8 ? 'Pulse' : 'Beat'} ${beat + 1}, ${stepCountLabel(beat, subdivision)}: ${toolLabels[level]}. Apply ${toolLabels[state.accentTool]}">
                    <i aria-hidden="true"></i><span>${stepCountLabel(beat, subdivision)}</span>
                  </button>
                `
              }).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </section>
  `
}

function rhythmEditor() {
  return `<div class="rhythm-editor">${meterEditor()}${subdivisionEditor()}${accentEditor()}</div>`
}

function controlSheet() {
  if (!state.panelOpen) return ''
  return `
    <button class="sheet-backdrop" type="button" data-action="close-panel" aria-label="Close rhythm controls"></button>
    <section class="control-sheet" id="rhythm-controls" role="dialog" aria-modal="true" aria-label="Rhythm controls">
      <div class="sheet-handle" aria-hidden="true"></div>
      <div class="sheet-head">
        <div><span>Shape the click</span><h3>Rhythm</h3></div>
        <button class="sheet-close" type="button" data-action="close-panel">Done</button>
      </div>
      ${rhythmEditor()}
    </section>
  `
}

function renderPulseCore() {
  const progress = state.playing ? (state.currentBeat + (state.currentSubdivision / state.subdivision)) / state.beats : 0
  return `
    <section class="concept-screen pulse-core${state.playing ? ' is-playing' : ''}" style="--beat-progress:${progress}">
      <header class="pulse-topbar">
        <span class="pulse-wordmark">PULSE</span>
        <span class="pulse-status" data-live-status>${state.playing ? `Beat ${state.currentBeat + 1}` : 'Ready'}</span>
      </header>

      <div class="pulse-performance">
        <div class="pulse-orbit" aria-label="Tempo ${state.bpm} BPM, beat ${state.currentBeat + 1} of ${state.beats}">
          <div class="pulse-tempo">
            <strong class="pulse-bpm" data-bpm-value>${state.bpm}</strong>
            <small>BEATS PER MINUTE</small>
          </div>
        </div>
        <div class="pulse-nudge-row">
          <button class="pulse-nudge" type="button" data-action="bpm-down" aria-label="Decrease tempo">−</button>
          <button class="pulse-play" type="button" data-action="toggle-play" aria-pressed="${state.playing}">${playIcon()} ${playLabel()}</button>
          <button class="pulse-nudge" type="button" data-action="bpm-up" aria-label="Increase tempo">+</button>
        </div>
        <div class="pulse-beats" aria-hidden="true">${beatDots('pulse-beat-dot', 'span')}</div>
        ${patternPreview('pulse-pattern-preview')}
      </div>

      <div class="pulse-quickbar">
        <button class="pulse-chip" type="button" data-action="tap"><span>Tap tempo</span><strong>Tap</strong></button>
        <button class="pulse-chip" type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls"><span>Meter</span><strong>${meterLabel()}</strong></button>
        <button class="pulse-chip" type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls"><span>Rhythm</span><strong>${subdivisionLabel()}</strong></button>
      </div>
      <nav class="pulse-tabs" aria-label="App sections">
        <button class="pulse-tab is-active" type="button" aria-current="page">Metronome</button>
        <button class="pulse-tab" type="button">Training</button>
        <button class="pulse-tab" type="button">Settings</button>
      </nav>
      ${controlSheet()}
    </section>
  `
}

function renderBeatTide() {
  return `
    <section class="concept-screen beat-tide${state.playing ? ' is-playing' : ''}" data-bar-progress>
      <header class="tide-header">
        <span>Beat Tide</span>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">${rhythmSummary()}</button>
      </header>

      <div class="tide-tempo">
        <span>Tempo</span>
        <strong data-bpm-value>${state.bpm}</strong>
        <small>BPM</small>
      </div>

      <div class="tide-water" aria-label="Animated ${rhythmSummary()} pattern">
        <div class="tide-wave-grid" aria-hidden="true">
          ${Array.from({ length: state.beats }, (_, beat) => `
            <div class="tide-beat-segment" data-beat-index="${beat}">
              ${Array.from({ length: state.subdivision }, (_, subdivision) => {
                const index = (beat * state.subdivision) + subdivision
                const phase = subdivision / state.subdivision
                const top = 14 + (Math.sin(Math.PI * phase) * 58)
                return `<i class="${subdivision === 0 ? 'is-beat' : ''}" style="--step-left:${phase * 100}%;--step-top:${top}%" data-level="${state.accents[index]}" data-step-index="${index}"></i>`
              }).join('')}
              <strong>${beat + 1}</strong>
            </div>
          `).join('')}
        </div>
        <div class="tide-playhead" aria-hidden="true"><i></i></div>
        <div class="tide-current"><span>Beat</span><strong data-live-beat>${state.currentBeat + 1}</strong><small>of ${state.beats}</small></div>
      </div>

      <div class="tide-transport">
        <button type="button" data-action="bpm-down" aria-label="Decrease tempo">−</button>
        <button class="tide-play" type="button" data-action="toggle-play" aria-pressed="${state.playing}">${playIcon()} ${playLabel()}</button>
        <button type="button" data-action="bpm-up" aria-label="Increase tempo">+</button>
      </div>

      <footer class="tide-actions">
        <button type="button" data-action="tap">Tap tempo</button>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">Shape pattern <span>↗</span></button>
      </footer>
      ${controlSheet()}
    </section>
  `
}

function renderRhythmLoom() {
  return `
    <section class="concept-screen rhythm-loom${state.playing ? ' is-playing' : ''}" data-bar-progress>
      <header class="loom-header">
        <div><span>Rhythm Loom</span><strong data-live-status>${state.playing ? `Beat ${state.currentBeat + 1}` : 'Ready'}</strong></div>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">${rhythmSummary()}</button>
      </header>

      <div class="loom-tempo">
        <span>Tension / BPM</span>
        <strong data-bpm-value>${state.bpm}</strong>
      </div>

      <div class="loom-surface" aria-label="Woven ${rhythmSummary()} pattern">
        <div class="loom-shuttle" aria-hidden="true"></div>
        ${Array.from({ length: state.beats }, (_, beat) => `
          <div class="loom-strand${beat === 0 ? ' is-downbeat' : ''}" data-beat-index="${beat}">
            <span class="loom-thread" aria-hidden="true"></span>
            <div class="loom-knots">
              ${Array.from({ length: state.subdivision }, (_, subdivision) => {
                const index = (beat * state.subdivision) + subdivision
                return `<i data-level="${state.accents[index]}" data-step-index="${index}" aria-hidden="true"></i>`
              }).join('')}
            </div>
            <strong>${beat + 1}</strong>
          </div>
        `).join('')}
      </div>

      <div class="loom-tension" aria-label="Tempo controls">
        <button type="button" data-action="bpm-up" aria-label="Increase tempo">+</button>
        <span aria-hidden="true"></span>
        <button type="button" data-action="bpm-down" aria-label="Decrease tempo">−</button>
      </div>

      <footer class="loom-actions">
        <button type="button" data-action="tap">Tap</button>
        <button class="loom-play" type="button" data-action="toggle-play" aria-pressed="${state.playing}">${playIcon()} ${playLabel()}</button>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">Pattern</button>
      </footer>
      ${controlSheet()}
    </section>
  `
}

function renderKineticPoster() {
  const beatNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT']
  return `
    <section class="concept-screen kinetic-poster${state.playing ? ' is-playing' : ''}" data-bar-progress>
      <header class="poster-header">
        <span>Tempo</span>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">${rhythmSummary()}</button>
      </header>

      <div class="poster-tempo">
        <button type="button" data-action="bpm-down" aria-label="Decrease tempo">−</button>
        <strong data-bpm-value>${state.bpm}</strong>
        <button type="button" data-action="bpm-up" aria-label="Increase tempo">+</button>
      </div>

      <div class="poster-beat" aria-label="Current beat ${state.currentBeat + 1}">
        <span>Beat</span>
        <strong data-live-beat-word>${beatNames[state.currentBeat] || state.currentBeat + 1}</strong>
        <small><b data-live-beat>${state.currentBeat + 1}</b> / ${state.beats}</small>
      </div>

      <div class="poster-score" aria-label="${rhythmSummary()} accent score">
        ${state.accents.map((level, index) => {
          const beat = Math.floor(index / state.subdivision)
          const subdivision = index % state.subdivision
          return `<i data-level="${level}" data-step-index="${index}">${stepCountLabel(beat, subdivision)}</i>`
        }).join('')}
      </div>

      <div class="poster-progress" aria-hidden="true"><i></i></div>

      <footer class="poster-actions">
        <button type="button" data-action="tap">Tap</button>
        <button class="poster-play" type="button" data-action="toggle-play" aria-pressed="${state.playing}" aria-label="${playLabel()}">${playIcon()}</button>
        <button type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="rhythm-controls">Pattern</button>
      </footer>
      ${controlSheet()}
    </section>
  `
}

function renderUtility(themeClass, brand) {
  return `
    <section class="concept-screen utility-screen ${themeClass}${state.playing ? ' is-playing' : ''}">
      <div class="screen-scroll utility-scroll">
        <header class="utility-header">
          <strong>${brand}</strong>
          <span class="utility-live" data-live-status>${state.playing ? `Beat ${state.currentBeat + 1}` : 'Ready'}</span>
        </header>

        <div class="utility-tempo-block">
          <strong class="utility-bpm" data-bpm-value>${state.bpm}</strong>
          <span>Beats per minute</span>
        </div>

        <div class="utility-slider-row">
          <button type="button" data-action="bpm-down" aria-label="Decrease tempo">−</button>
          <input type="range" min="${MIN_BPM}" max="${MAX_BPM}" value="${state.bpm}" data-control="bpm" aria-label="Tempo" />
          <button type="button" data-action="bpm-up" aria-label="Increase tempo">+</button>
        </div>
        <div class="utility-beats" aria-hidden="true">${beatDots('', 'i')}</div>

        <div class="utility-transport">
          <button type="button" data-action="tap">Tap tempo</button>
          <button class="utility-play" type="button" data-action="toggle-play" aria-pressed="${state.playing}">${playIcon()} ${playLabel()}</button>
        </div>

        <button class="utility-settings-toggle" type="button" data-action="toggle-panel" aria-expanded="${state.panelOpen}" aria-controls="utility-rhythm-settings">
          <span><strong>Rhythm</strong><small>${rhythmSummary()}</small></span>
          ${patternPreview('utility-pattern-preview')}
          <b aria-hidden="true">${state.panelOpen ? '−' : '+'}</b>
        </button>
        ${state.panelOpen ? `
          <section class="utility-expanded" id="utility-rhythm-settings" aria-label="Rhythm settings">
            ${rhythmEditor()}
          </section>
        ` : ''}
      </div>

      <nav class="utility-nav" aria-label="App sections">
        <button class="is-active" type="button" aria-current="page">Metronome</button>
        <button type="button">Training</button>
        <button type="button">Settings</button>
      </nav>
    </section>
  `
}
