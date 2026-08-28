import { normalizeAccentLevel } from '../audio/constants.js'

const STORAGE_KEY = 'drums-only-metronome-settings'

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: 3 }))
  } catch (e) {
    // localStorage might be full or unavailable
  }
}

function migrateAccentArray(arr) {
  if (!arr) return arr
  return arr.map(normalizeAccentLevel)
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const settings = JSON.parse(data)

    if (settings.subdivisionAccents) {
      settings.subdivisionAccents = migrateAccentArray(settings.subdivisionAccents)
    }
    if (settings.polyAccents1) {
      settings.polyAccents1 = migrateAccentArray(settings.polyAccents1)
    }
    if (settings.polyAccents2) {
      settings.polyAccents2 = migrateAccentArray(settings.polyAccents2)
    }

    return settings
  } catch (e) {
    return null
  }
}
