import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIRE_MIN_BPM,
  TEMPO_COLOR_STOPS,
  TEMPO_SLIDER_COLOR_STOPS,
  TEMPO_SLIDER_GRADIENT,
  getTempoColor,
  getTempoHeat,
} from '../src/components/metronome/tempoHeat.js'

test('tempo color anchors span the full range and keep fire to the top ten BPM', () => {
  assert.equal(FIRE_MIN_BPM, 291)
  assert.deepEqual(TEMPO_COLOR_STOPS, [
    { bpm: 20, label: 'Deep teal', color: '#154B55' },
    { bpm: 110, label: 'Enamel blue', color: '#3D8790' },
    { bpm: 213, label: 'Warm paper', color: '#D8D0B7' },
    { bpm: 300, label: 'Olive gold', color: '#AAA14E' },
  ])

  assert.equal(getTempoHeat(290).id, 'gradient')
  assert.equal(getTempoHeat(291).id, 'fire')
  assert.equal(getTempoHeat(300).id, 'fire')
})

test('tempo color blends continuously between every anchor', () => {
  assert.equal(getTempoColor(20), '#154B55')
  assert.equal(getTempoColor(65), '#296973')
  assert.equal(getTempoColor(110), '#3D8790')
  assert.equal(getTempoColor(155), '#81A7A1')
  assert.equal(getTempoColor(200), '#C4C7B2')
  assert.equal(getTempoColor(245), '#C7BF90')
  assert.equal(getTempoColor(290), '#AFA65A')
  assert.equal(getTempoColor(295), '#ADA454')
  assert.equal(getTempoColor(300), '#AAA14E')

  const colors = new Set()
  for (let bpm = 20; bpm <= 300; bpm += 1) {
    const color = getTempoColor(bpm)
    colors.add(color)

    if (bpm > 20) {
      const previous = getTempoColor(bpm - 1)
      const channels = [1, 3, 5].map((index) => Math.abs(
        Number.parseInt(color.slice(index, index + 2), 16)
        - Number.parseInt(previous.slice(index, index + 2), 16),
      ))
      assert.ok(Math.max(...channels) <= 2)
    }
  }
  assert.ok(colors.size > 240)
})

test('tempo slider uses the Blue Olive gradient and progress across 20–300 BPM', () => {
  assert.strictEqual(TEMPO_SLIDER_COLOR_STOPS, TEMPO_COLOR_STOPS)
  assert.deepEqual(TEMPO_SLIDER_COLOR_STOPS, [
    { bpm: 20, label: 'Deep teal', color: '#154B55' },
    { bpm: 110, label: 'Enamel blue', color: '#3D8790' },
    { bpm: 213, label: 'Warm paper', color: '#D8D0B7' },
    { bpm: 300, label: 'Olive gold', color: '#AAA14E' },
  ])
  assert.match(TEMPO_SLIDER_GRADIENT, /#154B55 0%/)
  assert.match(TEMPO_SLIDER_GRADIENT, /#AAA14E 100%/)
  assert.equal(getTempoHeat(20).sliderProgress, 0)
  assert.equal(getTempoHeat(160).sliderProgress, 50)
  assert.equal(getTempoHeat(300).sliderProgress, 100)
  assert.equal(getTempoHeat(999).color, '#AAA14E')
  assert.equal(getTempoHeat(-10).color, '#154B55')
})
