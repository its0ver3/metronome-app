import { normalizeSessionSettings } from '../../audio/sessionSettings'
import NumberWheel from '../training/NumberWheel'
import './sessionSettings.css'

export default function SessionSettings({ settings, isPlaying, onChange }) {
  const config = normalizeSessionSettings(settings)
  const update = change => onChange({ ...config, ...change })
  return <>
    <section className="pulse-panel pulse-session-card">
      <div className="pulse-panel-copy">
        <h2>Count-in</h2>
      </div>
      <div className="pulse-session-options" role="group" aria-label="Count-in bars">
        {[0, 1, 2].map(bars => <button key={bars} type="button" disabled={isPlaying}
          aria-label={`${bars} ${bars === 1 ? 'bar' : 'bars'}`}
          aria-pressed={config.countInBars === bars} onClick={() => update({ countInBars: bars })}>
          {bars}
        </button>)}
        <span className="pulse-session-unit" aria-hidden="true">bars</span>
      </div>
    </section>
    <section className="pulse-panel pulse-session-card">
      <div className="pulse-panel-copy">
        <h2>Playback timer</h2>
      </div>
      <div className="pulse-session-duration">
        {config.mode !== 'off' && <NumberWheel key={config.mode} compact label={`Playback timer ${config.mode}`}
          value={config[config.mode]} min={1} max={config.mode === 'minutes' ? 180 : 999}
          disabled={isPlaying} onChange={value => update({ [config.mode]: value })} />}
        <select aria-label="Playback timer mode" value={config.mode} disabled={isPlaying}
          onChange={event => update({ mode: event.target.value })}>
          <option value="off">Off</option>
          <option value="minutes">Minutes</option>
          <option value="bars">Bars</option>
        </select>
      </div>
      {isPlaying && <p className="pulse-session-hint">Stop playback to change the count-in or timer.</p>}
    </section>
  </>
}
