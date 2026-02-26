import GapTraining from './GapTraining'
import TempoTrainer from './TempoTrainer'

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
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <h2 className="font-heading text-3xl text-dark">Training</h2>

      <GapTraining
        enabled={gapEnabled}
        clickBars={gapClickBars}
        silentBars={gapSilentBars}
        onChange={onGapChange}
      />

      <TempoTrainer
        enabled={tempoEnabled}
        startBpm={tempoStartBpm}
        targetBpm={tempoTargetBpm}
        increment={tempoIncrement}
        everyBars={tempoEveryBars}
        onChange={onTempoChange}
      />

      <p className="text-xs text-dark/40 text-center pt-2">
        Start the metronome on the Metronome tab to use training features
      </p>
    </div>
  )
}
