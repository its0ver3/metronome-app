import { useState, useEffect, useRef, useCallback } from 'react'
import AudioEngine from '../audio/AudioEngine'

export default function useAudioEngine() {
  const engineRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [currentSubdivision, setCurrentSubdivision] = useState(-1)
  const [currentBar, setCurrentBar] = useState(1)
  const [inGap, setInGap] = useState(false)
  const [beatAccent, setBeatAccent] = useState('ON')
  const [polyBeat1, setPolyBeat1] = useState(-1)
  const [polyBeat2, setPolyBeat2] = useState(-1)
  const [grooveSlot, setGrooveSlot] = useState(-1)
  const [grooveInCountIn, setGrooveInCountIn] = useState(false)

  useEffect(() => {
    const engine = new AudioEngine()
    engineRef.current = engine

    engine.onStateChange((playing) => setIsPlaying(playing))
    engine.onBpmChange((newBpm) => setBpm(newBpm))
    engine.onBarChange((bar) => setCurrentBar(bar))
    engine.onGapChange((gap) => setInGap(gap))
    engine.onBeat(({ beat, subdivision, accent, rhythm, slot, countIn }) => {
      if (rhythm) {
        if (rhythm === 1) setPolyBeat1(beat)
        else setPolyBeat2(beat)
      } else if (typeof slot === 'number') {
        setGrooveSlot(slot)
        setGrooveInCountIn(!!countIn)
        setCurrentBeat(beat)
        setCurrentSubdivision(subdivision)
      } else {
        setCurrentBeat(beat)
        setCurrentSubdivision(subdivision)
      }
      setBeatAccent(accent)
    })

    return () => {
      engine.stop()
    }
  }, [])

  const getEngine = useCallback(() => engineRef.current, [])

  const toggle = useCallback(() => engineRef.current?.toggle(), [])
  const start = useCallback(() => engineRef.current?.start(), [])
  const stop = useCallback(() => engineRef.current?.stop(), [])

  const changeBpm = useCallback((newBpm) => {
    engineRef.current?.setBpm(newBpm)
  }, [])

  const setVolume = useCallback((v) => {
    engineRef.current?.setVolume(v)
  }, [])

  const setSound = useCallback((index) => {
    engineRef.current?.setSound(index)
  }, [])

  const setBeatsPerBar = useCallback((beats) => {
    engineRef.current?.setBeatsPerBar(beats)
  }, [])

  const setSubdivision = useCallback((type) => {
    engineRef.current?.setSubdivision(type)
  }, [])

  const cycleAccent = useCallback((beatIndex) => {
    return engineRef.current?.cycleAccent(beatIndex)
  }, [])

  const cycleSubdivisionAccent = useCallback((index) => {
    return engineRef.current?.cycleSubdivisionAccent(index)
  }, [])

  const setGapTraining = useCallback((enabled, clickBars, silentBars) => {
    engineRef.current?.setGapTraining(enabled, clickBars, silentBars)
  }, [])

  const setTempoTrainer = useCallback((enabled, startBpm, targetBpm, increment, everyBars) => {
    engineRef.current?.setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars)
  }, [])

  const setSubdivisionTrainer = useCallback((enabled, subA, barsA, subB, barsB) => {
    engineRef.current?.setSubdivisionTrainer(enabled, subA, barsA, subB, barsB)
  }, [])

  const setPolyrhythmMode = useCallback((enabled) => {
    engineRef.current?.setPolyrhythmMode(enabled)
  }, [])

  const setPolyRhythm1 = useCallback((v) => {
    engineRef.current?.setPolyRhythm1(v)
  }, [])

  const setPolyRhythm2 = useCallback((v) => {
    engineRef.current?.setPolyRhythm2(v)
  }, [])

  const setPolySoundIndex1 = useCallback((i) => {
    engineRef.current?.setPolySoundIndex1(i)
  }, [])

  const setPolySoundIndex2 = useCallback((i) => {
    engineRef.current?.setPolySoundIndex2(i)
  }, [])

  const cyclePolyAccent = useCallback((rhythmIndex, beatIndex) => {
    return engineRef.current?.cyclePolyAccent(rhythmIndex, beatIndex)
  }, [])

  const setGrooveMode = useCallback((enabled) => {
    engineRef.current?.setGrooveMode(enabled)
  }, [])

  const setGroovePattern = useCallback((pattern) => {
    engineRef.current?.setGroovePattern(pattern)
  }, [])

  const setCountIn = useCallback((bars) => {
    engineRef.current?.setCountIn(bars)
  }, [])

  return {
    engine: getEngine,
    isPlaying,
    bpm,
    currentBeat,
    currentSubdivision,
    currentBar,
    inGap,
    beatAccent,
    toggle,
    start,
    stop,
    changeBpm,
    setVolume,
    setSound,
    setBeatsPerBar,
    setSubdivision,
    cycleAccent,
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
    grooveSlot,
    grooveInCountIn,
    setGrooveMode,
    setGroovePattern,
    setCountIn,
  }
}
