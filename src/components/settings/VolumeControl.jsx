import { useId } from 'react'

export default function VolumeControl({ volume, onChange }) {
  const inputId = useId()
  const percent = Math.round(volume * 100)

  return (
    <section className="pulse-panel pulse-volume-card">
      <header className="pulse-panel-header">
        <div className="pulse-panel-copy">
          <span>Output</span>
          <h2>Volume</h2>
          <p>Set a comfortable level for speakers or headphones.</p>
        </div>
        <strong className="pulse-volume-value" aria-hidden="true">{percent}%</strong>
      </header>
      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        aria-label="Volume"
        aria-valuetext={`${percent} percent`}
        className="pulse-volume-slider"
      />
    </section>
  )
}
