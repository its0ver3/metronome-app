import TrainerToggle from './TrainerToggle'
import TrainerIcon from './TrainerIcon'
import NumberWheel from './NumberWheel'
import './trainerCards.css'

export default function TrainerCardHeader({
  type,
  title,
  description,
  metrics,
  summary,
  readout,
  metricsId,
  enabled,
  disabled,
  controlsId,
  onToggle,
}) {
  return (
    <header className="pulse-panel-header pulse-trainer-card-header">
      <span className="pulse-trainer-glyph" aria-hidden="true">
        <span className="pulse-trainer-hoop-ears">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} style={{ '--ear-angle': `${index * 45}deg` }} />
          ))}
        </span>
        <span className="pulse-trainer-hoop-flange">
          <span className="pulse-trainer-hoop-head"><TrainerIcon type={type} /></span>
        </span>
      </span>
      <div className="pulse-panel-copy">
        <div className="pulse-trainer-heading">
          <h2>{title}</h2>
          {description && <p className="pulse-trainer-description">{description}</p>}
        </div>
        {readout ?? (summary ? <p className="pulse-trainer-summary">{summary}</p> : <dl className="pulse-trainer-metrics" id={metricsId}>
          {metrics.map(({ label, value, min, max, onChange }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{onChange ? <NumberWheel label={label} value={value} min={min} max={max} onChange={onChange} disabled={!enabled || disabled} /> : value}</dd>
            </div>
          ))}
        </dl>)}
      </div>
      <TrainerToggle
        enabled={enabled}
        label={`Enable ${title}`}
        controlsId={controlsId}
        disabled={disabled}
        onToggle={onToggle}
      />
    </header>
  )
}
