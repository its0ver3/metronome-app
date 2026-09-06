import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { getTempoColor } from '../src/components/metronome/tempoHeat.js'

// Compile the real JSX in memory, with the same React instance used by SSR.
// No browser, fake hooks, production edits, or retained mockup are required.
const compiled = await build({
  stdin: {
    contents: `
      export { default as TrainingScreen } from './src/components/training/TrainingScreen.jsx'
      export { default as TrainerToggle } from './src/components/training/TrainerToggle.jsx'
      export { default as TrainerCardHeader } from './src/components/training/TrainerCardHeader.jsx'
      export { default as GapTraining } from './src/components/training/GapTraining.jsx'
      export { default as SubdivisionTrainer } from './src/components/training/SubdivisionTrainer.jsx'
      export { default as GlobalTransport } from './src/components/layout/GlobalTransport.jsx'
      export { StandardRhythmOrbit } from './src/components/metronome/PolyrhythmOrbit.jsx'
    `,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    loader: 'jsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  loader: { '.css': 'empty', '.png': 'file' },
  outdir: 'in-memory',
  publicPath: '/metronome-app/assets/',
})
const module = { exports: {} }
const compiledModule = compiled.outputFiles.find((file) => file.path.endsWith('.js'))
new Function('module', 'exports', 'require', compiledModule.text)(
  module, module.exports, createRequire(import.meta.url),
)
const { TrainingScreen, TrainerToggle, TrainerCardHeader, GapTraining, SubdivisionTrainer } = module.exports
const { GlobalTransport, StandardRhythmOrbit } = module.exports
const css = await readFile(new URL('../src/components/training/trainerThrowoff.css', import.meta.url), 'utf8')
const appCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')

const defaults = {
  gapClickBars: 4,
  gapSilentBars: 2,
  tempoStartBpm: 80,
  tempoTargetBpm: 140,
  tempoIncrement: 5,
  tempoEveryBars: 4,
  subdivTrainerStageIndex: 1,
  subdivTrainerBarCount: 0,
  isPlaying: true,
  onGapChange() {},
  onTempoChange() {},
  onSubdivTrainerChange() {},
}

const miniDefaults = {
  bpm: 120, beatsPerBar: 4, subdivision: 2,
  subdivisionAccents: ['ACCENT', 'ON', 'ON', 'ON', 'OFF', 'OFF', 'ACCENT', 'ON'],
  currentBeat: 0, isPlaying: true, tempoEnabled: false, polyrhythmMode: false,
  polyRhythm1: 3, polyRhythm2: 4, polyBeat1: 1, polyBeat2: 2,
  polyAccents1: ['ACCENT', 'ON', 'OFF'], polyAccents2: ['ACCENT', 'ON', 'ON', 'OFF'],
  onToggle() {}, onBpmChange() {}, onOpenMetronome() {},
}

test('mini metronome mirrors the real beat geometry and accents without nested controls', () => {
  for (const beatsPerBar of [1, 3, 4, 7, 16]) for (const subdivision of [1, 4, 13]) {
    const subdivisionAccents = Array.from({ length: beatsPerBar * subdivision }, (_, i) => ['OFF', 'ON', 'ACCENT'][i % 3])
    for (const isPlaying of [false, true]) {
      const props = { ...miniDefaults, beatsPerBar, subdivision, subdivisionAccents, currentBeat: beatsPerBar - 1, isPlaying }
      const html = renderToStaticMarkup(createElement(GlobalTransport, props))
      const main = renderToStaticMarkup(createElement(StandardRhythmOrbit, {
        beatCount: beatsPerBar, subdivision, accents: subdivisionAccents,
        activeBeat: props.currentBeat, isPlaying, onCycleBeatAccent() {},
      }))
      const faces = markup => [...markup.matchAll(/<path d="([^"]+)" class="pulse-orbit-segment-surface ([^"]+)"/g)].map(([, d, state]) => [d, state])
      assert.deepEqual(faces(html), faces(main))
      assert.equal(faces(html).length, beatsPerBar)
      assert.equal((html.match(/data-active="true"/g) || []).length, isPlaying ? 1 : 0)
      assert.equal((html.match(/<button /g) || []).length, 5)
      assert.doesNotMatch(html, /pulse-orbit-segment-hit|role="button"|Ready|Training metronome|pulse-global-summary/)
      assert.ok(html.includes('--tempo-heat-color:' + getTempoColor(props.bpm)))
    }
  }
})

test('mini polyrhythm renders the right segment counts and independently active pulses', () => {
  for (const [polyRhythm1, polyRhythm2] of [[3, 4], [1, 16], [13, 7]]) {
    const html = renderToStaticMarkup(createElement(GlobalTransport, {
      ...miniDefaults, polyrhythmMode: true, polyRhythm1, polyRhythm2, polyBeat1: 0, polyBeat2: polyRhythm2 - 1,
    }))
    assert.equal((html.match(/data-rhythm="one"/g) || []).length, polyRhythm1)
    assert.equal((html.match(/data-rhythm="two"/g) || []).length, polyRhythm2)
    assert.equal((html.match(/data-active="true"/g) || []).length, 2)
    assert.doesNotMatch(html, /pulse-orbit-segment-hit/)
  }
})

test('mini transport nudges respect tempo ownership and limits; playback and navigation stay available', () => {
  for (const tempoEnabled of [false, true]) for (const polyrhythmMode of [false, true]) for (const bpm of [20, 120, 300]) {
    const changes = []
    let toggles = 0
    let opens = 0
    const node = GlobalTransport({ ...miniDefaults, bpm, tempoEnabled, polyrhythmMode,
      onBpmChange: value => changes.push(value), onToggle: () => toggles++, onOpenMetronome: () => opens++,
    })
    const panel = node.props.children[1].props.children.props.children
    const [orbit, controls] = panel.props.children
    const [minus, play, plus] = controls.props.children
    const locked = tempoEnabled && !polyrhythmMode
    assert.equal(minus.props.disabled, locked || bpm === 20)
    assert.equal(plus.props.disabled, locked || bpm === 300)
    minus.props.onClick()
    plus.props.onClick()
    assert.deepEqual(changes, locked ? [] : [Math.max(20, bpm - 1), Math.min(300, bpm + 1)])
    play.props.onClick()
    orbit.props.onClick()
    assert.equal(toggles, 1)
    assert.equal(opens, 1)
    assert.equal(play.props['aria-label'], 'Stop metronome')
    assert.equal(play.props['aria-pressed'], true)
  }
})

test('mini transport collapses accessibly without changing playback and can reopen', () => {
  let collapsed = false
  let playbackCalls = 0
  for (const nextCollapsed of [true, false, true, false]) {
    const props = { ...miniDefaults, collapsed, onCollapsedChange: value => { collapsed = value }, onToggle: () => playbackCalls++ }
    const tree = GlobalTransport(props)
    const [handle, reveal] = tree.props.children
    assert.equal(handle.props['aria-expanded'], !collapsed)
    assert.equal(handle.props['aria-controls'], reveal.props.id)
    assert.equal(reveal.props['aria-hidden'], collapsed)
    assert.equal(reveal.props.inert, collapsed ? true : undefined)
    assert.equal(handle.props['aria-label'], collapsed ? 'Show mini metronome' : 'Hide mini metronome')
    handle.props.onClick()
    assert.equal(collapsed, nextCollapsed)
    assert.equal(playbackCalls, 0)
  }
})

test('mini dock overlays scrollable content and its edge handle adds no card height', async () => {
  const source = await readFile(new URL('../src/components/layout/AppShell.jsx', import.meta.url), 'utf8')
  assert.match(source, /pulse-app-content/)
  assert.match(source, /<GlobalTransport[\s\S]*?\/>[\s\S]*?<\/div>\s*<BottomNav/)
  const dock = appCss.match(/\.pulse-global-dock\s*\{([^}]*)\}/)[1]
  const handle = appCss.match(/\.pulse-global-handle\s*\{([^}]*)\}/)[1]
  assert.match(dock, /position: absolute/)
  assert.match(dock, /28%, transparent/)
  assert.match(dock, /backdrop-filter: blur\(10px\)/)
  assert.match(handle, /position: absolute/)
  assert.match(handle, /top: -22px/)
  assert.match(handle, /height: 44px/)
  assert.match(appCss, /\.has-mini-transport \.pulse-feature-scroll\s*\{\s*padding-bottom: 148px/)
  assert.match(appCss, /\.pulse-global-dock\.is-collapsed\s*\{[^}]*pointer-events: none/)
})

