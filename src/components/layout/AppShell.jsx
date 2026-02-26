import { useState, useEffect, useCallback } from 'react'
import BottomNav from './BottomNav'
import MetronomeScreen from '../metronome/MetronomeScreen'
import TrainingScreen from '../training/TrainingScreen'
import SettingsScreen from '../settings/SettingsScreen'
import SetlistScreen from '../setlist/SetlistScreen'
import SetlistBanner from '../setlist/SetlistBanner'
import useAudioEngine from '../../hooks/useAudioEngine'
import { saveSettings, loadSettings } from '../../storage/settingsStorage'
import { getAllSongs, getSetlist } from '../../storage/presetDb'

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('metronome')
  const audio = useAudioEngine()

  const engine = audio.engine()
  const accents = engine?.accents || ['STRONG', 'NORMAL', 'NORMAL', 'NORMAL']
  const beatsPerBar = engine?.beatsPerBar || 4
  const beatUnit = engine?.beatUnit || 4
  const subdivision = engine?.subdivision || 1
  const volume = engine?.volume ?? 1
  const soundIndex = engine?.soundIndex ?? 0

  // Gap training state
  const gapEnabled = engine?.gapEnabled || false
  const gapClickBars = engine?.gapClickBars || 2
  const gapSilentBars = engine?.gapSilentBars || 2

  // Tempo trainer state
  const tempoEnabled = engine?.tempoTrainerEnabled || false
  const tempoStartBpm = engine?.tempoStartBpm || 80
  const tempoTargetBpm = engine?.tempoTargetBpm || 120
  const tempoIncrement = engine?.tempoIncrement || 5
  const tempoEveryBars = engine?.tempoEveryBars || 4

  const [showMoreTimeSigs, setShowMoreTimeSigs] = useState(false)

  // Performance mode state
  const [performanceMode, setPerformanceMode] = useState({
    active: false,
    setlistId: null,
    setlistName: '',
    currentIndex: 0,
    songs: [],
  })

  const [, forceUpdate] = useState(0)
  const rerender = () => forceUpdate((n) => n + 1)

  // Restore settings on mount
  useEffect(() => {
    const saved = loadSettings()
    if (saved && engine) {
      if (saved.bpm) audio.changeBpm(saved.bpm)
      if (saved.soundIndex !== undefined) audio.setSound(saved.soundIndex)
      if (saved.volume !== undefined) audio.setVolume(saved.volume)
      if (saved.beatsPerBar && saved.beatUnit) audio.setTimeSignature(saved.beatsPerBar, saved.beatUnit)
      if (saved.subdivision) audio.setSubdivision(saved.subdivision)
      if (saved.accents) {
        saved.accents.forEach((a, i) => engine.setAccent(i, a))
      }
      if (saved.showMoreTimeSigs !== undefined) setShowMoreTimeSigs(saved.showMoreTimeSigs)
      rerender()
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!engine])

  // Auto-save settings whenever key values change
  useEffect(() => {
    if (!engine) return
    const timer = setTimeout(() => {
      saveSettings({
        bpm: audio.bpm,
        soundIndex: engine.soundIndex,
        volume: engine.volume,
        beatsPerBar: engine.beatsPerBar,
        beatUnit: engine.beatUnit,
        subdivision: engine.subdivision,
        accents: [...engine.accents],
        showMoreTimeSigs,
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [audio.bpm, soundIndex, volume, beatsPerBar, beatUnit, subdivision, accents, engine, showMoreTimeSigs])

  // Handlers
  const handleCycleAccent = (beatIndex) => {
    audio.cycleAccent(beatIndex)
    rerender()
  }

  const handleTimeSignatureChange = (beats, unit) => {
    audio.setTimeSignature(beats, unit)
    rerender()
  }

  const handleSubdivisionChange = (type) => {
    audio.setSubdivision(type)
    rerender()
  }

  const handleVolumeChange = (v) => {
    audio.setVolume(v)
    rerender()
  }

  const handleSoundChange = (index) => {
    audio.setSound(index)
    rerender()
  }

  const handleSoundPreview = useCallback(async (index) => {
    const e = audio.engine()
    if (!e) return
    await e.init()
    const buffer = e.soundBank.getBuffer(index)
    const source = e.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(e._gainNode)
    source.start()
  }, [audio])

  const handleGapChange = (enabled, clickBars, silentBars) => {
    audio.setGapTraining(enabled, clickBars, silentBars)
    rerender()
  }

  const handleTempoChange = (enabled, start, target, inc, bars) => {
    audio.setTempoTrainer(enabled, start, target, inc, bars)
    rerender()
  }

  // Load a song's settings into the metronome
  const loadSongIntoMetronome = useCallback((song) => {
    if (!song || !engine) return
    audio.changeBpm(song.bpm)
    audio.setTimeSignature(song.beatsPerBar, song.beatUnit)
    audio.setSubdivision(song.subdivision || 1)
    audio.setSound(song.soundIndex ?? 0)
    if (song.accents) {
      song.accents.forEach((a, i) => engine.setAccent(i, a))
    }
    rerender()
  }, [audio, engine])

  // Enter performance mode
  const handlePlaySetlist = useCallback(async (setlistId) => {
    const setlist = await getSetlist(setlistId)
    if (!setlist) return

    const allSongs = await getAllSongs()
    const songMap = {}
    for (const s of allSongs) songMap[s.id] = s

    // Resolve song IDs to objects, filtering out deleted ones
    const resolvedSongs = setlist.songIds
      .map((id) => songMap[id])
      .filter(Boolean)

    if (resolvedSongs.length === 0) return

    // Stop playback before switching
    if (audio.isPlaying) audio.stop()

    setPerformanceMode({
      active: true,
      setlistId,
      setlistName: setlist.name,
      currentIndex: 0,
      songs: resolvedSongs,
    })

    // Load first song and switch to metronome tab
    loadSongIntoMetronome(resolvedSongs[0])
    setActiveTab('metronome')
  }, [audio, loadSongIntoMetronome])

  // Performance mode navigation
  const handlePerfPrev = () => {
    if (performanceMode.currentIndex <= 0) return
    if (audio.isPlaying) audio.stop()
    const newIndex = performanceMode.currentIndex - 1
    setPerformanceMode((prev) => ({ ...prev, currentIndex: newIndex }))
    loadSongIntoMetronome(performanceMode.songs[newIndex])
  }

  const handlePerfNext = () => {
    if (performanceMode.currentIndex >= performanceMode.songs.length - 1) return
    if (audio.isPlaying) audio.stop()
    const newIndex = performanceMode.currentIndex + 1
    setPerformanceMode((prev) => ({ ...prev, currentIndex: newIndex }))
    loadSongIntoMetronome(performanceMode.songs[newIndex])
  }

  const handlePerfExit = () => {
    if (audio.isPlaying) audio.stop()
    setPerformanceMode({
      active: false,
      setlistId: null,
      setlistName: '',
      currentIndex: 0,
      songs: [],
    })
  }

  // Current settings for "Save Current as Song"
  const currentSettings = {
    bpm: audio.bpm,
    beatsPerBar,
    beatUnit,
    subdivision,
    soundIndex,
    accents: [...accents],
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'metronome' && (
          <>
            {performanceMode.active && (
              <SetlistBanner
                setlistName={performanceMode.setlistName}
                songs={performanceMode.songs}
                currentIndex={performanceMode.currentIndex}
                onPrev={handlePerfPrev}
                onNext={handlePerfNext}
                onExit={handlePerfExit}
              />
            )}
            <MetronomeScreen
              bpm={audio.bpm}
              isPlaying={audio.isPlaying}
              currentBeat={audio.currentBeat}
              currentBar={audio.currentBar}
              inGap={audio.inGap}
              beatsPerBar={beatsPerBar}
              beatUnit={beatUnit}
              subdivision={subdivision}
              accents={accents}
              onBpmChange={audio.changeBpm}
              onToggle={audio.toggle}
              onCycleAccent={handleCycleAccent}
              onTimeSignatureChange={handleTimeSignatureChange}
              onSubdivisionChange={handleSubdivisionChange}
              showMoreTimeSigs={showMoreTimeSigs}
            />
          </>
        )}
        {activeTab === 'training' && (
          <TrainingScreen
            gapEnabled={gapEnabled}
            gapClickBars={gapClickBars}
            gapSilentBars={gapSilentBars}
            onGapChange={handleGapChange}
            tempoEnabled={tempoEnabled}
            tempoStartBpm={tempoStartBpm}
            tempoTargetBpm={tempoTargetBpm}
            tempoIncrement={tempoIncrement}
            tempoEveryBars={tempoEveryBars}
            onTempoChange={handleTempoChange}
          />
        )}
        {activeTab === 'setlists' && (
          <SetlistScreen
            currentSettings={currentSettings}
            onPlaySetlist={handlePlaySetlist}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            soundIndex={soundIndex}
            volume={volume}
            showMoreTimeSigs={showMoreTimeSigs}
            onSoundChange={handleSoundChange}
            onSoundPreview={handleSoundPreview}
            onVolumeChange={handleVolumeChange}
            onShowMoreTimeSigsChange={setShowMoreTimeSigs}
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}
