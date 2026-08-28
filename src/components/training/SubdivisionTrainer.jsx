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
    <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
      <header className="pulse-panel-header">
        <div className="pulse-panel-copy">
          <span>Control · 03</span>
          <h2>Subdivision trainer</h2>
          <p>Cycle through two to four rhythmic groupings.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable subdivision trainer"
          disabled={disabled}
          onClick={handleToggle}
          className="pulse-switch"
        >
          <span aria-hidden="true" className="pulse-switch-track">
            <span className="pulse-switch-thumb" />
          </span>
        </button>
      </header>

      <fieldset
        disabled={!enabled || disabled}
        aria-label="Subdivision trainer settings"
        className={`pulse-subdivision-settings ${!enabled || disabled ? 'is-disabled' : ''}`}
      >
      <div className="pulse-cycle-summary">
        <span>Cycle</span>
        <div role="list" aria-label="Subdivision cycle order">
          {stages.map((stage, index) => {
            const isActive = enabled && isPlaying && activeStageIndex === index
            return (
              <div
                key={index}
                role="listitem"
                aria-current={isActive ? 'step' : undefined}
              >
                {index > 0 && <i aria-hidden="true">→</i>}
                <span
                  className={isActive ? 'is-active' : ''}
                >
                  {STAGE_LABELS[index]} · {stage.subdivision}
                </span>
              </div>
            )
          })}
          <div role="listitem">
            <i aria-hidden="true">→</i>
            <span>A</span>
          </div>
        </div>
      </div>

      <div className="pulse-stage-list">
        {stages.map((stage, index) => {
          const isActive = enabled && isPlaying && activeStageIndex === index
          return (
            <article
              key={index}
              className={`pulse-stage-card ${isActive ? 'is-active' : ''}`}
            >
              <header>
                <span
                  className="pulse-stage-badge"
                  aria-hidden="true"
                >
                  {STAGE_LABELS[index]}
                </span>
                <div>
                  <strong>Stage {STAGE_LABELS[index]}</strong>
                  {isActive && (
                    <span className="pulse-stage-progress">
                      Active · Bar {Math.min(activeBar, stage.bars)} of {stage.bars}
                    </span>
                  )}
                </div>
                {index >= 2 && (
                  <button
                    type="button"
                    aria-label={`Remove stage ${STAGE_LABELS[index]}`}
                    title={`Remove stage ${STAGE_LABELS[index]}`}
                    onClick={() => handleRemove(index)}
                    className="pulse-stage-remove"
                  >
                    ×
                  </button>
                )}
              </header>

              <div className="pulse-stage-controls">
                <SubdivisionPicker
                  subdivision={stage.subdivision}
                  accessibleLabel={`Stage ${STAGE_LABELS[index]} subdivision`}
                  onChange={(subdivision) => updateStage(index, { subdivision })}
                  className="pulse-stage-subdivision"
                />
                <div className="pulse-stepper"
                  role="group"
                  aria-label={`Stage ${STAGE_LABELS[index]} bars, currently ${stage.bars}`}
                >
                  <span className="pulse-control-label">Bars</span>
                  <div>
                    <button
                      type="button"
                      aria-label={`Decrease bars for stage ${STAGE_LABELS[index]}`}
                      disabled={!enabled || disabled}
                      onClick={() => handleBarsChange(index, stage.bars - 1)}
                      className="pulse-step-button"
                    >
                      −
                    </button>
                    <strong>{stage.bars}</strong>
                    <button
                      type="button"
                      aria-label={`Increase bars for stage ${STAGE_LABELS[index]}`}
                      disabled={!enabled || disabled}
                      onClick={() => handleBarsChange(index, stage.bars + 1)}
                      className="pulse-step-button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {stages.length < SUBDIVISION_TRAINER_MAX_STAGES && (
        <button
          type="button"
          disabled={!enabled || disabled}
          onClick={handleAdd}
          className="pulse-add-stage"
        >
          + Add subdivision
        </button>
      )}

      {enabled && isPlaying && (
        <p className="pulse-owned-note">
          Changes take effect at the next bar
        </p>
      )}
      </fieldset>
    </section>
  )
}
