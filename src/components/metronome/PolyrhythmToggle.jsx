export default function PolyrhythmToggle({ enabled, onToggle }) {
  return (
    <div className="pulse-polyrhythm-toggle">
      <span>Polyrhythm mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Polyrhythm mode"
        title={`${enabled ? 'Disable' : 'Enable'} polyrhythm mode`}
        onClick={() => onToggle(!enabled)}
        className="pulse-mode-switch"
      >
        <span
          aria-hidden="true"
          className="pulse-mode-switch-track"
        >
          <span className="pulse-mode-switch-thumb" />
        </span>
      </button>
    </div>
  )
}
