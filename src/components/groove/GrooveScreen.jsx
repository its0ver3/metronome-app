import GrooveTransport from './GrooveTransport'
import GrooveControls from './GrooveControls'
import GrooveGrid from './GrooveGrid'
import SheetPreview from './SheetPreview'

export default function GrooveScreen({
  pattern,
  bpm,
  isPlaying,
  countInBars,
  activeSlot,
  inCountIn,
  showToms,
  onTogglePlay,
  onBpmChange,
  onCellTap,
  onCellSet,
  onCountInChange,
  onTimeDivisionChange,
  onShowTomsChange,
  onClearAll,
}) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
      <GrooveTransport
        bpm={bpm}
        isPlaying={isPlaying}
        onToggle={onTogglePlay}
        onBpmChange={onBpmChange}
      />
      <GrooveControls
        countInBars={countInBars}
        timeDivision={pattern.timeDivision}
        showToms={showToms}
        onCountInChange={onCountInChange}
        onTimeDivisionChange={onTimeDivisionChange}
        onShowTomsChange={onShowTomsChange}
        onClearAll={onClearAll}
      />
      <GrooveGrid
        pattern={pattern}
        activeSlot={activeSlot}
        inCountIn={inCountIn}
        showToms={showToms}
        onCellTap={onCellTap}
        onCellSet={onCellSet}
      />
      <SheetPreview pattern={pattern} bpm={bpm} />
    </div>
  )
}
