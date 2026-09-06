import NumberWheel from './NumberWheel'
import SubdivisionDropdown from '../metronome/SubdivisionDropdown.jsx'

export default function SubdivisionStage({ stage, index, isActive, activeBar, disabled, onSubdivisionChange, onBarsChange, onRemove, denominator = 4 }) {
  const letter = ['A', 'B', 'C', 'D'][index]
  return <article className={`pulse-stage-card pulse-wheel-stage ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'step' : undefined}>
    <span className="pulse-wheel-stage-name" aria-label={`Stage ${letter}`}>{letter}</span>
    <SubdivisionDropdown value={stage.subdivision} disabled={disabled} label={`Stage ${letter} subdivision`} onChange={onSubdivisionChange} denominator={denominator} />
    <NumberWheel compact label={`Stage ${letter} bars`} min={1} max={16} value={stage.bars} disabled={disabled} onChange={onBarsChange} />
    {index >= 2 ? <button type="button" className="pulse-wheel-stage-remove" aria-label={`Remove stage ${letter}`} disabled={disabled} onClick={onRemove}>×</button> : <span />}
    {isActive && <span className="pulse-stage-progress">Active · Bar {Math.min(activeBar, stage.bars)} of {stage.bars}</span>}
  </article>
}
