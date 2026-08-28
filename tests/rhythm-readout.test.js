import test from 'node:test'
import assert from 'node:assert/strict'
import { getRhythmReadoutLabel } from '../src/components/metronome/rhythmReadoutLabel.js'

test('standard rhythm readout announces beat and click counts represented by its icons', () => {
  assert.equal(
    getRhythmReadoutLabel({
      polyrhythmMode: false,
      beatsPerBar: 4,
      subdivision: 4,
      polyRhythm1: 3,
      polyRhythm2: 4,
    }),
    'Open rhythm controls: 4 beats, 4 clicks per beat',
  )

  assert.equal(
    getRhythmReadoutLabel({
      polyrhythmMode: false,
      beatsPerBar: 1,
      subdivision: 1,
      polyRhythm1: 3,
      polyRhythm2: 4,
    }),
    'Open rhythm controls: 1 beat, 1 click per beat',
  )
})

test('polyrhythm readout announces both visible pulse counts', () => {
  assert.equal(
    getRhythmReadoutLabel({
      polyrhythmMode: true,
      beatsPerBar: 4,
      subdivision: 4,
      polyRhythm1: 3,
      polyRhythm2: 5,
    }),
    'Open rhythm controls: pulse A 3, pulse B 5',
  )
})
