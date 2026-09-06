import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSettings, saveSettings } from '../src/storage/settingsStorage.js'

test('saved Loud accents migrate to the three-state Accent model', () => {
  let stored = JSON.stringify({
    version: 2,
    subdivisionAccents: ['LOUD', 'ON', 'OFF'],
    polyAccents1: ['STRONG', 'NORMAL', 'SILENT'],
    polyAccents2: ['ACCENT', 'MEDIUM', 'GHOST'],
  })
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value },
  }

  try {
    const migrated = loadSettings()
    assert.deepEqual(migrated.subdivisionAccents, ['ACCENT', 'ON', 'OFF'])
    assert.deepEqual(migrated.polyAccents1, ['ACCENT', 'ON', 'OFF'])
    assert.deepEqual(migrated.polyAccents2, ['ACCENT', 'ACCENT', 'OFF'])

    saveSettings(migrated)
    assert.equal(JSON.parse(stored).version, 5)
  } finally {
    delete globalThis.localStorage
  }
})

test('legacy sound choices migrate to the checked production library', () => {
  let stored = JSON.stringify({
    version: 3,
    soundIndex: 6,
    polySoundIndex1: 3,
    polySoundIndex2: 4,
  })
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value },
  }

  try {
    const migrated = loadSettings()
    assert.equal(migrated.soundIndex, 2)
    assert.equal(migrated.polySoundIndex1, 3)
    assert.equal(migrated.polySoundIndex2, 4)

    saveSettings(migrated)
    const saved = JSON.parse(stored)
    assert.equal(saved.soundId, 'soft-tone')
    assert.equal(saved.polySoundId1, 'cowbell')
    assert.equal(saved.polySoundId2, 'hi-hat')
  } finally {
    delete globalThis.localStorage
  }
})
