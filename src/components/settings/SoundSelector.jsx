import { SOUND_NAMES } from '../../audio/constants'

export default function SoundSelector({ selectedIndex, onSelect, onPreview }) {
  return (
    <section className="pulse-panel pulse-sound-card">
      <header className="pulse-panel-header">
        <div className="pulse-panel-copy">
          <span>Voice</span>
          <h2>Click sound</h2>
          <p>Tap a sound to select and preview it.</p>
        </div>
      </header>
      <div className="pulse-sound-grid">
        {SOUND_NAMES.map((name, i) => (
          <button
            type="button"
            key={i}
            aria-pressed={selectedIndex === i}
            onClick={() => {
              onSelect(i)
              onPreview(i)
            }}
            className={`pulse-sound-option ${selectedIndex === i ? 'is-selected' : ''}`}
          >
            <span>{name}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}
