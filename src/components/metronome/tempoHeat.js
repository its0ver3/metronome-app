import { MAX_BPM, MIN_BPM, clampBpm } from '../../audio/constants.js'

export const FIRE_MIN_BPM = MAX_BPM - 9

export const TEMPO_COLOR_STOPS = Object.freeze([
  Object.freeze({ bpm: MIN_BPM, label: 'Blue', color: '#3B82F6' }),
  Object.freeze({ bpm: 110, label: 'Green', color: '#22C55E' }),
  Object.freeze({ bpm: 200, label: 'Yellow', color: '#FACC15' }),
  Object.freeze({ bpm: FIRE_MIN_BPM - 1, label: 'Red', color: '#EF4444' }),
  Object.freeze({ bpm: MAX_BPM, label: 'Fire', color: '#FF6B00' }),
])

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function interpolateColor(startColor, endColor, progress) {
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)

  return rgbToHex(start.map((channel, index) => (
    channel + ((end[index] - channel) * progress)
  )))
}

function getSliderProgress(bpm) {
  return ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100
}

export const TEMPO_SLIDER_GRADIENT = `linear-gradient(to right, ${TEMPO_COLOR_STOPS
  .map(({ bpm, color }) => `${color} ${getSliderProgress(bpm)}%`)
  .join(', ')})`

export function getTempoColor(bpm) {
  const value = clampBpm(bpm)
  const upperIndex = TEMPO_COLOR_STOPS.findIndex(({ bpm: stopBpm }) => value <= stopBpm)

  if (upperIndex <= 0) return TEMPO_COLOR_STOPS[0].color

  const lower = TEMPO_COLOR_STOPS[upperIndex - 1]
  const upper = TEMPO_COLOR_STOPS[upperIndex]
  const progress = (value - lower.bpm) / (upper.bpm - lower.bpm)

  return interpolateColor(lower.color, upper.color, progress)
}

export function getTempoHeat(bpm) {
  const value = clampBpm(bpm)
  const isFire = value >= FIRE_MIN_BPM

  return {
    id: isFire ? 'fire' : 'gradient',
    label: isFire ? 'Fire' : 'Tempo gradient',
    bpm: value,
    color: getTempoColor(value),
    sliderGradient: TEMPO_SLIDER_GRADIENT,
    sliderProgress: getSliderProgress(value),
  }
}
