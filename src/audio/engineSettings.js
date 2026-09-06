export function restoreEngineSettings(engine, saved) {
  if (!saved) return engine

  if (saved.bpm !== undefined) engine.setBpm(saved.bpm)
  if (saved.soundIndex !== undefined) engine.setSound(saved.soundIndex)
  if (saved.volume !== undefined) engine.setVolume(saved.volume)
  if (saved.beatsPerBar !== undefined) engine.setBeatsPerBar(saved.beatsPerBar)
  if (saved.meter) engine.setMeter(saved.meter)
  if (saved.subdivision !== undefined) engine.setSubdivision(saved.subdivision)
  if (saved.subdivisionAccents) {
    saved.subdivisionAccents.forEach((accent, index) => {
      engine.setSubdivisionAccent(index, accent)
    })
  }
  if (saved.polyrhythmMode !== undefined) {
    engine.setPolyrhythmMode(saved.polyrhythmMode)
  }
  if (saved.gapEnabled !== undefined) {
    engine.setGapTraining(saved.gapEnabled, saved.gapClickBars, saved.gapSilentBars)
  }
  if (saved.tempoEnabled !== undefined) {
    engine.setTempoTrainer(
      saved.tempoEnabled,
      saved.tempoStartBpm,
      saved.tempoTargetBpm,
      saved.tempoIncrement,
      saved.tempoEveryBars,
    )
  }
  if (saved.subdivTrainerEnabled !== undefined) {
    engine.setSubdivisionTrainer(saved.subdivTrainerEnabled, saved.subdivTrainerStages)
  }
  if (saved.polyRhythm1 !== undefined) engine.setPolyRhythm1(saved.polyRhythm1)
  if (saved.polyRhythm2 !== undefined) engine.setPolyRhythm2(saved.polyRhythm2)
  if (saved.polySoundIndex1 !== undefined) engine.setPolySoundIndex1(saved.polySoundIndex1)
  if (saved.polySoundIndex2 !== undefined) engine.setPolySoundIndex2(saved.polySoundIndex2)
  if (saved.polyAccents1) engine.setPolyAccents1(saved.polyAccents1)
  if (saved.polyAccents2) engine.setPolyAccents2(saved.polyAccents2)

  return engine
}
