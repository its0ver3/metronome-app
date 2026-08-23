import { useState, useEffect, useCallback } from 'react'
import AudioEngine from '../audio/AudioEngine'
import { restoreEngineSettings } from '../audio/engineSettings'

export default function useAudioEngine(initialSettings) {
  const [engine] = useState(() => restoreEngineSettings(new AudioEngine(), initialSettings))
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(engine.bpm)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [currentSubdivision, setCurrentSubdivision] = useState(-1)
  const [currentBar, setCurrentBar] = useState(1)
  const [inGap, setInGap] = useState(false)
  const [polyBeat1, setPolyBeat1] = useState(-1)
  const [polyBeat2, setPolyBeat2] = useState(-1)

  useEffect(() => {
    engine.onStateChange((playing) => setIsPlaying(playing))
    engine.onBpmChange((newBpm) => setBpm(newBpm))
    engine.onBarChange((bar) => setCurrentBar(bar))
    engine.onGapChange((gap) => setInGap(gap))
    engine.onBeat(({ beat, subdivision, rhythm }) => {
      if (rhythm) {
        if (rhythm === 1) setPolyBeat1(beat)
        else setPolyBeat2(beat)
      } else {
        setCurrentBeat(beat)
        setCurrentSubdivision(subdivision)
      }
    })

    return () => {
      engine.stop()
    }
  }, [engine])

  const getEngine = useCallback(() => engine, [engine])

  const toggle = useCallback(() => engine.toggle(), [engine])

  const changeBpm = useCallback((newBpm) => {
    engine.setBpm(newBpm)
  }, [engine])

  const setVolume = useCallback((v) => {
    engine.setVolume(v)
  }, [engine])

  const setSound = useCallback((index) => {
    engine.setSound(index)
  }, [engine])

  const setBeatsPerBar = useCallback((beats) => {
    engine.setBeatsPerBar(beats)
  }, [engine])

  const setSubdivision = useCallback((type) => {
    engine.setSubdivision(type)
  }, [engine])

  const cycleSubdivisionAccent = useCallback((index) => {
    return engine.cycleSubdivisionAccent(index)
  }, [engine])

  const setGapTraining = useCallback((enabled, clickBars, silentBars) => {
    engine.setGapTraining(enabled, clickBars, silentBars)
  }, [engine])

  const setTempoTrainer = useCallback((enabled, startBpm, targetBpm, increment, everyBars) => {
    engine.setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars)
  }, [engine])

  const setSubdivisionTrainer = useCallback((enabled, stages) => {
    engine.setSubdivisionTrainer(enabled, stages)
  }, [engine])

  const setPolyrhythmMode = useCallback((enabled) => {
    engine.setPolyrhythmMode(enabled)
  }, [engine])

  const setPolyRhythm1 = useCallback((v) => {
    engine.setPolyRhythm1(v)
  }, [engine])

  const setPolyRhythm2 = useCallback((v) => {
    engine.setPolyRhythm2(v)
  }, [engine])

  const setPolySoundIndex1 = useCallback((i) => {
    engine.setPolySoundIndex1(i)
  }, [engine])

  const setPolySoundIndex2 = useCallback((i) => {
    engine.setPolySoundIndex2(i)
  }, [engine])

  const cyclePolyAccent = useCallback((rhythmIndex, beatIndex) => {
    return engine.cyclePolyAccent(rhythmIndex, beatIndex)
  }, [engine])

  return {
    engine: getEngine,
    isPlaying,
    bpm,
    currentBeat,
    currentSubdivision,
    currentBar,
    inGap,
    toggle,
    changeBpm,
    setVolume,
    setSound,
    setBeatsPerBar,
    setSubdivision,
    cycleSubdivisionAccent,
    setGapTraining,
    setTempoTrainer,
    setSubdivisionTrainer,
    polyBeat1,
    polyBeat2,
    setPolyrhythmMode,
    setPolyRhythm1,
    setPolyRhythm2,
    setPolySoundIndex1,
    setPolySoundIndex2,
    cyclePolyAccent,
  }
}
