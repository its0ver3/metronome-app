const conceptData = {
  plate: {
    number: '01',
    name: 'Instrument Plate',
    description: 'A compact, tactile faceplate: one strong readout when folded, with the controls revealed as an attached instrument panel.',
    strength: 'Clarity + tactility',
    reference: 'Instrument hardware',
  },
  dial: {
    number: '02',
    name: 'Hoop Dial',
    description: 'A fine steel edge, charcoal face, and inset controls carry the hoop finish through the whole card. Large readouts keep the saved setup easy to scan.',
    strength: 'Personality + distance',
    reference: 'Lightweight triple-flanged hoops',
  },
  stick: {
    number: '03',
    name: 'Stick Rail',
    description: 'A lean studio card with two parallel rails carrying the training pulse. It is the quietest option, but still has a drummer-specific signature.',
    strength: 'Simplicity + rhythm',
    reference: 'Drumsticks + studio rails',
  },
}

const trainers = [
  { id: 'gap', title: 'Gap Trainer' },
  { id: 'tempo', title: 'Tempo Trainer' },
  { id: 'subdivision', title: 'Subdivision Trainer' },
]

// Original pictograms on a shared 24-unit grid. The surrounding title names
// each trainer; the icon illustrates what it does without extra labels.
function trainerIcon(id, variant = 'a') {
  const artwork = {
    gap: `
      <rect x="2.75" y="7" width="3.25" height="10" rx="0.75" fill="currentColor" />
      <rect x="8" y="7" width="3.25" height="10" rx="0.75" fill="currentColor" />
      <rect x="14" y="7.75" width="2.5" height="8.5" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5" />
      <rect x="19.25" y="7.75" width="2.5" height="8.5" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.5" />`,
    tempo: `
      <ellipse cx="6" cy="17.5" rx="3" ry="2.25" fill="currentColor" transform="rotate(-18 6 17.5)" />
      <path d="M8.5 17V4.5L12 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M18 19V7M14.75 10.25 18 7l3.25 3.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />`,
    subdivision: `
      <rect x="3" y="4" width="18" height="3" rx="0.65" fill="currentColor" />
      <rect x="3" y="10.5" width="8" height="3" rx="0.65" fill="currentColor" />
      <rect x="13" y="10.5" width="8" height="3" rx="0.65" fill="currentColor" />
      <rect x="3" y="17" width="3" height="3" rx="0.65" fill="currentColor" />
      <rect x="8" y="17" width="3" height="3" rx="0.65" fill="currentColor" />
      <rect x="13" y="17" width="3" height="3" rx="0.65" fill="currentColor" />
      <rect x="18" y="17" width="3" height="3" rx="0.65" fill="currentColor" />`,
  }
  const alternatives = {
    b: {
      gap: `
        <ellipse cx="5.5" cy="17.5" rx="2.75" ry="2" fill="currentColor" stroke="none" transform="rotate(-18 5.5 17.5)" />
        <path d="M8 17V4.5M16 4l3 4-4 4 3 3c-4-1-4 2-1 5" />`,
      tempo: `
        <path d="M7 20H3.5L7 4h7l3.5 16H7M7 16h7M10 16 17 6M19 10l1.5 1M20 15h1" />
        <circle cx="10" cy="16" r="1.4" fill="currentColor" stroke="none" />`,
      subdivision: `
        <ellipse cx="5" cy="18" rx="2.75" ry="2" fill="currentColor" stroke="none" transform="rotate(-18 5 18)" />
        <ellipse cx="17" cy="16" rx="2.75" ry="2" fill="currentColor" stroke="none" transform="rotate(-18 17 16)" />
        <path d="M7.5 17.5V6l12-2v11.5M13.5 9l6-1" />`,
    },
    c: {
      gap: `
        <path d="M12 3a9 9 0 1 0 9 9" />
        <circle cx="16.5" cy="4.2" r="1" fill="currentColor" stroke="none" />
        <circle cx="19.8" cy="7.5" r="1" fill="currentColor" stroke="none" />
        <path d="M8 12h2l1-3 2 6 1-3h2" />`,
      tempo: `
        <path d="M2 17h2l2-7 2 7h3l1.5-7L14 17h2l1-7 1 7h3M5 5h14m-3-2 3 2-3 2" />`,
      subdivision: `
        <path d="M12 5v4M6 12V9h12v3M6 14v2M18 14v2M3 19v-3h6v3M15 19v-3h6v3" />
        <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="6" cy="13" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="18" cy="13" r="1.5" fill="currentColor" stroke="none" />
        <path d="M2 20h2M8 20h2M14 20h2M20 20h2" />`,
    },
  }
  const selected = variant === 'a' ? artwork : alternatives[variant]
  return `<svg class="trainer-pictogram" viewBox="0 0 24 24" fill="none" stroke="${variant === 'a' ? 'none' : 'currentColor'}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${selected[id]}</svg>`
}

