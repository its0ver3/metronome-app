import { useState, useEffect, useCallback } from 'react'
import BottomNav from './BottomNav'
import GlobalTransport from './GlobalTransport'
import MetronomeScreen from '../metronome/MetronomeScreen'
import TrainingScreen from '../training/TrainingScreen'
import SettingsScreen from '../settings/SettingsScreen'
import useAudioEngine from '../../hooks/useAudioEngine'
import { saveSettings, loadSettings } from '../../storage/settingsStorage'

function getSettingsSnapshot(engine) {
  const state = engine.getState()

  return {
    subdivisionAccents: state.subdivisionAccents,
    beatsPerBar: state.beatsPerBar,
    subdivision: state.subdivision,
    volume: state.volume,
    soundIndex: state.soundIndex,
    gapEnabled: state.gapEnabled,
    gapClickBars: state.gapClickBars,
    gapSilentBars: state.gapSilentBars,
    tempoEnabled: state.tempoTrainerEnabled,
    tempoStartBpm: state.tempoStartBpm,
    tempoTargetBpm: state.tempoTargetBpm,
    tempoIncrement: state.tempoIncrement,
    tempoEveryBars: state.tempoEveryBars,
    subdivTrainerEnabled: state.subdivTrainerEnabled,
    subdivTrainerStages: state.subdivTrainerStages,
    subdivTrainerStageIndex: state.subdivTrainerStageIndex,
    subdivTrainerBarCount: state.subdivTrainerBarCount,
    polyrhythmMode: state.polyrhythmMode,
    polyRhythm1: state.polyRhythm1,
    polyRhythm2: state.polyRhythm2,
    polySoundIndex1: state.polySoundIndex1,
    polySoundIndex2: state.polySoundIndex2,
    polyAccents1: state.polyAccents1,
    polyAccents2: state.polyAccents2,
  }
}

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('metronome')
  const [transportCollapsed, setTransportCollapsed] = useState(false)
  const [initialSettings] = useState(() => loadSettings())
  const audio = useAudioEngine(initialSettings)

  const engine = audio.engine()

  // Track engine-derived values in React state instead of reading mutable props
  const [settings, setSettings] = useState(() => getSettingsSnapshot(engine))

  const { subdivisionAccents, beatsPerBar, subdivision, volume, soundIndex } = settings
  const { gapEnabled, gapClickBars, gapSilentBars } = settings
  const { tempoEnabled, tempoStartBpm, tempoTargetBpm, tempoIncrement, tempoEveryBars } = settings
  const {
    subdivTrainerEnabled,
    subdivTrainerStages,
    subdivTrainerStageIndex,
    subdivTrainerBarCount,
  } = settings
  const { polyrhythmMode, polyRhythm1, polyRhythm2, polySoundIndex1, polySoundIndex2, polyAccents1, polyAccents2 } = settings

  // Sync React state from engine snapshot
  const syncFromEngine = useCallback(() => {
    setSettings(getSettingsSnapshot(engine))
  }, [engine])

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
        gapEnabled: engine.gapEnabled,
        gapClickBars: engine.gapClickBars,
        gapSilentBars: engine.gapSilentBars,
        tempoEnabled: engine.tempoTrainerEnabled,
        tempoStartBpm: engine.tempoStartBpm,
        tempoTargetBpm: engine.tempoTargetBpm,
        tempoIncrement: engine.tempoIncrement,
        tempoEveryBars: engine.tempoEveryBars,
        subdivTrainerEnabled: engine.subdivTrainerEnabled,
        subdivTrainerStages: engine.subdivTrainerStages.map((stage) => ({ ...stage })),
        polyrhythmMode: engine.polyrhythmMode,
        polyRhythm1: engine.polyRhythm1,
        polyRhythm2: engine.polyRhythm2,
        polySoundIndex1: engine.polySoundIndex1,
        polySoundIndex2: engine.polySoundIndex2,
        polyAccents1: [...engine.polyAccents1],
        polyAccents2: [...engine.polyAccents2],
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [audio.bpm, soundIndex, volume, beatsPerBar, subdivision, subdivisionAccents, gapEnabled, gapClickBars, gapSilentBars, tempoEnabled, tempoStartBpm, tempoTargetBpm, tempoIncrement, tempoEveryBars, subdivTrainerEnabled, subdivTrainerStages, polyrhythmMode, polyRhythm1, polyRhythm2, polySoundIndex1, polySoundIndex2, polyAccents1, polyAccents2, engine])

  // Handlers
  const handleCycleSubdivisionAccent = (index) => {
    audio.cycleSubdivisionAccent(index)
    syncFromEngine()
  }

  const handleCycleBeatAccent = (beatIndex) => {
    audio.cycleBeatAccent(beatIndex)
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
    await engine.preview(index)
  }, [engine])

  const handleTapFeedback = useCallback((stage) => {
    engine.playTapTempoFeedback(stage).catch(() => {})
  }, [engine])

  const handleGapChange = (enabled, clickBars, silentBars) => {
    audio.setGapTraining(enabled, clickBars, silentBars)
    syncFromEngine()
  }

  const handleTempoChange = (enabled, start, target, inc, bars) => {
    audio.setTempoTrainer(enabled, start, target, inc, bars)
    syncFromEngine()
  }

  // Auto-sync subdivision display when bar changes during subdivision trainer
  useEffect(() => {
    if (subdivTrainerEnabled) {
      syncFromEngine()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.currentBar])

  const handleSubdivTrainerChange = (enabled, stages) => {
    audio.setSubdivisionTrainer(enabled, stages)
    syncFromEngine()
  }

  const handlePolyrhythmModeToggle = (enabled) => {
    audio.setPolyrhythmMode(enabled)
    syncFromEngine()
  }

  const handlePolyRhythm1Change = (value) => {
    audio.setPolyRhythm1(value)
    syncFromEngine()
  }

  const handlePolyRhythm2Change = (value) => {
    audio.setPolyRhythm2(value)
    syncFromEngine()
  }

  const handleCyclePolyAccent = (rhythmIndex, beatIndex) => {
    audio.cyclePolyAccent(rhythmIndex, beatIndex)
    syncFromEngine()
  }

  const handlePolySoundIndex1Change = (index) => {
    audio.setPolySoundIndex1(index)
    syncFromEngine()
  }

  const handlePolySoundIndex2Change = (index) => {
    audio.setPolySoundIndex2(index)
    syncFromEngine()
  }

  const playbackStatus = {
    bpm: audio.bpm,
    isPlaying: audio.isPlaying,
    currentBar: audio.currentBar,
    currentBeat: audio.currentBeat,
    beatsPerBar,
    inGap: audio.inGap,
    gapEnabled,
    tempoEnabled,
    tempoTargetBpm,
    subdivTrainerEnabled,
    subdivTrainerStages,
    subdivTrainerStageIndex,
    subdivTrainerBarCount,
    polyrhythmMode,
  }

  return (
    <>
      <div className={`pulse-app-content flex-1 flex flex-col overflow-hidden ${activeTab !== 'metronome' ? 'has-mini-transport' : ''}`}>
        {activeTab === 'metronome' && (
          <MetronomeScreen
              bpm={audio.bpm}
              isPlaying={audio.isPlaying}
              currentBeat={audio.currentBeat}
              currentSubdivision={audio.currentSubdivision}
              inGap={audio.inGap}
              beatsPerBar={beatsPerBar}
              subdivision={subdivision}
              subdivisionAccents={subdivisionAccents}
              onBpmChange={audio.changeBpm}
              onToggle={audio.toggle}
              onCycleSubdivisionAccent={handleCycleSubdivisionAccent}
              onCycleBeatAccent={handleCycleBeatAccent}
              onBeatsChange={handleBeatsChange}
              onSubdivisionChange={handleSubdivisionChange}
              tempoEnabled={tempoEnabled && !polyrhythmMode}
              subdivTrainerEnabled={subdivTrainerEnabled && !polyrhythmMode}
              polyrhythmMode={polyrhythmMode}
              polyRhythm1={polyRhythm1}
              polyRhythm2={polyRhythm2}
              polySoundIndex1={polySoundIndex1}
              polySoundIndex2={polySoundIndex2}
              polyBeat1={audio.polyBeat1}
              polyBeat2={audio.polyBeat2}
              polyAccents1={polyAccents1}
              polyAccents2={polyAccents2}
              onCyclePolyAccent={handleCyclePolyAccent}
              onPolyrhythmModeToggle={handlePolyrhythmModeToggle}
              onPolyRhythm1Change={handlePolyRhythm1Change}
              onPolyRhythm2Change={handlePolyRhythm2Change}
              onPolySoundIndex1Change={handlePolySoundIndex1Change}
              onPolySoundIndex2Change={handlePolySoundIndex2Change}
              onSoundPreview={handleSoundPreview}
              onTapFeedback={handleTapFeedback}
              playbackStatus={playbackStatus}
            />
        )}
        {activeTab === 'training' && (
          <TrainingScreen
            bpm={audio.bpm}
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
            subdivTrainerEnabled={subdivTrainerEnabled}
            subdivTrainerStages={subdivTrainerStages}
            subdivTrainerStageIndex={subdivTrainerStageIndex}
            subdivTrainerBarCount={subdivTrainerBarCount}
            onSubdivTrainerChange={handleSubdivTrainerChange}
            polyrhythmMode={polyrhythmMode}
            isPlaying={audio.isPlaying}
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
      {activeTab !== 'metronome' && (
        <GlobalTransport
          {...playbackStatus}
          collapsed={transportCollapsed}
          onCollapsedChange={setTransportCollapsed}
          subdivision={subdivision}
          subdivisionAccents={subdivisionAccents}
          polyRhythm1={polyRhythm1}
          polyRhythm2={polyRhythm2}
          polyBeat1={audio.polyBeat1}
          polyBeat2={audio.polyBeat2}
          polyAccents1={polyAccents1}
          polyAccents2={polyAccents2}
          onBpmChange={audio.changeBpm}
          onToggle={audio.toggle}
          onOpenMetronome={() => setActiveTab('metronome')}
        />
      )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}