test('Training shares the exact BPM slider colour mapping across the tempo range', () => {
  for (const bpm of [20, 90, 110, 180, 213, 260, 300]) {
    const html = renderToStaticMarkup(createElement(TrainingScreen, {
      ...defaults, bpm, gapEnabled: false, tempoEnabled: false, subdivTrainerEnabled: false,
      subdivTrainerStages: [{ subdivision: 1, bars: 2 }, { subdivision: 2, bars: 2 }],
    }))
    assert.ok(html.includes(`--tempo-heat-color:${getTempoColor(bpm)}`))
  }
})

test('all trainer combinations render accessible, controlled switches, including Polyrhythm pause', () => {
  for (const stageCount of [2, 3, 4]) {
    const stages = Array.from({ length: stageCount }, (_, index) => ({ subdivision: index + 1, bars: 2 }))
    for (let mask = 0; mask < 8; mask += 1) {
      const enabled = [0, 1, 2].map((bit) => Boolean(mask & (1 << bit)))
      for (const polyrhythmMode of [false, true]) {
        const html = renderToStaticMarkup(createElement(TrainingScreen, {
          ...defaults,
          gapEnabled: enabled[0],
          tempoEnabled: enabled[1],
          subdivTrainerEnabled: enabled[2],
          subdivTrainerStages: stages,
          polyrhythmMode,
        }))
        const switches = [...html.matchAll(/<button\b[^>]*role="switch"[^>]*>[\s\S]*?<\/button>/g)].map(([markup]) => markup)
        assert.equal(switches.length, 3)
        const trainerNames = ['Gap Trainer', 'Tempo Trainer', 'Subdivision Trainer']
        const settingsIds = ['gap-trainer-settings', 'tempo-trainer-settings', 'subdivision-trainer-settings']
        for (const [index, name] of trainerNames.entries()) {
          const markup = switches[index]
          assert.ok(markup.includes(`aria-label="Enable ${name}"`))
          assert.ok(markup.includes(`aria-checked="${enabled[index]}"`))
          assert.ok(markup.includes(`aria-controls="${settingsIds[index]}"`))
          assert.ok(markup.includes(`aria-expanded="${enabled[index]}"`))
          assert.equal(markup.includes('disabled=""'), polyrhythmMode)
          assert.match(markup, /type="button"/)
          assert.match(markup, /class="pulse-trainer-toggle"/)
          assert.match(markup, /aria-hidden="true"/)
          assert.doesNotMatch(markup, />On<|>Off<|pulse-switch-track/)
        }
        const reveals = [...html.matchAll(/<div\b[^>]*pulse-trainer-settings-reveal[^>]*>/g)].map(([tag]) => tag)
        assert.equal(reveals.length, 2)
        for (const [index, tag] of reveals.entries()) {
          assert.ok(tag.includes(`id="${settingsIds[index + 1]}"`))
          assert.equal(tag.includes('is-open'), enabled[index + 1])
          assert.ok(tag.includes(`aria-hidden="${!enabled[index + 1]}"`))
          assert.equal(tag.includes('inert=""'), !enabled[index + 1])
        }
        const fields = [...html.matchAll(/<fieldset\b[^>]*>/g)].map(([tag]) => tag)
        assert.equal(fields.length, 2)
        assert.equal(fields[0].includes('disabled=""'), !enabled[1] || polyrhythmMode)
        assert.equal(fields[1].includes('disabled=""'), !enabled[2] || polyrhythmMode)
        const wheels = [...html.matchAll(/<div\b[^>]*role="spinbutton"[^>]*>/g)].map(([tag]) => tag)
        assert.equal(wheels.length, 6 + stageCount)
        wheels.forEach((tag, index) => {
          const trainer = index < 2 ? 0 : index < 6 ? 1 : 2
          const unavailable = !enabled[trainer] || polyrhythmMode
          assert.ok(tag.includes(`aria-disabled="${unavailable}"`))
          assert.ok(tag.includes(`tabindex="${unavailable ? -1 : 0}"`))
        })
        assert.equal(html.includes('Training paused'), polyrhythmMode)
        assert.equal((html.match(/class="pulse-stage-card/g) || []).length, stageCount)
        assert.ok(html.includes('aria-valuenow="80"') && html.includes('aria-valuenow="140"'))
      }
    }
  }
})

test('inactive settings are inert and collapsed while their configured values remain mounted', () => {
  const html = renderToStaticMarkup(createElement(TrainingScreen, {
    ...defaults,
    gapEnabled: false,
    tempoEnabled: false,
    subdivTrainerEnabled: false,
    subdivTrainerStages: [
      { subdivision: 3, bars: 5 },
      { subdivision: 4, bars: 7 },
    ],
    polyrhythmMode: false,
  }))
  const collapsedReveals = [...html.matchAll(/<div\b[^>]*pulse-trainer-settings-reveal[^>]*>/g)].map(([tag]) => tag)
  assert.equal(collapsedReveals.length, 2)
  assert.ok(collapsedReveals.every((tag) => tag.includes('inert=""')))
  assert.ok(collapsedReveals.every((tag) => tag.includes('aria-hidden="true"')))
  assert.ok(html.includes('aria-valuenow="80"') && html.includes('aria-valuenow="140"'))
  assert.ok(html.includes('Stage A') && html.includes('Stage B'))
  for (const [title, description] of [
    ['Gap Trainer', 'Alternate between clicks and silence.'],
    ['Tempo Trainer', 'Change BPM at set intervals.'],
    ['Subdivision Trainer', 'Cycle through subdivisions.'],
  ]) {
    assert.ok(html.includes(`<h2>${title}</h2><p class="pulse-trainer-description">${description}</p>`))
  }
  assert.match(appCss, /\.pulse-trainer-settings-reveal\s*\{[\s\S]*?grid-template-rows:\s*0fr;/)
  assert.match(appCss, /\.pulse-trainer-settings-reveal\.is-open\s*\{[\s\S]*?grid-template-rows:\s*1fr;/)
  assert.match(appCss, /grid-template-rows var\(--trainer-disengage-duration\) var\(--trainer-disengage-ease\)/)
  assert.match(appCss, /grid-template-rows var\(--trainer-engage-duration\) var\(--trainer-engage-ease\)/)
  assert.match(appCss, /@media \(prefers-reduced-motion: reduce\)/)
})

test('card readouts follow saved trainer values, including unequal subdivision stage lengths', () => {
  const setup = {
    ...defaults,
    gapClickBars: 7,
    gapSilentBars: 3,
    tempoStartBpm: 92,
    tempoTargetBpm: 167,
    polyrhythmMode: false,
  }
  for (const enabled of [false, true]) {
    for (const bars of [[5, 5], [5, 7], [1, 2, 3, 4]]) {
      const html = renderToStaticMarkup(createElement(TrainingScreen, {
        ...setup,
        gapEnabled: enabled,
        tempoEnabled: enabled,
        subdivTrainerEnabled: enabled,
        subdivTrainerStages: bars.map((length, index) => ({ subdivision: index + 1, bars: length })),
      }))
      const readouts = [...html.matchAll(/<dl class="pulse-trainer-metrics"[^>]*>([\s\S]*?)<\/dl>/g)]
        .map(([, markup]) => [...markup.matchAll(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/g)]
          .map(([, label, value]) => [label, Number(value.match(/aria-valuenow="(\d+)"/)?.[1] ?? value)]))
      assert.deepEqual(readouts[0], [['Click bars', 7], ['Silent bars', 3]])
      assert.deepEqual(readouts[1], [['Start BPM', 92], ['Target BPM', 167]])
      assert.ok(html.includes('aria-label="Subdivision sequence, clicks per beat"'))
      bars.forEach((_, index) => {
        assert.ok(html.includes(`Stage ${['A', 'B', 'C', 'D'][index]}: ${index + 1} ${index === 0 ? 'click' : 'clicks'} per beat`))
      })
    }
  }
})

test('subdivision preview highlights only the current playing stage, including repeated and two-digit counts', () => {
  for (const enabled of [false, true]) for (const isPlaying of [false, true]) for (const disabled of [false, true]) {
    for (const activeStageIndex of [0, 1, 2, 3]) {
      const counts = [1, 13, 1, 12]
      const html = renderToStaticMarkup(createElement(SubdivisionTrainer, {
        enabled, isPlaying, disabled, activeStageIndex, activeBar: 1,
        stages: counts.map(subdivision => ({ subdivision, bars: 2 })), onChange() {},
      }))
      const preview = html.match(/<ol aria-label="Subdivision sequence, clicks per beat">([\s\S]*?)<\/ol>/)[1]
      const items = [...preview.matchAll(/<li([^>]*)>([\s\S]*?)<\/li>/g)]
      assert.equal(items.length, 4)
      items.forEach(([, attributes, content], index) => {
        assert.equal(attributes.includes('aria-current="step"'), enabled && isPlaying && !disabled && activeStageIndex === index)
        assert.ok(content.includes(`data-subdivision="${counts[index]}"`))
      })
      assert.equal((preview.match(/class="pulse-trainer-sequence-arrow" aria-hidden="true"/g) || []).length, 3)
      assert.doesNotMatch(preview, /button|spinbutton/)
    }
  }
})

test('native switch activates immediately, with no animation lockout or duplicate keyboard handler', () => {
  let enabled = false
  let calls = 0
  const onToggle = () => { enabled = !enabled; calls += 1 }
  for (let tap = 0; tap < 21; tap += 1) {
    const button = TrainerToggle({ enabled, label: 'Enable Gap Trainer', onToggle })
    assert.equal(button.type, 'button')
    assert.equal(button.props['aria-checked'], enabled)
    assert.equal(button.props.onClick, onToggle)
    assert.equal(button.props.onKeyDown, undefined)
    button.props.onClick()
    assert.equal(calls, tap + 1)
  }
  assert.equal(enabled, true)
  assert.equal(TrainerToggle({ enabled, disabled: true, label: 'Enable Gap Trainer', onToggle }).props.disabled, true)
})

function findTrainerHeader(element) {
  if (element?.type === TrainerCardHeader) return element
  for (const child of [element?.props?.children].flat()) {
    const result = findTrainerHeaderChild(child)
    if (result) return result
  }
}

function findTrainerHeaderChild(child) {
  return child && typeof child === 'object' ? findTrainerHeader(child) : undefined
}

test('Gap and Subdivision switches preserve trainer configuration in both directions', () => {
  const stages = [{ subdivision: 3, bars: 5 }, { subdivision: 4, bars: 7 }]
  for (const enabled of [false, true]) {
    let gapArgs
    const gap = GapTraining({ enabled, clickBars: 7, silentBars: 3, onChange: (...args) => { gapArgs = args } })
    findTrainerHeader(gap).props.onToggle()
    assert.deepEqual(gapArgs, [!enabled, 7, 3])
    let stageArgs
    const subdivision = SubdivisionTrainer({ enabled, stages, isPlaying: false, onChange: (...args) => { stageArgs = args } })
    findTrainerHeader(subdivision).props.onToggle()
    assert.deepEqual(stageArgs, [!enabled, stages])
    assert.equal(stageArgs[1], stages)
  }
})

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  assert.notEqual(start, -1)
  return css.slice(start).split('}')[0]
}

function number(text, property) {
  const match = text.match(new RegExp(`${property}:\\s*(-?[\\d.]+)`))
  assert.ok(match, `Missing ${property}`)
  return Number(match[1])
}

test('approved housing sits flush at the card edge and controls retain clearance on phones', () => {
  const stack = block('.pulse-training-stack')
  const target = number(stack, '--throwoff-target-width')
  const gutter = number(stack, '--throwoff-gutter')
  const clearance = number(stack, '--throwoff-clearance')
  const body = block('.pulse-throwoff-body')
  const housingRear = number(body, 'left') + (278 - 200) * 0.07
  assert.ok(Math.abs(-1 + gutter - target + housingRear) < 0.1)
  assert.ok(clearance + gutter - target >= 8)
  for (const viewport of [320, 360, 375, 390, 430]) {
    const contentWidth = viewport - 28 - gutter - 2 - 14 - clearance
    for (const [width, gap] of [[contentWidth, 8], [contentWidth - 22, 10]]) {
      const columns = width >= 240 + gap ? 2 : 1
      assert.ok((width - (columns - 1) * gap) / columns >= 120)
    }
  }
  assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 120px\), 1fr\)\)/)
  const toggle = block('.pulse-trainer-toggle')
  assert.match(toggle, /position: absolute/)
  assert.equal(number(toggle, 'top'), 57)
  assert.doesNotMatch(toggle, /top:\s*50%/)
  assert.match(toggle, /transform: translateY\(-50%\)/)
})

