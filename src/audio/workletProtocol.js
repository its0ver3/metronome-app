// Explicitly separate user configuration from playback counters and resources.
export const PLAYBACK_CONFIG_KEYS = [
  'bpm', 'pumpTheJam', 'beatsPerBar', 'meter', 'subdivision', 'subdivisionAccents',
  'soundIndex', 'sessionSettings', 'gapEnabled', 'gapClickBars', 'gapSilentBars', 'gapPattern',
  'tempoTrainerEnabled', 'tempoStartBpm', 'tempoTargetBpm', 'tempoIncrement', 'tempoEveryBars',
  'subdivTrainerEnabled', 'subdivTrainerStages', 'polyrhythmMode', 'polyRhythm1', 'polyRhythm2',
  'polySoundIndex1', 'polySoundIndex2', 'polyAccents1', 'polyAccents2',
]

export const LIVE_COMMANDS = [
  'setBpm', 'setPumpTheJam', 'setSound', 'setSubdivision', 'setSubdivisionAccent',
  'cycleSubdivisionAccent', 'cycleBeatAccent', 'setGapTraining', 'setTempoTrainer',
  'setSubdivisionTrainer', 'setPolyAccents1', 'setPolyAccents2', 'cyclePolyAccent',
  'setPolySoundIndex1', 'setPolySoundIndex2',
]

export function playbackRuntime(engine) {
  return {
    bpm: engine.bpm, subdivision: engine.subdivision,
    subdivisionAccents: [...engine.subdivisionAccents],
    _subdivTrainerStageIndex: engine._subdivTrainerStageIndex,
    _subdivTrainerBarCount: engine._subdivTrainerBarCount,
    _tempoBarCount: engine._tempoBarCount, _tempoReached: engine._tempoReached,
    _tempoPendingActivation: engine._tempoPendingActivation,
    _subdivTrainerPendingActivation: engine._subdivTrainerPendingActivation,
    _subdivTrainerConfigDirty: engine._subdivTrainerConfigDirty,
  }
}

// AudioBuffers aren't structured-cloneable. Copy PCM only when sounds load,
// never once per click. Reused buffers remain shared within each message.
export function serializeSoundBank(bank) {
  const buffers = new Map()
  const pcm = buffer => {
    if (!buffer) return null
    if (!buffers.has(buffer)) buffers.set(buffer, {
      channels: Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c)),
      length: buffer.length, sampleRate: buffer.sampleRate,
    })
    return buffers.get(buffer)
  }
  return bank.entries.map(entry => ({
    ...entry,
    soft: entry.soft?.map(pcm), main: entry.main?.map(pcm), accent: entry.accent?.map(pcm),
    subdivision: pcm(entry.subdivision),
    voiceBuffers: entry.voiceBuffers ? [...entry.voiceBuffers].map(([key, buffer]) => [key, pcm(buffer)]) : undefined,
  }))
}
