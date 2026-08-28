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
    <section className="pulse-feature-screen pulse-training-screen" aria-labelledby="training-title">
      <div className="pulse-feature-scroll">
        <header className="pulse-feature-header">
          <span>Practice tools</span>
          <h1 id="training-title">Training</h1>
          <p>Build steadier time with focused, repeatable challenges.</p>
        </header>

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
