// Each pattern spans one written denominator note, just like the subdivision picker.
export const GAP_PATTERNS = [
  { id: 'silence', divisions: 1, hits: [] },
  { id: 'offbeat', divisions: 2, hits: [1] },
  { id: 'second', divisions: 4, hits: [1] },
  { id: 'fourth', divisions: 4, hits: [3] },
  { id: 'triplet-second', divisions: 3, hits: [1] },
  { id: 'triplet-third', divisions: 3, hits: [2] },
]

export function getGapPattern(id) {
  return GAP_PATTERNS.find(pattern => pattern.id === id) || GAP_PATTERNS[0]
}

export function getGapPatternLabel(id, denominator = 4) {
  const note = denominator === 8 ? '32nd' : '16th'
  return {
    silence: 'Silence',
    offbeat: 'Offbeat &',
    second: `${note} e`,
    fourth: `${note} a`,
    'triplet-second': 'Triplet · 2nd',
    'triplet-third': 'Triplet · 3rd',
  }[getGapPattern(id).id]
}

export function getGapPatternDescription(id, denominator = 4) {
  const unit = denominator === 8 ? 'eighth note' : 'beat'
  return {
    silence: 'Rest for the whole bar',
    offbeat: `Click halfway through each ${unit}`,
    second: `Click on the second of four divisions of each ${unit}`,
    fourth: `Click on the fourth of four divisions of each ${unit}`,
    'triplet-second': `Click on the second triplet of each ${unit}`,
    'triplet-third': `Click on the third triplet of each ${unit}`,
  }[getGapPattern(id).id]
}