const previewParams = new URLSearchParams(window.location.search)
const iconSetNames = { a: 'Simple shapes', b: 'Music symbols', c: 'Pulse diagrams' }
const state = {
  concept: ['plate', 'dial', 'stick'].includes(previewParams.get('concept')) ? previewParams.get('concept') : 'dial',
  iconSet: ['a', 'b', 'c'].includes(previewParams.get('icons')) ? previewParams.get('icons') : 'a',
  open: {
    plate: new Set(['tempo']),
    dial: new Set(['tempo']),
    stick: new Set(['tempo']),
  },
  gap: { click: 2, silent: 1 },
  tempo: { start: 80, target: 140, step: 5, bars: 4 },
  subdivision: { clicks: [1, 2, 4], bars: [2, 2, 2] },
}

const stack = document.querySelector('#trainerStack')
const phone = document.querySelector('.phone')
const selectors = [...document.querySelectorAll('[data-concept]')].filter((node) => node.matches('button'))
const iconSelectors = [...document.querySelectorAll('[data-icon-set]')]

function syncIconSelector() {
  document.querySelector('.icon-comparison').hidden = state.concept !== 'dial'
  document.querySelector('#iconSetName').textContent = iconSetNames[state.iconSet]
  iconSelectors.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.iconSet === state.iconSet))
  })
}

iconSelectors.forEach((button) => {
  button.addEventListener('click', () => {
    state.iconSet = button.dataset.iconSet
    // Swap only the pictograms: the cards, focus, scroll, and throw-offs stay put.
    trainers.forEach(({ id }) => {
      const icon = stack.querySelector(`[data-trainer-card="${id}"] .hoop-head .trainer-icon`)
      if (icon) icon.innerHTML = trainerIcon(id, state.iconSet)
    })
    syncIconSelector()
  })
})

function trainerSummary(id) {
  if (id === 'gap') return `${state.gap.click} bars · ${state.gap.silent} silent`
  if (id === 'tempo') return `${state.tempo.start} → ${state.tempo.target} BPM`
  return `${state.subdivision.clicks.join(' → ')} clicks`
}

function metricParts(id) {
  if (id === 'gap') return [[state.gap.click, 'Click bars'], [state.gap.silent, 'Silent bars']]
  if (id === 'tempo') return [[state.tempo.start, 'Start BPM'], [state.tempo.target, 'Target BPM']]
  return [[state.subdivision.clicks.length, 'Stages'], [state.subdivision.bars[0], 'Bars each']]
}

function throwoff(trainer, isOpen) {
  return `
    <button
      type="button"
      class="throwoff"
      role="switch"
      aria-label="Enable ${trainer.title}"
      aria-checked="${isOpen}"
      aria-expanded="${isOpen}"
      aria-controls="${trainer.id}-settings"
      data-toggle="${trainer.id}"
    >
      <span class="throwoff-mechanism" aria-hidden="true">
        <span class="throwoff-art"><span class="throwoff-body"></span><span class="throwoff-lever"></span></span>
      </span>
    </button>`
}

function stepper(label, trainer, field, value) {
  return `
    <div class="stepper">
      <span>${label}</span>
      <div class="stepper-controls">
        <button type="button" class="step-button" aria-label="Decrease ${label}" data-step="-1" data-trainer="${trainer}" data-field="${field}">−</button>
        <strong class="step-value">${value}</strong>
        <button type="button" class="step-button" aria-label="Increase ${label}" data-step="1" data-trainer="${trainer}" data-field="${field}">+</button>
      </div>
    </div>`
}

function settingsMarkup(id) {
  if (id === 'gap') {
    return `<div class="step-grid">${stepper('Click bars', 'gap', 'click', state.gap.click)}${stepper('Silent bars', 'gap', 'silent', state.gap.silent)}</div>`
  }
  if (id === 'tempo') {
    return `<div class="step-grid">${stepper('Start BPM', 'tempo', 'start', state.tempo.start)}${stepper('Target BPM', 'tempo', 'target', state.tempo.target)}${stepper('Increase by', 'tempo', 'step', state.tempo.step)}${stepper('Every bars', 'tempo', 'bars', state.tempo.bars)}</div>`
  }
  return `<div class="stage-strip">${state.subdivision.clicks.map((clicks, index) => `<div class="stage"><small>${String.fromCharCode(65 + index)}</small><strong>${clicks}</strong><small>${state.subdivision.bars[index]} bars</small></div>`).join('')}</div>`
}

