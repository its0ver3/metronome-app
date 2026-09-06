import SubdivisionNotation from './SubdivisionNotation'
import { getSubdivisionLabel } from './subdivisionMusic'
import { getPracticeRows } from './practiceStatus'
import './practiceStatusRack.css'

export default function PracticeStatusRack({ onOpenTraining, ...props }) {
  const activeCount = [props.gapEnabled, props.tempoEnabled, props.subdivTrainerEnabled].filter(Boolean).length
  if (!activeCount) return null
  const Row = onOpenTraining ? 'button' : 'div'
  if (props.polyrhythmMode) return <section className="pulse-practice-rack is-paused" aria-label="Active training status">
    <Row className="pulse-practice-row" {...(onOpenTraining ? { type: 'button', onClick: onOpenTraining } : {})}>
      <span className="pulse-practice-copy"><span className="pulse-practice-name">Practice tools</span><strong>{activeCount} {activeCount === 1 ? 'trainer' : 'trainers'} paused</strong></span>
      <span className="pulse-practice-progress">Polyrhythm on</span>
    </Row>
  </section>
  const rows = getPracticeRows(props)
  if (!rows.length) return null
  return <section className="pulse-practice-rack" aria-label="Active training status">
    {rows.map(row => {
      const value = row.id === 'tempo' ? `${row.value} to ${row.target} BPM` : row.id === 'subdivision'
        ? `Stage ${row.value}, ${getSubdivisionLabel(row.subdivision, row.denominator)}` : row.value
      const progress = row.progressLabel || `Bar ${row.bar} of ${row.total}`
      return <Row key={row.id} className="pulse-practice-row"
        aria-label={`${row.name}: ${value}. ${progress}.${onOpenTraining ? ' Open practice tools.' : ''}`}
        {...(onOpenTraining ? { type: 'button', onClick: onOpenTraining } : {})}>
        <span className="pulse-practice-copy">
          <span className="pulse-practice-name">{row.name}</span>
          <strong>{row.value}{row.id === 'tempo' && <><span className="pulse-practice-arrow" aria-hidden="true">→</span><span className="pulse-practice-target">{row.target}</span></>}
            {row.subdivision && <SubdivisionNotation count={row.subdivision} denominator={row.denominator} />}
          </strong>
        </span>
        <span className="pulse-practice-progress">
          <span>{row.progressLabel || <>Bar <b>{row.bar}<em>/{row.total}</em></b></>}</span>
          <span className="pulse-practice-meter" data-dense={row.total > 8 || undefined} aria-hidden="true">
            {Array.from({ length: row.total }, (_, index) => <i key={index} className={index < row.bar ? 'is-filled' : undefined} />)}
          </span>
        </span>
      </Row>
    })}
  </section>
}
