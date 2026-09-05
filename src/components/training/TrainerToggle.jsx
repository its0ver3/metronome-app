import throwoffBody from '../../assets/trainer-throwoff-body.png'
import throwoffLever from '../../assets/trainer-throwoff-lever.png'
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
        <span className="pulse-throwoff-art">
          <img className="pulse-throwoff-body" src={throwoffBody} alt="" draggable={false} />
          <img className="pulse-throwoff-lever" src={throwoffLever} alt="" draggable={false} />
        </span>
      </span>
    </button>
  )
}
