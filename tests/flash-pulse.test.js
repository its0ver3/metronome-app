import test from 'node:test'
import assert from 'node:assert/strict'
import { nextFlashPulse, getFlashAnimation } from '../src/components/layout/flashPulse.js'
import { saveSettings, loadSettings } from '../src/storage/settingsStorage.js'

test('one-only ignores other clicks while subdivision mode uses a dimmer, shorter pulse', () => {
  const one = nextFlashPulse(null, { time: 0, downbeat: true })
  const subdivision = nextFlashPulse(one, { time: .125, downbeat: false })
  const nextBar = nextFlashPulse(subdivision, { time: 2, downbeat: true })
  assert.ok(nextBar.sequence > one.sequence)
  assert.equal(getFlashAnimation(subdivision, false), null)
  const strong = getFlashAnimation(one, true)
  const soft = getFlashAnimation(subdivision, true)
  assert.ok(soft.opacity < strong.opacity)
  assert.ok(soft.duration < strong.duration)
  assert.deepEqual(getFlashAnimation(one, false), strong)
})

test('coincident polyrhythm pulses preserve the primary downbeat in either callback order', () => {
  const primary = { time: 1, downbeat: true, rhythm: 1 }
  const secondary = { time: 1, downbeat: true, rhythm: 2 }
  for (const order of [[primary, secondary], [secondary, primary]]) {
    const pulse = order.reduce(nextFlashPulse, null)
    assert.equal(pulse.downbeat, true)
  }
  const primaryPulse = nextFlashPulse(null, primary)
  assert.equal(nextFlashPulse(primaryPulse, secondary), primaryPulse)
  const secondaryPulse = nextFlashPulse(primaryPulse, { ...secondary, time: 1.5, downbeat: false })
  assert.equal(secondaryPulse.downbeat, false)
})

test('group-only playback ignores unsounded internal subdivisions', () => {
  const pulse = nextFlashPulse(null, { time: 0, downbeat: true })
  assert.equal(nextFlashPulse(pulse, { time: .1, visualPulse: false }), pulse)
  assert.notEqual(nextFlashPulse(pulse, { time: .2, visualPulse: true }), pulse)
})

test('the subdivision preference round-trips without changing legacy one-only behavior', () => {
  let stored = JSON.stringify({ version: 5, flashOnOne: true })
  globalThis.localStorage = { getItem: () => stored, setItem: (_, value) => { stored = value } }
  try {
    const legacy = loadSettings()
    assert.equal(legacy.flashOnOne, true)
    assert.equal(legacy.flashSubdivisions === true, false)
    saveSettings({ ...legacy, flashSubdivisions: true })
    assert.equal(loadSettings().flashSubdivisions, true)
  } finally { delete globalThis.localStorage }
})
