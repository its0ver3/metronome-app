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
    assert.equal(JSON.parse(stored).version, 3)
  } finally {
    delete globalThis.localStorage
  }
})
