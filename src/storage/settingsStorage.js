import {
  LEGACY_SOUND_INDEX_MAP,
  getSoundIdByIndex,
  getSoundIndexById,
  normalizeAccentLevel,
  normalizeSoundIndex,
} from '../audio/constants.js'

const STORAGE_KEY = 'drums-only-metronome-settings'

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...settings,
      soundId: getSoundIdByIndex(settings.soundIndex),
      polySoundId1: getSoundIdByIndex(settings.polySoundIndex1),
      polySoundId2: getSoundIdByIndex(settings.polySoundIndex2),
      version: 4,
    }))
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

    if (settings.version >= 4) {
      settings.soundIndex = getSoundIndexById(settings.soundId)
      settings.polySoundIndex1 = getSoundIndexById(settings.polySoundId1)
      settings.polySoundIndex2 = getSoundIndexById(settings.polySoundId2)
    } else {
      settings.soundIndex = migrateLegacySoundIndex(settings.soundIndex)
      settings.polySoundIndex1 = migrateLegacySoundIndex(settings.polySoundIndex1)
      settings.polySoundIndex2 = migrateLegacySoundIndex(settings.polySoundIndex2)
    }

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

function migrateLegacySoundIndex(index) {
  if (index === undefined) return undefined
  return LEGACY_SOUND_INDEX_MAP[Number(index)] ?? normalizeSoundIndex(index)
}
