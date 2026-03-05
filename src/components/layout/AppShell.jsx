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

  // Track engine-derived values in React state instead of reading mutable props
  const [settings, setSettings] = useState({
    accents: ['ACCENT', 'ON', 'ON', 'ON'],
    subdivisionAccents: ['ACCENT', 'ON', 'ON', 'ON'],
    beatsPerBar: 4,
    subdivision: 1,
    volume: 1,
    soundIndex: 0,
    gapEnabled: false,
    gapClickBars: 2,
    gapSilentBars: 2,
    tempoEnabled: false,
    tempoStartBpm: 80,
    tempoTargetBpm: 120,
    tempoIncrement: 5,
    tempoEveryBars: 4,
  })

  const { accents, subdivisionAccents, beatsPerBar, subdivision, volume, soundIndex } = settings
  const { gapEnabled, gapClickBars, gapSilentBars } = settings
  const { tempoEnabled, tempoStartBpm, tempoTargetBpm, tempoIncrement, tempoEveryBars } = settings

  // Performance mode state
  const [performanceMode, setPerformanceMode] = useState({
    active: false,
    setlistId: null,
    setlistName: '',
    currentIndex: 0,
    songs: [],
  })

  // Sync React state from engine snapshot
  const syncFromEngine = useCallback(() => {
    const e = audio.engine()
    if (!e) return
    setSettings({
      accents: [...e.accents],
      subdivisionAccents: [...e.subdivisionAccents],
      beatsPerBar: e.beatsPerBar,
      subdivision: e.subdivision,
      volume: e.volume,
      soundIndex: e.soundIndex,
      gapEnabled: e.gapEnabled,
      gapClickBars: e.gapClickBars,
      gapSilentBars: e.gapSilentBars,
      tempoEnabled: e.tempoTrainerEnabled,
      tempoStartBpm: e.tempoStartBpm,
      tempoTargetBpm: e.tempoTargetBpm,
      tempoIncrement: e.tempoIncrement,
      tempoEveryBars: e.tempoEveryBars,
    })
  }, [audio])

  // Restore settings on mount
  useEffect(() => {
    const saved = loadSettings()
    if (saved && engine) {
      if (saved.bpm) audio.changeBpm(saved.bpm)
      if (saved.soundIndex !== undefined) audio.setSound(saved.soundIndex)
      if (saved.volume !== undefined) audio.setVolume(saved.volume)
      if (saved.beatsPerBar) audio.setBeatsPerBar(saved.beatsPerBar)
      if (saved.subdivision) audio.setSubdivision(saved.subdivision)
      if (saved.subdivisionAccents) {
        saved.subdivisionAccents.forEach((a, i) => engine.setSubdivisionAccent(i, a))
      }
      syncFromEngine()
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
        subdivision: engine.subdivision,
        subdivisionAccents: [...engine.subdivisionAccents],
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [audio.bpm, soundIndex, volume, beatsPerBar, subdivision, subdivisionAccents, engine])

  // Handlers
  const handleCycleSubdivisionAccent = (index) => {
    audio.cycleSubdivisionAccent(index)
    syncFromEngine()
  }

  const handleBeatsChange = (beats) => {
    audio.setBeatsPerBar(beats)
    syncFromEngine()
  }

  const handleSubdivisionChange = (type) => {
    audio.setSubdivision(type)
    syncFromEngine()
  }

  const handleVolumeChange = (v) => {
    audio.setVolume(v)
    syncFromEngine()
  }

  const handleSoundChange = (index) => {
    audio.setSound(index)
    syncFromEngine()
  }

  const handleSoundPreview = useCallback(async (index) => {
    const e = audio.engine()
    if (!e) return
    await e.preview(index)
  }, [audio])

  const handleGapChange = (enabled, clickBars, silentBars) => {
    audio.setGapTraining(enabled, clickBars, silentBars)
    syncFromEngine()
  }

  const handleTempoChange = (enabled, start, target, inc, bars) => {
    audio.setTempoTrainer(enabled, start, target, inc, bars)
    syncFromEngine()
  }

  // Load a song's settings into the metronome
  const loadSongIntoMetronome = useCallback((song) => {
    if (!song || !engine) return
    audio.changeBpm(song.bpm)
    audio.setBeatsPerBar(song.beatsPerBar)
    audio.setSubdivision(song.subdivision || 1)
    audio.setSound(song.soundIndex ?? 0)
    if (song.subdivisionAccents) {
      song.subdivisionAccents.forEach((a, i) => engine.setSubdivisionAccent(i, a))
    }
    syncFromEngine()
  }, [audio, engine, syncFromEngine])

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
    subdivision,
    soundIndex,
    subdivisionAccents: [...subdivisionAccents],
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
              currentSubdivision={audio.currentSubdivision}
              currentBar={audio.currentBar}
              inGap={audio.inGap}
              beatsPerBar={beatsPerBar}
              subdivision={subdivision}
              subdivisionAccents={subdivisionAccents}
              onBpmChange={audio.changeBpm}
              onToggle={audio.toggle}
              onCycleSubdivisionAccent={handleCycleSubdivisionAccent}
              onBeatsChange={handleBeatsChange}
              onSubdivisionChange={handleSubdivisionChange}
              tempoEnabled={tempoEnabled}
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
            onSoundChange={handleSoundChange}
            onSoundPreview={handleSoundPreview}
            onVolumeChange={handleVolumeChange}
          />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}
