import GapTraining from './GapTraining'
import TempoTrainer from './TempoTrainer'
import SubdivisionTrainer from './SubdivisionTrainer'
import { getTempoColor } from '../metronome/tempoHeat'

export default function TrainingScreen({
  bpm = 120,
  gapEnabled,
  gapClickBars,
  gapSilentBars,
  onGapChange,
  tempoEnabled,
  tempoStartBpm,
  tempoTargetBpm,
  tempoIncrement,
  tempoEveryBars,
  onTempoChange,
  subdivTrainerEnabled,
  subdivTrainerStages,
  subdivTrainerStageIndex,
  subdivTrainerBarCount,
  onSubdivTrainerChange,
  polyrhythmMode,
  isPlaying,
}) {
  return (
    <section className="pulse-feature-screen pulse-training-screen" aria-label="Practice tools" style={{ '--tempo-heat-color': getTempoColor(bpm) }}>
      <div className="pulse-feature-scroll">
        {polyrhythmMode && (
          <div className="pulse-feature-notice" role="status">
            <strong>Training paused</strong>
            <span>Turn off Polyrhythm mode to use your saved trainer setup.</span>
          </div>
        )}

        <div className={`pulse-training-stack ${polyrhythmMode ? 'is-unavailable' : ''}`}>
          <GapTraining
            enabled={gapEnabled}
            clickBars={gapClickBars}
            silentBars={gapSilentBars}
            disabled={polyrhythmMode}
            onChange={onGapChange}
          />

          <TempoTrainer
            enabled={tempoEnabled}
            startBpm={tempoStartBpm}
            targetBpm={tempoTargetBpm}
            increment={tempoIncrement}
            everyBars={tempoEveryBars}
            disabled={polyrhythmMode}
            onChange={onTempoChange}
          />

          <SubdivisionTrainer
            enabled={subdivTrainerEnabled}
            stages={subdivTrainerStages}
            activeStageIndex={subdivTrainerStageIndex}
            activeBar={subdivTrainerBarCount + 1}
            isPlaying={isPlaying}
            disabled={polyrhythmMode}
            onChange={onSubdivTrainerChange}
          />
        </div>
      </div>
    </section>
  )
}
