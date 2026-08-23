import GapTraining from './GapTraining'
import TempoTrainer from './TempoTrainer'
import SubdivisionTrainer from './SubdivisionTrainer'

export default function TrainingScreen({
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {polyrhythmMode && (
          <p className="text-sm text-dark/70 bg-secondary rounded-lg px-3 py-2" role="status">
            Training is paused while Polyrhythm mode is active. Your trainer setup is preserved.
          </p>
        )}

        <div className={`space-y-6 ${polyrhythmMode ? 'opacity-55' : ''}`}>
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
    </div>
  )
}
