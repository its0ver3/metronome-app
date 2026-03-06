const STORAGE_KEY = 'drums-only-metronome-settings'

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: 2 }))
  } catch (e) {
    // localStorage might be full or unavailable
  }
}

const ACCENT_MIGRATION_V1 = {
  // v1 -> v2: ACCENT was the loudest, now LOUD is
  ACCENT: 'LOUD',
  STRONG: 'LOUD',
  MEDIUM: 'ACCENT',
  NORMAL: 'ON',
  GHOST: 'OFF',
  SILENT: 'OFF',
}

const ACCENT_MIGRATION_V2 = {
  STRONG: 'LOUD',
  MEDIUM: 'ACCENT',
  NORMAL: 'ON',
  GHOST: 'OFF',
  SILENT: 'OFF',
}

function migrateAccentArray(arr, migration) {
  if (!arr) return arr
  return arr.map(a => migration[a] || a)
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const settings = JSON.parse(data)

    const migration = settings.version >= 2 ? ACCENT_MIGRATION_V2 : ACCENT_MIGRATION_V1

    if (settings.accents) {
      settings.accents = migrateAccentArray(settings.accents, migration)
    }
    if (settings.subdivisionAccents) {
      settings.subdivisionAccents = migrateAccentArray(settings.subdivisionAccents, migration)
    }
    if (settings.polyAccents1) {
      settings.polyAccents1 = migrateAccentArray(settings.polyAccents1, migration)
    }
    if (settings.polyAccents2) {
      settings.polyAccents2 = migrateAccentArray(settings.polyAccents2, migration)
    }

    return settings
  } catch (e) {
    return null
  }
}
