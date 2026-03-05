const STORAGE_KEY = 'drums-only-metronome-settings'

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    // localStorage might be full or unavailable
  }
}

const ACCENT_MIGRATION = {
  STRONG: 'ACCENT',
  MEDIUM: 'ON',
  NORMAL: 'ON',
  GHOST: 'OFF',
  SILENT: 'OFF',
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const settings = JSON.parse(data)
    if (settings.accents) {
      settings.accents = settings.accents.map(a => ACCENT_MIGRATION[a] || a)
    }
    return settings
  } catch (e) {
    return null
  }
}
