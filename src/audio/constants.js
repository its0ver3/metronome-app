export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.15
export const MAX_SCHEDULER_STEPS = 4096
export const MIN_BPM = 20
export const MAX_BPM = 300
export const JAM_MAX_BPM = 800
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

export const SOUND_OPTIONS = [
  { id: 'classic-click', name: 'Classic Click', kind: 'synth' },
  { id: 'woodblock', name: 'Woodblock', kind: 'synth' },
  { id: 'soft-tone', name: 'Soft Tone', kind: 'synth' },
  { id: 'cowbell', name: 'Cowbell', kind: 'sample' },
  { id: 'hi-hat', name: 'Hi-hat', kind: 'sample' },
  { id: 'shaker', name: 'Shaker', kind: 'sample' },
  { id: 'tambourine', name: 'Tambourine', kind: 'sample' },
  { id: 'male-count', name: 'Male Count', kind: 'voice' },
  { id: 'female-count', name: 'Female Count', kind: 'voice' },
]

export const SOUND_NAMES = SOUND_OPTIONS.map(({ name }) => name)

export const LEGACY_SOUND_INDEX_MAP = [0, 1, 0, 3, 4, 0, 2, 0]

export function getSoundIndexById(id) {
  const index = SOUND_OPTIONS.findIndex((sound) => sound.id === id)
  return index >= 0 ? index : 0
}

export function getSoundIdByIndex(index) {
  return SOUND_OPTIONS[normalizeSoundIndex(index)].id
}

export function normalizeSoundIndex(index) {
  const numericIndex = Number(index)
  if (!Number.isInteger(numericIndex)) return 0
  return Math.max(0, Math.min(SOUND_OPTIONS.length - 1, numericIndex))
}

export const POLYRHYTHM_MAX = 16

export function clampBpm(value, maxBpm = MAX_BPM) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return DEFAULT_BPM
  return Math.max(MIN_BPM, Math.min(maxBpm, Math.round(numericValue)))
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