test('the complete lever arc and 3px slide fit inside the stationary touch target', () => {
  const lever = css.match(/\.pulse-throwoff-lever \{\s*--throwoff-angle[^}]+/)[0]
  const frame = block('.pulse-throwoff-mechanism')
  const left = number(lever, 'left')
  const top = number(lever, 'top')
  const slide = number(frame, '--throwoff-slide-distance')
  const height = number(block('.pulse-trainer-toggle'), 'height')
  const frameHeight = number(frame, 'height')
  const width = number(frame, 'width')
  const pivot = lever.match(/transform-origin:\s*([\d.]+)px ([\d.]+)px/).slice(1).map(Number)
  assert.ok(Math.abs(left + pivot[0] - (516 * 0.07 + 0.6)) < 0.0001)
  assert.ok(Math.abs(top + pivot[1] - (893 * 0.07 + 5)) < 0.0001)
  assert.equal(slide, 3)
  for (let degrees = 0; degrees <= 26; degrees += 0.5) {
    const angle = degrees * Math.PI / 180
    for (const [x, y] of [[821, 147], [949, 147], [821, 1157], [949, 1157]]) {
      const dx = (x - 800) * 0.0588 - pivot[0]
      const dy = (y - 125) * 0.0588 - pivot[1]
      const screenX = left + pivot[0] + dx * Math.cos(angle) - dy * Math.sin(angle)
      const screenY = top + pivot[1] + dx * Math.sin(angle) + dy * Math.cos(angle) + (height - frameHeight) / 2
      // The optimized geometry must reproduce the old atlas at every angle,
      // not just stay inside the hit target at its two endpoints.
      const oldX = (516 + (x - 903) * 0.84 * Math.cos(angle) - (y - 1083) * 0.84 * Math.sin(angle)) * 0.07 + 0.6
      const oldY = (893 + (x - 903) * 0.84 * Math.sin(angle) + (y - 1083) * 0.84 * Math.cos(angle)) * 0.07 + 5 + (height - frameHeight) / 2
      assert.ok(Math.abs(screenX - oldX) < 0.0001)
      assert.ok(Math.abs(screenY - oldY) < 0.0001)
      assert.ok(screenX >= 0 && screenX <= width)
      assert.ok(screenY >= 0 && screenY + slide <= height)
    }
  }
  assert.match(css, /--trainer-engage-duration: 210ms/)
  assert.match(css, /--trainer-disengage-duration: 270ms/)
  assert.match(css, /transform var\(--trainer-engage-duration\) var\(--trainer-engage-ease\)/)
  assert.match(css, /transform var\(--trainer-disengage-duration\) var\(--trainer-disengage-ease\)/)
  assert.match(css, /:not\(:disabled\):active/)
  const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(reducedMotion, /transition: none/)
  assert.match(reducedMotion, /--throwoff-angle: 26deg/)
  assert.match(reducedMotion, /--throwoff-angle: 0deg/)
})

