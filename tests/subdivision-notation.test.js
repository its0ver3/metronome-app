import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { getSubdivisionNotation, getSubdivisionLabel } from '../src/components/metronome/subdivisionMusic.js'

const compiled = await build({
  stdin: { contents: `
    export { default as Notes } from './src/components/metronome/SubdivisionNotation.jsx'
    export { default as Picker } from './src/components/metronome/SubdivisionPicker.jsx'
    export { default as Stage } from './src/components/training/SubdivisionStage.jsx'
    export { default as Trainer } from './src/components/training/SubdivisionTrainer.jsx'
    export { default as Readout } from './src/components/metronome/RhythmReadout.jsx'
    export { default as MeterPicker, CustomMeterEditor } from './src/components/metronome/MeterPicker.jsx'
  `, resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty', '.png': 'file' }, outdir: 'in-memory',
})
const module = { exports: {} }
new Function('module', 'exports', 'require', compiled.outputFiles.find(file => file.path.endsWith('.js')).text)(module, module.exports, createRequire(import.meta.url))
const { Notes, Picker, Stage, Trainer, Readout, MeterPicker, CustomMeterEditor } = module.exports
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))

test('meter picker keeps presets and uneven grouping with a custom entry', () => {
  for (const [numerator, groups, choices] of [[4, [1, 1, 1, 1], []], [5, [2, 3], ['2 + 3', '3 + 2']], [7, [2, 2, 3], ['2 + 2 + 3', '2 + 3 + 2', '3 + 2 + 2']]]) {
    const meter = { numerator, denominator: numerator === 4 ? 4 : 8, groups, tempoUnit: 'quarter' }
    const html = render(MeterPicker, { meter, onChange() {} })
    assert.doesNotMatch(html, /<details|<form|<input|More|BPM counts|BPM note value/)
    assert.equal((html.match(/<select /g) || []).length, 1)
    assert.equal((html.match(/<option /g) || []).length, 9)
    assert.deepEqual([...html.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map(match => match[1]), ['4/4', '3/4', '2/4', '5/8', '6/8', '7/8', '9/8', '12/8', 'Custom…'])
    assert.equal((html.match(/<button /g) || []).length, choices.length)
    for (const label of choices) assert.ok(html.includes(`>${label}</button>`))
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, choices.length ? 1 : 0)
  }
})

test('every 1–13 subdivision engraves a complete quarter-beat group with the correct beams and tuplets', () => {
  for (let count = 1; count <= 13; count++) {
    const spec = getSubdivisionNotation(count)
    const html = render(Notes, { count })
    assert.equal((html.match(/scale\(\.032 -\.032\)/g) || []).length, count)
    assert.equal((html.match(/stroke-width="1.2"/g) || []).length, count)
    assert.equal((html.match(/stroke-width="3"/g) || []).length, Math.floor(Math.log2(count)))
    assert.equal(html.includes('pulse-notation-tuplet'), ![1, 2, 4, 8].includes(count))
    if (spec.tuplet) assert.match(html, new RegExp(`>${count}</text>`))
    assert.ok(spec.width >= (count === 1 ? 15 : 8) + (count - 1) * 14 + 9.8)
    assert.ok(getSubdivisionLabel(count).includes(`${count} ${count === 1 ? 'click' : 'clicks'} per beat`))
  }
  for (const count of [0, 14, 1.5, NaN]) assert.throws(() => getSubdivisionNotation(count), RangeError)
})

test('main selector is a compact closed dropdown and respects trainer ownership', () => {
  for (let subdivision = 1; subdivision <= 13; subdivision++) for (const disabled of [false, true]) {
    const html = render(Picker, { subdivision, disabled, onChange() {} })
    assert.equal((html.match(/<button /g) || []).length, 1)
    assert.match(html, /aria-haspopup="listbox"/)
    assert.match(html, /aria-expanded="false"/)
    assert.equal((html.match(/disabled=""/g) || []).length, disabled ? 1 : 0)
    assert.ok(html.includes(`data-subdivision="${subdivision}"`))
    assert.ok(html.includes(disabled ? 'Controlled by Subdivision Trainer' : getSubdivisionNotation(subdivision).name))
    assert.doesNotMatch(html, /<select|spinbutton/)
  }
})