function mainMarkup(trainer, concept) {
  const summary = trainerSummary(trainer.id)
  if (concept === 'plate') {
    return `
      <div class="card-main">
        <span class="trainer-icon" aria-hidden="true">${trainerIcon(trainer.id)}</span>
        <div class="card-copy"><h3 class="card-title">${trainer.title}</h3><p class="card-summary">${summary}</p></div>
        <span class="state-lamp" aria-hidden="true"></span>
      </div>`
  }
  if (concept === 'dial') {
    const metrics = metricParts(trainer.id)
    return `
      <div class="card-main">
        <span class="hoop-gauge" aria-hidden="true">
          <span class="hoop-ears">
            ${Array.from({ length: 8 }, (_, index) => `<i style="--ear-angle: ${index * 45}deg"></i>`).join('')}
          </span>
          <span class="hoop-flange">
            <span class="hoop-head"><span class="trainer-icon">${trainerIcon(trainer.id, state.iconSet)}</span></span>
          </span>
        </span>
        <div class="dial-copy">
          <h3 class="card-title">${trainer.title}</h3>
          <dl class="dial-metrics">${metrics.map(([value, label]) => `<div class="dial-metric"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
        </div>
      </div>`
  }
  return `
    <div class="card-main">
      <div class="stick-heading"><h3 class="card-title">${trainer.title}</h3><span class="stick-mark" aria-hidden="true"></span></div>
      <div class="stick-readout"><span class="trainer-icon" aria-hidden="true">${trainerIcon(trainer.id)}</span><p class="card-summary">${summary}</p></div>
      <span class="stick-rail" aria-hidden="true">${'<i></i>'.repeat(6)}</span>
    </div>`
}

function cardMarkup(trainer) {
  const isOpen = state.open[state.concept].has(trainer.id)
  return `
    <article class="trainer-card ${isOpen ? 'is-open' : ''}" data-trainer-card="${trainer.id}">
      ${mainMarkup(trainer, state.concept)}
      ${throwoff(trainer, isOpen)}
      <div class="settings-reveal" id="${trainer.id}-settings" aria-hidden="${!isOpen}">
        <div class="settings-clip"><div class="settings">${settingsMarkup(trainer.id)}</div></div>
      </div>
    </article>`
}

function render() {
  phone.dataset.concept = state.concept
  syncIconSelector()
  stack.innerHTML = trainers.map(cardMarkup).join('')
  const concept = conceptData[state.concept]
  document.querySelector('#conceptNumber').textContent = concept.number
  document.querySelector('#conceptName').textContent = concept.name
  document.querySelector('#conceptDescription').textContent = concept.description
  document.querySelector('#conceptStrength').textContent = concept.strength
  document.querySelector('#conceptReference').textContent = concept.reference
  selectors.forEach((button) => {
    const selected = button.dataset.concept === state.concept
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
}

selectors.forEach((button) => {
  button.addEventListener('click', () => {
    state.concept = button.dataset.concept
    render()
  })
})

stack.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-toggle]')
  if (toggle) {
    const id = toggle.dataset.toggle
    const openSet = state.open[state.concept]
    if (openSet.has(id)) openSet.delete(id)
    else openSet.add(id)
    if (state.concept === 'dial') {
      // Keep this card mounted so its surface and control tray can transition.
      const isOpen = openSet.has(id)
      const card = toggle.closest('[data-trainer-card]')
      card.classList.toggle('is-open', isOpen)
      toggle.setAttribute('aria-checked', String(isOpen))
      toggle.setAttribute('aria-expanded', String(isOpen))
      const settings = card.querySelector('.settings-reveal')
      settings.setAttribute('aria-hidden', String(!isOpen))
      settings.inert = !isOpen
      return
    }
    render()
    requestAnimationFrame(() => document.querySelector(`[data-toggle="${id}"]`)?.focus({ preventScroll: true }))
    return
  }

  const step = event.target.closest('[data-step]')
  if (!step) return
  const trainer = step.dataset.trainer
  const field = step.dataset.field
  const amount = Number(step.dataset.step)
  const limits = trainer === 'tempo' && ['start', 'target'].includes(field) ? [20, 300] : [1, 32]
  state[trainer][field] = Math.min(limits[1], Math.max(limits[0], state[trainer][field] + amount))
  render()
  requestAnimationFrame(() => document.querySelector(`[data-step="${amount}"][data-trainer="${trainer}"][data-field="${field}"]`)?.focus({ preventScroll: true }))
})

render()