test('production uses tiny transparent sprites without runtime masks or filters', async () => {
  assert.doesNotMatch(css, /clip-path:|filter:|1254px|scale\(/)
  assert.doesNotMatch(css, /url\(/)
  assert.doesNotMatch(css, /mockups\//)
  let bytes = 0, pixels = 0
  for (const [part, width, height] of [['body', 91, 255], ['lever', 29, 186]]) {
    const asset = await readFile(new URL(`../src/assets/trainer-throwoff-${part}.png`, import.meta.url))
    assert.equal(asset.subarray(1, 4).toString(), 'PNG')
    assert.equal(asset.readUInt32BE(16), width)
    assert.equal(asset.readUInt32BE(20), height)
    assert.equal(asset[25], 6, 'RGBA sprites retain baked transparency')
    bytes += asset.length
    pixels += width * height
  }
  assert.ok(bytes < 40_000, 'The two production sprites stay below 40 KB combined')
  assert.ok(pixels < 30_000, 'Decoded sprites stay below 30,000 pixels combined')
  const source = await readFile(new URL('../src/components/training/TrainerToggle.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /trainer-throwoff\.png|throwoff-atlas/)
  assert.doesNotMatch(source, /mockups\/|setTimeout|requestAnimationFrame|localStorage|AudioContext|useState/)
})

test('both artwork layers receive the bundled image URL, independent of the page location', () => {
  for (const enabled of [false, true]) {
    const button = TrainerToggle({ enabled, label: 'Enable Gap Trainer', onToggle() {} })
    const art = button.props.children.props.children
    for (const [index, part] of ['body', 'lever'].entries()) {
      const image = art.props.children[index]
      assert.equal(image.type, 'img')
      assert.equal(image.props.alt, '')
      assert.equal(image.props.draggable, false)
      assert.equal(image.props.className, `pulse-throwoff-${part}`)
      assert.match(image.props.src, new RegExp(`^/metronome-app/assets/trainer-throwoff-${part}-[\\w-]+\\.png$`))
      for (const path of ['/metronome-app/', '/metronome-app/?view=training']) {
        assert.equal(new URL(image.props.src, `http://localhost:5176${path}`).pathname, image.props.src)
      }
    }
  }
})
