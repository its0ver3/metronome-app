import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIRE_MIN_BPM,
  TEMPO_COLOR_STOPS,
  TEMPO_SLIDER_GRADIENT,
  getTempoColor,
  getTempoHeat,
} from '../src/components/metronome/tempoHeat.js'

test('tempo color anchors span the full range and keep fire to the top ten BPM', () => {
  assert.equal(FIRE_MIN_BPM, 291)
  assert.deepEqual(TEMPO_COLOR_STOPS, [
    { bpm: 20, label: 'Blue', color: '#3B82F6' },
    { bpm: 110, label: 'Green', color: '#22C55E' },
    { bpm: 200, label: 'Yellow', color: '#FACC15' },
    { bpm: 290, label: 'Red', color: '#EF4444' },
    { bpm: 300, label: 'Fire', color: '#FF6B00' },
  ])

  assert.equal(getTempoHeat(290).id, 'gradient')
  assert.equal(getTempoHeat(291).id, 'fire')
  assert.equal(getTempoHeat(300).id, 'fire')
})

test('tempo color blends continuously between every anchor', () => {
  assert.equal(getTempoColor(20), '#3B82F6')
  assert.equal(getTempoColor(65), '#2FA4AA')
  assert.equal(getTempoColor(110), '#22C55E')
  assert.equal(getTempoColor(155), '#8EC93A')
  assert.equal(getTempoColor(200), '#FACC15')
  assert.equal(getTempoColor(245), '#F5882D')
  assert.equal(getTempoColor(290), '#EF4444')
  assert.equal(getTempoColor(295), '#F75822')
  assert.equal(getTempoColor(300), '#FF6B00')

  for (let bpm = 21; bpm <= 300; bpm += 1) {
    assert.notEqual(getTempoColor(bpm), getTempoColor(bpm - 1))
  }
})

test('tempo slider uses the same gradient and progress across 20–300 BPM', () => {
  assert.match(TEMPO_SLIDER_GRADIENT, /#3B82F6 0%/)
  assert.match(TEMPO_SLIDER_GRADIENT, /#EF4444 96\.42857142857143%/)
  assert.match(TEMPO_SLIDER_GRADIENT, /#FF6B00 100%/)
  assert.equal(getTempoHeat(20).sliderProgress, 0)
  assert.equal(getTempoHeat(160).sliderProgress, 50)
  assert.equal(getTempoHeat(300).sliderProgress, 100)
  assert.equal(getTempoHeat(999).color, '#FF6B00')
  assert.equal(getTempoHeat(-10).color, '#3B82F6')
})
