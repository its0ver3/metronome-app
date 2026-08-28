export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.05
export const MIN_BPM = 20
export const MAX_BPM = 300
export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4

export const ACCENT_LEVELS = {
  OFF: { name: 'Off', volume: 0.0 },
  ON: { name: 'On', volume: 0.25 },
  ACCENT: { name: 'Accent', volume: 1.0 },
}

export const ACCENT_ORDER = ['OFF', 'ON', 'ACCENT']

export const ACCENT_WEDGES = { OFF: 0, ON: 1, ACCENT: 2 }

const LEGACY_ACCENT_LEVELS = {
  LOUD: 'ACCENT',
  STRONG: 'ACCENT',
  MEDIUM: 'ACCENT',
  NORMAL: 'ON',
  GHOST: 'OFF',
  SILENT: 'OFF',
}

export const SUBDIVISION_OPTIONS = [
  { type: 1, label: '1', desc: '1' },
  { type: 2, label: '2', desc: '2' },
  { type: 3, label: '3', desc: '3' },
  { type: 4, label: '4', desc: '4' },
  { type: 5, label: '5', desc: '5' },
  { type: 6, label: '6', desc: '6' },
  { type: 7, label: '7', desc: '7' },
  { type: 8, label: '8', desc: '8' },
  { type: 9, label: '9', desc: '9' },
  { type: 10, label: '10', desc: '10' },
  { type: 11, label: '11', desc: '11' },
  { type: 12, label: '12', desc: '12' },
  { type: 13, label: '13', desc: '13' },
]

export const SUBDIVISION_TRAINER_MIN_STAGES = 2
export const SUBDIVISION_TRAINER_MAX_STAGES = 4
export const DEFAULT_SUBDIVISION_TRAINER_STAGES = [
  { subdivision: 1, bars: 2 },
  { subdivision: 2, bars: 2 },
]

export const SOUND_NAMES = [
  'Classic Click',
  'Woodblock',
  'Rimshot',
  'Cowbell',
  'Hi-Hat',
  'Electronic Beep',
  'Soft Tone',
  'Stick Click',
]

export const POLYRHYTHM_MAX = 16

export function clampBpm(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return DEFAULT_BPM
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(numericValue)))
}

export function cycleAccentLevel(current) {
  const normalized = normalizeAccentLevel(current)
  const idx = ACCENT_ORDER.indexOf(normalized)
  return ACCENT_ORDER[(idx + 1) % ACCENT_ORDER.length]
}

export function normalizeAccentLevel(level) {
  if (ACCENT_LEVELS[level]) return level
  return LEGACY_ACCENT_LEVELS[level] || 'ON'
}

export function buildDefaultSubdivisionAccents(beatsPerBar, subdivision) {
  const total = beatsPerBar * subdivision
  const accents = new Array(total).fill('ON')
  for (let beat = 0; beat < beatsPerBar; beat++) {
    accents[beat * subdivision] = 'ACCENT'
  }
  return accents
}

export function buildDefaultPolyAccents(count) {
  const accents = new Array(count).fill('ON')
  accents[0] = 'ACCENT'
  return accents
}