test('stage controls show notation and keep only bars numeric, without mounting closed option rails', () => {
  for (const subdivision of [1, 3, 4, 13]) for (const disabled of [false, true]) {
    const html = render(Stage, { stage: { subdivision, bars: 7 }, index: 2, isActive: true, activeBar: 2, disabled })
    assert.ok(html.includes(`data-subdivision="${subdivision}"`))
    assert.equal((html.match(/role="spinbutton"/g) || []).length, 1)
    assert.match(html, /aria-label="Stage C bars"/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /Remove stage C/)
    assert.match(html, /Active · Bar 2 of 7/)
    assert.doesNotMatch(html, /class="pulse-notation-rail"/)
  }
})

test('subdivision stage edits retain saved bars and use the existing trainer callback', () => {
  const stages = [{ subdivision: 2, bars: 3 }, { subdivision: 4, bars: 8 }]
  let result
  const tree = Trainer({ stages, enabled: true, onChange: (...args) => { result = args } })
  const fieldset = tree.props.children[1].props.children.props.children
  const stageElements = fieldset.props.children[1].props.children
  stageElements[1].props.onSubdivisionChange(13)
  assert.deepEqual(result, [true, [{ subdivision: 2, bars: 3 }, { subdivision: 13, bars: 8 }]])
  assert.deepEqual(stages[1], { subdivision: 4, bars: 8 })
})

test('standard pill uses the saved note group while polyrhythm keeps its distinct pulse counts', () => {
  const props = { beatsPerBar: 4, subdivision: 7, polyRhythm1: 3, polyRhythm2: 5 }
  const standard = render(Readout, { ...props, polyrhythmMode: false })
  assert.match(standard, /data-subdivision="7"/)
  assert.match(standard, /4 beats, 7 clicks per beat/)
  const poly = render(Readout, { ...props, polyrhythmMode: true })
  assert.doesNotMatch(poly, /data-subdivision/)
  assert.match(poly, /<small>A<\/small>3/)
  assert.match(poly, /<small>B<\/small>5/)
})


test('custom denominators engrave correct note values and expose matching labels', () => {
  for (const denominator of [2, 4, 8, 16]) for (let count = 1; count <= 13; count++) {
    const html = render(Notes, { count, denominator })
    const beams = Math.max(0, Math.floor(Math.log2(count)) + Math.log2(denominator) - 2)
    assert.equal((html.match(/stroke-width="3"/g) || []).length, count === 1 ? 0 : beams)
    if (count === 1 && denominator >= 8) assert.match(html, new RegExp(`data-flags="${beams}"`))
    assert.doesNotMatch(html, /undefined|NaN/)
  }
  assert.equal(getSubdivisionNotation(1, 2).name, 'Half notes')
  assert.equal(getSubdivisionNotation(1, 2).hollow, true)
  assert.equal(getSubdivisionNotation(1, 16).name, 'Sixteenth notes')
  assert.equal(getSubdivisionNotation(3, 16).name, 'Thirty-second-note triplets')
  assert.equal(getSubdivisionNotation(8, 16).beams, 5)
  assert.match(getSubdivisionLabel(2, 16), /2 clicks per sixteenth note/)
  const html = render(CustomMeterEditor, { meter: { numerator: 15, denominator: 16, groups: [4, 4, 4, 3] }, onApply() {}, onCancel() {} })
  assert.match(html, /value="16" selected/)
  assert.match(html, /value="4\+4\+4\+3"/)
  assert.doesNotMatch(html, /disabled=""/)
})
