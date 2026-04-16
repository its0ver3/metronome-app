// Voice identifiers used across engine, UI, and storage
export const VOICES = ['hh', 'snare', 'kick', 'tom1', 'tom2', 'tom3']

export const VOICE_LABELS = {
  hh: 'Hi-Hat',
  snare: 'Snare',
  kick: 'Kick',
  tom1: 'Tom 1',
  tom2: 'Tom 2',
  tom3: 'Tom 3',
}

// Cycle order per tap. First entry is "off", then normal, accent, then voice-specific extras.
export const SYMBOLS = {
  hh: ['-', 'x', 'X', 'o'],
  snare: ['-', 'o', 'O', 'g'],
  kick: ['-', 'o'],
  tom1: ['-', 'o'],
  tom2: ['-', 'o'],
  tom3: ['-', 'o'],
}

// Volume + human-readable label per symbol. Volumes are tuned for synth kit.
export const ARTICULATION_META = {
  '-': { label: 'Off', volume: 0 },
  x: { label: 'Normal', volume: 0.55 },
  X: { label: 'Accent', volume: 0.9 },
  o: { label: 'Normal', volume: 0.85 },
  O: { label: 'Accent', volume: 1 },
  g: { label: 'Ghost', volume: 0.22 },
}

// ABC-notation pitch per voice for sheet music rendering on a percussion clef.
// These are standard percussion-clef placements.
export const VOICE_TO_ABC_PITCH = {
  kick: 'F',
  snare: 'c',
  hh: 'g',
  tom1: 'e',
  tom2: 'd',
  tom3: 'A',
}

// General MIDI drum note numbers (unused today — reserved for future sample loading).
export const VOICE_TO_MIDI = {
  kick: 36,
  snare: 38,
  hh: 42,
  tom1: 48,
  tom2: 45,
  tom3: 43,
}

export const TIME_DIVISIONS = [8, 12, 16, 24]
export const COUNT_IN_OPTIONS = [0, 1, 2]
export const MIN_GROOVE_BPM = 30
export const MAX_GROOVE_BPM = 300
