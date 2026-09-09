import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import AudioEngine from '../audio/BrowserAudioEngine'
import { restoreEngineSettings } from '../audio/engineSettings'
import PlaybackVisualStore from '../audio/PlaybackVisualStore'

export default function useAudioEngine(initialSettings) {
  const [engine] = useState(() => restoreEngineSettings(new AudioEngine(), initialSettings))
  const [visualStore] = useState(() => new PlaybackVisualStore())
  const [loadState, setLoadState] = useState(engine.loadState)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(engine.bpm)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [currentBar, setCurrentBar] = useState(1)
  const [inGap, setInGap] = useState(false)
  const [gapPlayback, setGapPlayback] = useState(null)
  const gapPlaybackRef = useRef(null)
  const [trainerPlayback, setTrainerPlayback] = useState(null)
  const [polyBeat1, setPolyBeat1] = useState(-1)
  const [polyBeat2, setPolyBeat2] = useState(-1)
  const [session, setSession] = useState(() => engine.getSessionState())

  useEffect(() => {
    engine.onLoadStateChange(setLoadState)
    engine.onStateChange((playing) => {
      setIsPlaying(playing)
      setGapPlayback(null)
      gapPlaybackRef.current = null
      setTrainerPlayback(null)
      setCurrentBeat(-1)
      visualStore.clear()
      if (playing) {
        setCurrentBar(1)
        setInGap(false)
      }
      if (!playing) {
        setPolyBeat1(-1)
        setPolyBeat2(-1)
      }
    })
    engine.onBpmChange((newBpm) => setBpm(newBpm))
    engine.onSessionChange(setSession)
    engine.onBarChange((bar) => setCurrentBar(bar))
    engine.onGapChange((gap) => setInGap(gap))
    engine.onBeat(({ beat, subdivision, displaySubdivision, rhythm, downbeat, time, visualPulse, visualLate, outputTime, presentationFrame, inGap, gapPattern, gapBar, gapBars, gapEnabled, trainerPlayback }) => {
      const previousBeat = visualStore.getBeat().currentBeat
      visualStore.present({ beat, subdivision, displaySubdivision, downbeat, rhythm, time, visualPulse, visualLate, outputTime, presentationFrame })
      const indicatorBeat = visualLate ? -1 : beat
      if (rhythm) {
        if (rhythm === 1) setPolyBeat1(indicatorBeat)
        else setPolyBeat2(indicatorBeat)
      } else {
        if (indicatorBeat !== previousBeat) setCurrentBeat(indicatorBeat)
        setInGap(inGap)
        const previous = gapPlaybackRef.current
        if (!previous || previous.pattern !== gapPattern || previous.bar !== gapBar || previous.bars !== gapBars || previous.enabled !== gapEnabled) {
          gapPlaybackRef.current = { pattern: gapPattern, bar: gapBar, bars: gapBars, enabled: gapEnabled }
          setGapPlayback(gapPlaybackRef.current)
        }
        if (beat === 0 && subdivision === 0) setTrainerPlayback(trainerPlayback)
      }
    }, flushSync)

    return () => {
      engine.stop()
    }
  }, [engine, visualStore])

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

  const cycleBeatAccent = useCallback((beatIndex) => {
    return engine.cycleBeatAccent(beatIndex)
  }, [engine])

  const setGapTraining = useCallback((enabled, clickBars, silentBars, pattern) => {
    engine.setGapTraining(enabled, clickBars, silentBars, pattern)
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
    loadState,
    visualStore,
    session,
    bpm,
    currentBeat,
    currentBar,
    inGap,
    gapPlayback,
    trainerPlayback,
    toggle,
    changeBpm,
    setVolume,
    setSound,
    setBeatsPerBar,
    setSubdivision,
    cycleSubdivisionAccent,
    cycleBeatAccent,
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
