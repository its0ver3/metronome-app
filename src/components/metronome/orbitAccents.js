import { normalizeAccentLevel } from '../../audio/constants.js'

export function getStandardOrbitAccentIndex(beat, subdivision) {
  return beat * subdivision
}

export function getOrbitAccentLevel(accents, index) {
  return normalizeAccentLevel(accents?.[index])
}
