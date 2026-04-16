import { VOICES, SYMBOLS, VALID_TIME_DIVISIONS } from './grooveConstants'

export const GROOVE_VERSION = 1

function emptyVoiceArrays(length) {
  const voices = {}
  for (const v of VOICES) voices[v] = new Array(length).fill('-')
  return voices
}

export function createEmptyGroove({ timeDivision = 16 } = {}) {
  return {
    version: GROOVE_VERSION,
    timeSignature: { numBeats: 4, noteValue: 4 },
    timeDivision,
    numberOfMeasures: 1,
    voices: emptyVoiceArrays(timeDivision),
  }
}

// Basic rock beat: hats on every 16th, snare on beats 2 and 4, kick on 1 and 3.
export function createDefaultGroove() {
  const g = createEmptyGroove({ timeDivision: 16 })
  g.voices.hh = g.voices.hh.map(() => 'x')
  g.voices.snare[4] = 'o'
  g.voices.snare[12] = 'o'
  g.voices.kick[0] = 'o'
  g.voices.kick[8] = 'o'
  return g
}

export function toggleSlot(pattern, voice, slotIndex) {
  const cycle = SYMBOLS[voice]
  if (!cycle) return pattern
  const arr = pattern.voices[voice]
  if (!arr || slotIndex < 0 || slotIndex >= arr.length) return pattern
  const currentIdx = cycle.indexOf(arr[slotIndex])
  const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % cycle.length
  const nextArr = [...arr]
  nextArr[slotIndex] = cycle[nextIdx]
  return {
    ...pattern,
    voices: { ...pattern.voices, [voice]: nextArr },
  }
}

export function setSlotSymbol(pattern, voice, slotIndex, symbol) {
  const cycle = SYMBOLS[voice]
  if (!cycle || !cycle.includes(symbol)) return pattern
  const arr = pattern.voices[voice]
  if (!arr || slotIndex < 0 || slotIndex >= arr.length) return pattern
  const nextArr = [...arr]
  nextArr[slotIndex] = symbol
  return {
    ...pattern,
    voices: { ...pattern.voices, [voice]: nextArr },
  }
}

// Resize all voice arrays to a new length, preserving data where possible and padding with '-'.
export function resizePattern(pattern, newDivision) {
  if (!VALID_TIME_DIVISIONS.includes(newDivision)) return pattern
  if (pattern.timeDivision === newDivision) return pattern
  const next = { ...pattern, timeDivision: newDivision, voices: {} }
  for (const v of VOICES) {
    const old = pattern.voices[v] || []
    const arr = new Array(newDivision).fill('-')
    const copyLen = Math.min(old.length, newDivision)
    for (let i = 0; i < copyLen; i++) arr[i] = old[i]
    next.voices[v] = arr
  }
  return next
}

export function clearVoice(pattern, voice) {
  const arr = pattern.voices[voice]
  if (!arr) return pattern
  return {
    ...pattern,
    voices: { ...pattern.voices, [voice]: arr.map(() => '-') },
  }
}

export function clearAll(pattern) {
  return {
    ...pattern,
    voices: emptyVoiceArrays(pattern.timeDivision),
  }
}

// Coerce a stored symbol into the current SYMBOLS set for a voice. Unknown
// symbols become '-'. Legacy values get a sensible migration so existing
// patterns don't silently lose notes when the symbol set narrows.
function migrateSymbol(voice, sym) {
  if (SYMBOLS[voice].includes(sym)) return sym
  // hi-hat no longer has an accent state — collapse 'X' into 'x' (on).
  if (voice === 'hh' && sym === 'X') return 'x'
  return '-'
}

// Runtime validator — returns a fresh default if the stored shape is incompatible.
export function normalizeGroove(raw) {
  try {
    if (!raw || typeof raw !== 'object') return createDefaultGroove()
    if (raw.version !== GROOVE_VERSION) return createDefaultGroove()
    if (!VALID_TIME_DIVISIONS.includes(raw.timeDivision)) return createDefaultGroove()
    const voices = {}
    for (const v of VOICES) {
      const arr = raw.voices?.[v]
      if (!Array.isArray(arr) || arr.length !== raw.timeDivision) {
        voices[v] = new Array(raw.timeDivision).fill('-')
      } else {
        voices[v] = arr.map((sym) => migrateSymbol(v, sym))
      }
    }
    return {
      version: GROOVE_VERSION,
      timeSignature: {
        numBeats: raw.timeSignature?.numBeats || 4,
        noteValue: raw.timeSignature?.noteValue || 4,
      },
      timeDivision: raw.timeDivision,
      numberOfMeasures: raw.numberOfMeasures || 1,
      voices,
    }
  } catch {
    return createDefaultGroove()
  }
}
