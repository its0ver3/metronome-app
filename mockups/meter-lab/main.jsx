import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { activeBrand, resolveBrandAsset } from '../../src/brand/index.js'
import { getTempoColor } from '../../src/components/metronome/tempoHeat.js'
import { getGapDistance, parallelSegmentPath } from '../../src/components/metronome/orbitGeometry.js'
import { PRESETS, UNITS, makeSettings, defaultGroups, defaultUnit, validateMeter, groupSpans, buildBar } from './meter.js'
import { MeterPlayer } from './player.js'
import './style.css'

const STATES = ['OFF', 'ON', 'ACCENT']
function Signature({ n, d }) {
  return <span className="signature" aria-hidden="true"><span>{n}</span><span>{d}</span></span>
}
function Ring({ settings, pulse, playing, onAccent }) {
  const spans = groupSpans(settings)
  return <svg className="meter-orbit" viewBox="0 0 100 100" role="group" aria-label="Group accents: tap to cycle Off, On, Accent">
    {spans.map(span => {
      const gap = getGapDistance(Math.min(3.5, (span.angleEnd - span.angleStart) * .12), 42)
      const track = parallelSegmentPath(span.angleStart, span.angleEnd, gap, 48, 37.5)
      const state = settings.accents[span.index]
      const active = playing && pulse?.group === span.index
      const middle = (span.angleStart + span.angleEnd) / 2 * Math.PI / 180
      const label = `Group ${span.index + 1}, ${span.size} ${settings.d === 4 ? 'quarter' : 'eighth'} notes`
      return <g key={span.index}>
        <path d={track} className="orbit-track" />
        <path key={active ? pulse.time : 'rest'} d={state === 'ON' ? parallelSegmentPath(span.angleStart, span.angleEnd, gap, 42.75, 37.5) : track}
          className={`orbit-face state-${state.toLowerCase()} ${active ? 'is-flashing' : ''}`} />
        <text x={50 + Math.cos(middle) * 32} y={50 + Math.sin(middle) * 32} className="orbit-label" aria-hidden="true">{span.index + 1}</text>
        <path d={track} fill="transparent" stroke="transparent" strokeWidth="3" role="button" tabIndex="0" aria-label={`${label}: ${state.toLowerCase()}. Activate to change.`}
          onClick={() => onAccent(span.index)} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); onAccent(span.index) } }} />
      </g>
    })}
  </svg>
}

