import { MAX_BPM, MIN_BPM, clampBpm } from '../../audio/constants.js'

export const FIRE_MIN_BPM = MAX_BPM - 9

export const TEMPO_COLOR_STOPS = Object.freeze([
  Object.freeze({ bpm: MIN_BPM, label: 'Deep teal', color: '#154B55' }),
  Object.freeze({ bpm: 110, label: 'Enamel blue', color: '#3D8790' }),
  Object.freeze({ bpm: 213, label: 'Warm paper', color: '#D8D0B7' }),
  Object.freeze({ bpm: MAX_BPM, label: 'Olive gold', color: '#AAA14E' }),
])

export const TEMPO_SLIDER_COLOR_STOPS = TEMPO_COLOR_STOPS

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

function getSliderProgress(bpm, maxBpm = MAX_BPM) {
  return ((bpm - MIN_BPM) / (maxBpm - MIN_BPM)) * 100
}

export const TEMPO_SLIDER_GRADIENT = `linear-gradient(to right, ${TEMPO_SLIDER_COLOR_STOPS
  .map(({ bpm, color }) => `${color} ${getSliderProgress(bpm)}%`)
  .join(', ')})`

export function getTempoColor(bpm, maxBpm = MAX_BPM) {
  const value = MIN_BPM + (clampBpm(bpm, maxBpm) - MIN_BPM) * (MAX_BPM - MIN_BPM) / (maxBpm - MIN_BPM)
  const upperIndex = TEMPO_COLOR_STOPS.findIndex(({ bpm: stopBpm }) => value <= stopBpm)

  if (upperIndex <= 0) return TEMPO_COLOR_STOPS[0].color

  const lower = TEMPO_COLOR_STOPS[upperIndex - 1]
  const upper = TEMPO_COLOR_STOPS[upperIndex]
  const progress = (value - lower.bpm) / (upper.bpm - lower.bpm)

  return interpolateColor(lower.color, upper.color, progress)
}

export function getTempoHeat(bpm, maxBpm = MAX_BPM) {
  const value = clampBpm(bpm, maxBpm)
  const isFire = value >= maxBpm - 9

  return {
    id: isFire ? 'fire' : 'gradient',
    label: isFire ? 'Fire' : 'Tempo gradient',
    bpm: value,
    color: getTempoColor(value, maxBpm),
    sliderGradient: TEMPO_SLIDER_GRADIENT,
    sliderProgress: getSliderProgress(value, maxBpm),
  }
}
