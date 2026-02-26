export const LOOKAHEAD_MS = 25
export const SCHEDULE_AHEAD_S = 0.05
export const MIN_BPM = 20
export const MAX_BPM = 240
export const DEFAULT_BPM = 120
export const DEFAULT_BEATS_PER_BAR = 4
export const DEFAULT_BEAT_UNIT = 4

export const ACCENT_LEVELS = {
  STRONG: { name: 'Strong', volume: 1.0 },
  MEDIUM: { name: 'Medium', volume: 0.7 },
  NORMAL: { name: 'Normal', volume: 0.5 },
  GHOST: { name: 'Ghost', volume: 0.2 },
  SILENT: { name: 'Silent', volume: 0.0 },
}

export const ACCENT_ORDER = ['STRONG', 'MEDIUM', 'NORMAL', 'GHOST', 'SILENT']

export const SUBDIVISION_TYPES = {
  QUARTER: 1,
  EIGHTH: 2,
  TRIPLET: 3,
  SIXTEENTH: 4,
  QUINTUPLET: 5,
}

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
