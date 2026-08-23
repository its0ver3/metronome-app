import SubdivisionPicker from '../metronome/SubdivisionPicker'
import { SUBDIVISION_OPTIONS, SUBDIVISION_TRAINER_MAX_STAGES } from '../../audio/constants'

const STAGE_LABELS = ['A', 'B', 'C', 'D']

export default function SubdivisionTrainer({
  enabled,
  stages,
  activeStageIndex,
  activeBar,
  isPlaying,
  disabled = false,
  onChange,
}) {
  const handleToggle = () => {
    onChange(!enabled, stages)
  }

  const updateStage = (index, changes) => {
    const nextStages = stages.map((stage, stageIndex) => (
      stageIndex === index ? { ...stage, ...changes } : stage
    ))
    onChange(enabled, nextStages)
  }

  const handleBarsChange = (index, value) => {
    updateStage(index, { bars: Math.max(1, Math.min(16, value)) })
  }

  const handleAdd = () => {
    if (stages.length >= SUBDIVISION_TRAINER_MAX_STAGES) return
    const previousSubdivision = stages[stages.length - 1]?.subdivision || 1
    const usedSubdivisions = new Set(stages.map((stage) => stage.subdivision))
    const previousIndex = SUBDIVISION_OPTIONS.findIndex(
      (option) => option.type === previousSubdivision,
    )
    const orderedOptions = [
      ...SUBDIVISION_OPTIONS.slice(previousIndex + 1),
      ...SUBDIVISION_OPTIONS.slice(0, previousIndex + 1),
    ]
    const nextSubdivision = orderedOptions.find(
      (option) => !usedSubdivisions.has(option.type),
    )?.type || 1

    onChange(enabled, [
      ...stages,
      { subdivision: nextSubdivision, bars: 2 },
    ])
  }

  const handleRemove = (index) => {
    if (index < 2) return
    onChange(enabled, stages.filter((_, stageIndex) => stageIndex !== index))
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-xl text-dark">Subdivision Trainer</h3>
          <p className="text-xs text-dark/50">Cycle through two to four subdivisions</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable subdivision trainer"
          disabled={disabled}
          onClick={handleToggle}
          className="relative w-12 h-11 rounded-full disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-2 h-7 w-12 rounded-full transition-colors ${
              enabled ? 'bg-primary' : 'bg-dark/20'
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <fieldset
        disabled={!enabled || disabled}
        aria-label="Subdivision trainer settings"
        className={!enabled || disabled ? 'opacity-40' : ''}
      >
      <div className="mb-4 rounded-lg bg-secondary/70 px-3 py-2">
        <p className="text-[10px] text-dark/40 font-semibold uppercase tracking-wide mb-1.5">
          Cycle
        </p>
        <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Subdivision cycle order">
          {stages.map((stage, index) => {
            const isActive = enabled && isPlaying && activeStageIndex === index
            return (
              <div
                key={index}
                className="flex items-center gap-1.5"
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                {index > 0 && <span className="text-dark/30 text-xs">→</span>}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isActive ? 'bg-primary text-light' : 'bg-dark/10 text-dark/60'
                  }`}
                >
                  {STAGE_LABELS[index]} · {stage.subdivision}
                </span>
              </div>
            )
          })}
          <div className="flex items-center gap-1.5" role="listitem">
            <span className="text-dark/30 text-xs">→</span>
            <span className="text-xs font-semibold text-dark/40">A</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isActive = enabled && isPlaying && activeStageIndex === index
          return (
            <div
              key={index}
              className={`rounded-xl border p-3 transition-colors ${
                isActive ? 'border-primary bg-primary/10' : 'border-dark/10 bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-heading text-lg ${
                    isActive ? 'bg-primary text-light' : 'bg-dark/10 text-dark/60'
                  }`}
                  aria-hidden="true"
                >
                  {STAGE_LABELS[index]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-dark">Stage {STAGE_LABELS[index]}</p>
                  {isActive && (
                    <p className="text-xs font-semibold text-primary">
                      Active · Bar {Math.min(activeBar, stage.bars)} of {stage.bars}
                    </p>
                  )}
                </div>
                {index >= 2 && (
                  <button
                    type="button"
                    aria-label={`Remove stage ${STAGE_LABELS[index]}`}
                    title={`Remove stage ${STAGE_LABELS[index]}`}
                    onClick={() => handleRemove(index)}
                    className="ml-auto w-8 h-8 rounded-lg text-dark/40 hover:bg-dark/10 hover:text-dark transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <SubdivisionPicker
                  subdivision={stage.subdivision}
                  accessibleLabel={`Stage ${STAGE_LABELS[index]} subdivision`}
                  onChange={(subdivision) => updateStage(index, { subdivision })}
                />
                <div
                  role="group"
                  aria-label={`Stage ${STAGE_LABELS[index]} bars, currently ${stage.bars}`}
                >
                  <span className="text-xs text-dark/50 font-semibold block mb-1">Bars</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease bars for stage ${STAGE_LABELS[index]}`}
                      disabled={!enabled || disabled}
                      onClick={() => handleBarsChange(index, stage.bars - 1)}
                      className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="font-heading text-2xl text-dark w-8 text-center">{stage.bars}</span>
                    <button
                      type="button"
                      aria-label={`Increase bars for stage ${STAGE_LABELS[index]}`}
                      disabled={!enabled || disabled}
                      onClick={() => handleBarsChange(index, stage.bars + 1)}
                      className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {stages.length < SUBDIVISION_TRAINER_MAX_STAGES && (
        <button
          type="button"
          disabled={!enabled || disabled}
          onClick={handleAdd}
          className="mt-3 w-full h-10 rounded-lg border border-primary/40 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors"
        >
          + Add subdivision
        </button>
      )}

      {enabled && isPlaying && (
        <p className="mt-3 text-center text-[11px] text-dark/40">
          Changes take effect at the next bar
        </p>
      )}
      </fieldset>
    </div>
  )
}
