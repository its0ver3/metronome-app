import throwoffAtlas from '../../assets/trainer-throwoff.png'
import './trainerThrowoff.css'

export default function TrainerToggle({
  enabled,
  disabled = false,
  label,
  controlsId,
  onToggle,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      aria-controls={controlsId}
      aria-expanded={controlsId ? enabled : undefined}
      disabled={disabled}
      onClick={onToggle}
      className="pulse-trainer-toggle"
    >
      <span className="pulse-throwoff-mechanism" aria-hidden="true">
        <span
          className="pulse-throwoff-art"
          style={{ '--throwoff-atlas': `url("${throwoffAtlas}")` }}
        >
          <span className="pulse-throwoff-body-mount">
            <span className="pulse-throwoff-body" />
          </span>
          <span className="pulse-throwoff-lever" />
        </span>
      </span>
    </button>
  )
}
