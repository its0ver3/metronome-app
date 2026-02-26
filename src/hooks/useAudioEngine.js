import { useState, useEffect, useRef, useCallback } from 'react'
import AudioEngine from '../audio/AudioEngine'

export default function useAudioEngine() {
  const engineRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [currentBar, setCurrentBar] = useState(1)
  const [inGap, setInGap] = useState(false)
  const [beatAccent, setBeatAccent] = useState('NORMAL')

  useEffect(() => {
    const engine = new AudioEngine()
    engineRef.current = engine

    engine.onStateChange((playing) => setIsPlaying(playing))
    engine.onBpmChange((newBpm) => setBpm(newBpm))
    engine.onBarChange((bar) => setCurrentBar(bar))
    engine.onGapChange((gap) => setInGap(gap))
    engine.onBeat(({ beat, accent }) => {
      setCurrentBeat(beat)
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

  const setTimeSignature = useCallback((beats, unit) => {
    engineRef.current?.setTimeSignature(beats, unit)
  }, [])

  const setSubdivision = useCallback((type) => {
    engineRef.current?.setSubdivision(type)
  }, [])

  const cycleAccent = useCallback((beatIndex) => {
    return engineRef.current?.cycleAccent(beatIndex)
  }, [])

  const setGapTraining = useCallback((enabled, clickBars, silentBars) => {
    engineRef.current?.setGapTraining(enabled, clickBars, silentBars)
  }, [])

  const setTempoTrainer = useCallback((enabled, startBpm, targetBpm, increment, everyBars) => {
    engineRef.current?.setTempoTrainer(enabled, startBpm, targetBpm, increment, everyBars)
  }, [])

  return {
    engine: getEngine,
    isPlaying,
    bpm,
    currentBeat,
    currentBar,
    inGap,
    beatAccent,
    toggle,
    start,
    stop,
    changeBpm,
    setVolume,
    setSound,
    setTimeSignature,
    setSubdivision,
    cycleAccent,
    setGapTraining,
    setTempoTrainer,
  }
}
