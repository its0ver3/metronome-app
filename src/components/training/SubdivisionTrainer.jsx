import { writtenNoteName } from '../../audio/meter.js'
import SubdivisionStage from './SubdivisionStage'
import SubdivisionNotation from '../metronome/SubdivisionNotation.jsx'
import TrainerCardHeader from './TrainerCardHeader'
import { SUBDIVISION_OPTIONS, SUBDIVISION_TRAINER_MAX_STAGES } from '../../audio/constants'

const STAGE_LABELS = ['A', 'B', 'C', 'D']

export default function SubdivisionTrainer({
  enabled,
  stages,
  activeStageIndex,
  activeBar,
  isPlaying,
  disabled = false,
  denominator = 4,
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
      <TrainerCardHeader
        type="subdivision"
        title="Subdivision Trainer"
        description="Cycle through subdivisions."
        readout={
          <div className="pulse-trainer-sequence">
            <ol aria-label={`Subdivision sequence, clicks per ${denominator === 4 ? 'beat' : writtenNoteName(denominator)}`}>
              {stages.map((stage, index) => {
                const isActive = enabled && isPlaying && !disabled && activeStageIndex === index
                return (
                  <li key={index} aria-current={isActive ? 'step' : undefined}>
                    {index > 0 && <span className="pulse-trainer-sequence-arrow" aria-hidden="true">→</span>}
                    <span className="pulse-trainer-sequence-value" aria-label={`Stage ${STAGE_LABELS[index]}: ${stage.subdivision} ${stage.subdivision === 1 ? 'click' : 'clicks'} per ${denominator === 4 ? 'beat' : writtenNoteName(denominator)}`}><SubdivisionNotation count={stage.subdivision} denominator={denominator} /></span>
                  </li>
                )
              })}
            </ol>
          </div>
        }
        enabled={enabled}
        controlsId="subdivision-trainer-settings"
        disabled={disabled}
        onToggle={handleToggle}
      />
      <div id="subdivision-trainer-settings" aria-hidden={!enabled} inert={!enabled ? true : undefined}
        className={`pulse-trainer-settings-reveal ${enabled ? 'is-open' : ''}`}>
        <div className="pulse-trainer-settings-clip">
          <fieldset disabled={!enabled || disabled} aria-label="Subdivision Trainer settings" className="pulse-trainer-settings pulse-subdivision-wheel-settings">
            <div className="pulse-wheel-stage-labels" aria-hidden="true"><span>Stage</span><span>Subdivision</span><span>Bars</span><span /></div>
            <div className="pulse-stage-list">
              {stages.map((stage, index) => {
                const isActive = enabled && isPlaying && !disabled && activeStageIndex === index
                return <SubdivisionStage key={index} stage={stage} index={index} isActive={isActive} activeBar={activeBar} disabled={!enabled || disabled} denominator={denominator}
                  onSubdivisionChange={subdivision => updateStage(index, { subdivision })}
                  onBarsChange={value => handleBarsChange(index, value)} onRemove={() => handleRemove(index)} />
              })}
            </div>
            {stages.length < SUBDIVISION_TRAINER_MAX_STAGES && (
              <button type="button" disabled={!enabled || disabled} onClick={handleAdd} className="pulse-add-stage">+ Add stage</button>
            )}
            {enabled && isPlaying && <p className="pulse-owned-note">Changes take effect at the next bar</p>}
          </fieldset>
        </div>
      </div>
    </section>
  )
}