function MeterLab() {
  const [settings, setSettings] = useState(() => makeSettings())
  const [pulse, setPulse] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [meterOpen, setMeterOpen] = useState(true)
  const [custom, setCustom] = useState({ n: 7, d: 8, groups: '2+2+3' })
  const [customError, setCustomError] = useState('')
  const player = useRef(null)
  const token = useRef(0)
  useEffect(() => {
    player.current = new MeterPlayer(setPulse, () => { setPlaying(false); setPulse(null) })
    const stopHidden = () => { if (document.hidden) stop() }
    const stopPage = () => stop()
    document.addEventListener('visibilitychange', stopHidden)
    window.addEventListener('pagehide', stopPage)
    return () => {
      token.current++
      document.removeEventListener('visibilitychange', stopHidden)
      window.removeEventListener('pagehide', stopPage)
      player.current?.dispose()
    }
  }, [])
  function stop() {
    token.current++
    player.current?.stop()
    setBusy(false)
  }
  function change(patch) {
    stop()
    setSettings(previous => ({ ...previous, ...patch }))
  }
  function chooseMeter(meter) {
    stop()
    setSettings(previous => ({ ...previous, ...meter, groups: [...meter.groups], unit: defaultUnit(meter.d, meter.groups), division: 1, accents: meter.groups.map((_, i) => i === 0 ? 'ACCENT' : 'ON') }))
    setCustomError('')
  }
  async function togglePlayback() {
    if (playing || busy) { stop(); return }
    const attempt = ++token.current
    setBusy(true)
    setError('')
    try {
      const started = await player.current.start(settings)
      if (attempt !== token.current) return
      setPlaying(started)
    } catch (problem) { if (attempt === token.current) setError(problem.message || 'Audio could not start. Please try again.') }
    finally { if (attempt === token.current) setBusy(false) }
  }
  const currentBpm = pulse?.bpm || settings.bpm
  const bar = buildBar(settings)
  const compound = settings.d === 8 && settings.groups.every(group => group === 3)
  const groupChoices = settings.n === 5 && settings.d === 8 ? [[2, 3], [3, 2]]
    : settings.n === 7 && settings.d === 8 ? [[2, 2, 3], [2, 3, 2], [3, 2, 2]] : []
  const clicks = settings.d === 4
    ? [[1, 'Quarter notes'], [2, 'Eighth notes'], [3, 'Triplets'], [4, 'Sixteenth notes']]
    : [[0, 'Group pulses'], [1, 'Eighth notes'], [2, 'Sixteenth notes']]
  const divisionLabel = clicks.find(([value]) => value === settings.division)?.[1]
  const trainerNumber = (key, label, min, max) => <label className="numeric-setting"><span>{label}</span><input aria-label={label} type="number" inputMode="numeric" min={min} max={max} value={settings[key]} onChange={event => change({ [key]: Math.max(min, Math.min(max, Math.round(Number(event.target.value)) || min)) })} /></label>
  return <main className="meter-lab" style={{ '--accent': getTempoColor(currentBpm) }}>
    <header className="lab-nav"><a href="../../">← App</a><span>Meter study</span><span className="draft-tag">Prototype</span></header>
    <div className="phone">
      <img className="brand-logo" src={resolveBrandAsset(activeBrand.logo.src)} alt="Drums Only" />
      <section aria-label="Metronome" className="instrument">
        <div className="orbit-wrap">
          <Ring settings={settings} pulse={pulse} playing={playing} onAccent={index => { const accents = [...settings.accents]; accents[index] = STATES[(STATES.indexOf(accents[index]) + 1) % 3]; change({ accents }) }} />
          <div className="bpm-readout"><strong>{currentBpm}</strong><span><b aria-hidden="true">{UNITS[settings.unit].symbol}</b><span className="sr-only">{UNITS[settings.unit].name}</span> BPM</span></div>
        </div>
        <div className="transport"><button aria-label="Decrease tempo" disabled={settings.bpm <= 20} onClick={() => change({ bpm: settings.bpm - 1 })}>−</button><button className="play" aria-pressed={playing} onClick={togglePlayback}>{busy ? 'Cancel' : playing ? 'Stop' : 'Play'}</button><button aria-label="Increase tempo" disabled={settings.bpm >= 300} onClick={() => change({ bpm: settings.bpm + 1 })}>+</button></div>
        <input className="tempo-range" aria-label="Tempo" type="range" min="20" max="300" value={settings.bpm} onChange={event => change({ bpm: Number(event.target.value) })} />
        <div className="quick-controls">
          <button className="meter-pill" aria-label={`Meter ${settings.n}/${settings.d}. Open meter settings`} aria-expanded={meterOpen} aria-controls="meter-settings" onClick={() => setMeterOpen(value => !value)}><Signature n={settings.n} d={settings.d} /><span>{settings.groups.join(' + ')}</span><span aria-hidden="true">⌄</span></button>
          <label className="clicks-pill"><span>Clicks</span><select aria-label="Click subdivision" value={settings.division} onChange={event => change({ division: Number(event.target.value) })}>{clicks.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="playback-caption" aria-live="off">{playing ? `Bar ${pulse ? pulse.barIndex + 1 : 1}${pulse?.silent ? ' · Silent' : ''}${settings.subdiv ? ` · Stage ${pulse?.stage ? 'B' : 'A'}` : ''}` : `${bar.duration.toFixed(2)} seconds per bar`}</div>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <section className="panel meter-settings" id="meter-settings" hidden={!meterOpen} aria-label="Meter settings">
        <div className="panel-heading"><h1>Meter</h1><button className="quiet" onClick={() => setMeterOpen(false)}>Done</button></div>
        <div className="presets" role="group" aria-label="Common time signatures">{PRESETS.map(meter => <button key={`${meter.n}/${meter.d}`} aria-label={`${meter.n}/${meter.d}`} aria-pressed={settings.n === meter.n && settings.d === meter.d} onClick={() => chooseMeter(meter)}><Signature n={meter.n} d={meter.d} /></button>)}</div>
        {groupChoices.length > 0 && <div className="grouping"><span>Grouping</span><div role="group" aria-label="Eighth-note grouping">{groupChoices.map(groups => <button key={groups.join('+')} aria-pressed={settings.groups.join('+') === groups.join('+')} onClick={() => chooseMeter({ n: settings.n, d: settings.d, groups })}>{groups.join(' + ')}</button>)}</div></div>}
        <div className="meter-explanation"><strong>{settings.d === 4 ? `${settings.n} quarter notes per bar` : compound ? `${settings.groups.length} dotted-quarter pulses` : `${settings.groups.join(' + ')} eighth-note groups`}</strong><p>{compound ? 'Each main pulse divides into three eighth notes.' : settings.d === 4 ? 'Each quarter note can divide into two, three, or four clicks.' : 'Group sizes set the spacing between main pulses.'}</p></div>
        <label className="unit-setting"><span>BPM counts</span><select aria-label="Tempo note value" value={settings.unit} onChange={event => change({ unit: event.target.value })}>{Object.entries(UNITS).map(([id, unit]) => <option value={id} key={id}>{unit.symbol} {unit.name}</option>)}</select></label>
        <p className="hint">Changing the note value keeps the BPM number, so playback speed changes.</p>
        <details className="custom-meter"><summary>Custom meter</summary><form onSubmit={event => { event.preventDefault(); try {
          const groups = custom.groups.split('+').map(text => Number(text.trim()))
          const meter = { n: Number(custom.n), d: Number(custom.d), groups }
          validateMeter(meter)
          chooseMeter(meter)
        } catch (problem) { setCustomError(problem.message) } }}>
          <div className="custom-row"><label>Top<input type="number" inputMode="numeric" min="1" max="16" required value={custom.n} onChange={event => { const n = Number(event.target.value); setCustom({ ...custom, n, groups: Number.isInteger(n) && n >= 1 && n <= 16 ? defaultGroups(n, Number(custom.d)).join('+') : '' }) }} /></label><label>Bottom<select value={custom.d} onChange={event => { const d = Number(event.target.value); const n = Number(custom.n); setCustom({ ...custom, d, groups: Number.isInteger(n) && n >= 1 && n <= 16 ? defaultGroups(n, d).join('+') : '' }) }}><option value="4">4</option><option value="8">8</option></select></label></div>
          <label>Grouping<input value={custom.groups} required placeholder="2+2+3" onChange={event => setCustom({ ...custom, groups: event.target.value })} /></label><button className="apply" type="submit">Use this meter</button>
          {customError && <p className="error" role="alert">{customError}</p>}
        </form></details>
      </section>

      <details className="panel practice"><summary>Try with practice tools</summary><p className="hint">Intervals count complete bars in the selected meter.</p>
        <label className="trainer-toggle"><span>Gap Trainer</span><input type="checkbox" checked={settings.gap} onChange={event => change({ gap: event.target.checked })} /></label>
        {settings.gap && <div className="trainer-controls">{trainerNumber('audibleBars', 'Audible bars', 1, 16)}{trainerNumber('silentBars', 'Silent bars', 1, 16)}</div>}
        <label className="trainer-toggle"><span>Tempo Trainer</span><input type="checkbox" checked={settings.tempo} onChange={event => change({ tempo: event.target.checked })} /></label>
        {settings.tempo && <div className="trainer-controls">{trainerNumber('increment', 'Increase BPM', 1, 20)}{trainerNumber('everyBars', 'Every bars', 1, 16)}<p className="hint">Starts at {settings.bpm}; stops increasing at 300 BPM.</p></div>}
        <label className="trainer-toggle"><span>Subdivision Trainer</span><input type="checkbox" checked={settings.subdiv} onChange={event => change({ subdiv: event.target.checked })} /></label>
        {settings.subdiv && <div className="trainer-controls"><p className="stage-copy">A: {divisionLabel}<br />B: {settings.division === 0 ? 'Eighth notes' : 'Twice as many clicks'}</p>{trainerNumber('stageBars', 'Bars per stage', 1, 16)}</div>}
      </details>
      <p className="footnote">Tap a ring segment for Off / On / Accent. Off silences its whole group. Edits stop this preview; Play restarts at bar 1.</p>
      <footer>Separate audition—not connected to your app settings.<br /><a href="https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/" target="_blank" rel="noreferrer">Meter reference ↗</a></footer>
    </div>
  </main>
}
createRoot(document.getElementById('root')).render(<MeterLab />)
