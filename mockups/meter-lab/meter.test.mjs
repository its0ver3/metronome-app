import test from 'node:test'
import assert from 'node:assert/strict'
import { PRESETS, UNITS, makeSettings, defaultGroups, validateMeter, buildBar, groupSpans } from './meter.js'
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)

test('every preset and custom default has complete, non-overlapping groups and a complete bar', () => {
  for (const d of [4, 8]) for (let n = 1; n <= 16; n++) {
    const settings = makeSettings({ n, d, groups: defaultGroups(n, d) })
    validateMeter(settings)
    const spans = groupSpans(settings)
    near(spans[0].angleStart, -90)
    near(spans.at(-1).angleEnd, 270)
    for (let index = 1; index < spans.length; index++) near(spans[index].angleStart, spans[index - 1].angleEnd)
    for (const bpm of [20, 100, 300]) for (const unit of Object.keys(UNITS)) for (const division of [0, 1, 2, 3, 4]) {
      const bar = buildBar({ ...settings, bpm, unit, division })
      near(bar.duration, n * 4 / d / UNITS[unit].quarters * 60 / bpm)
      assert.equal(bar.events.length, division ? n * division : settings.groups.length)
      near(bar.events[0].offset, 0)
      near(bar.events.at(-1).offset + bar.events.at(-1).duration, bar.duration)
      bar.events.forEach((event, index) => { if (index) assert.ok(event.offset > bar.events[index - 1].offset) })
    }
  }
})
test('6/8 uses two dotted-quarter pulses, not six quarter-note beats', () => {
  const settings = { ...makeSettings(PRESETS[3]), bpm: 120 }
  const bar = buildBar(settings)
  near(bar.duration, 1)
  const accents = bar.events.filter(event => event.strong)
  assert.equal(accents.length, 2)
  near(accents[1].offset, .5)
  assert.equal(bar.events.length, 6)
  near(buildBar({ ...settings, unit: 'eighth' }).duration, 3)
})
test('7/8 group pulses retain 2:2:3 durations and all three grouping orders', () => {
  for (const groups of [[2, 2, 3], [2, 3, 2], [3, 2, 2]]) {
    const settings = { ...makeSettings({ n: 7, d: 8, groups }), bpm: 120, division: 0 }
    const bar = buildBar(settings)
    near(bar.duration, 3.5)
    bar.events.forEach((event, index) => near(event.duration, groups[index] * .5))
    groupSpans(settings).forEach((span, index) => near(span.angleEnd - span.angleStart, groups[index] / 7 * 360))
  }
})
test('Off mutes every click in its group; Accent preserves quieter subdivisions', () => {
  const settings = { ...makeSettings(PRESETS[3]), accents: ['OFF', 'ACCENT'], division: 2 }
  const events = buildBar(settings).events
  assert.ok(events.filter(event => event.group === 0).every(event => !event.audible))
  const second = events.filter(event => event.group === 1)
  assert.ok(second.every(event => event.audible))
  assert.ok(second.slice(1).every(event => event.level < second[0].level))
})
test('all trainers count full bars and compose across every preset', () => {
  for (const preset of PRESETS) {
    const settings = { ...makeSettings(preset), bpm: 100, gap: true, tempo: true, subdiv: true }
    for (let index = 0; index < 12; index++) {
      const bar = buildBar(settings, index)
      assert.equal(bar.silent, index % 3 === 2)
      assert.equal(bar.bpm, 100 + Math.floor(index / 4) * 5)
      assert.equal(bar.stage, Math.floor(index / 2) % 2)
      assert.equal(bar.events.length, preset.n * (bar.stage ? 2 : 1))
      assert.equal(bar.events.some(event => event.audible), !bar.silent)
      near(bar.events.at(-1).offset + bar.events.at(-1).duration, bar.duration)
    }
    assert.equal(buildBar(settings, 999).bpm, 300)
  }
})
test('group-pulse subdivision training moves to the eighth-note grid', () => {
  const settings = { ...makeSettings(PRESETS[7]), division: 0, subdiv: true }
  assert.equal(buildBar(settings, 0).events.length, 3)
  assert.equal(buildBar(settings, 2).events.length, 7)
})
test('invalid custom meters cannot enter playback', () => {
  for (const meter of [{ n: 7, d: 8, groups: [2, 2] }, { n: 7, d: 8, groups: [0, 7] }, { n: 17, d: 8, groups: [17] }, { n: 4, d: 3, groups: [4] }, { n: 7, d: 8, groups: [2.5, 4.5] }]) assert.throws(() => makeSettings(meter), RangeError)
})
