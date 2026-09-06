import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AudioEngine from '../../src/audio/AudioEngine.js'
import NumberWheel from '../../src/components/training/NumberWheel.jsx'
import TrainerCardHeader from '../../src/components/training/TrainerCardHeader.jsx'
import { activeBrand, getBrandCssProperties, resolveBrandAsset } from '../../src/brand/index.js'
import { getTempoColor } from '../../src/components/metronome/tempoHeat.js'
import { choices, notationFor, Notes } from './notation.jsx'
import '../../src/index.css'
import './style.css'

function Value({ count, notation, active = -1 }) {
  return notation ? <Notes count={count} active={active} /> : <span className="lab-count">{count}</span>
}

function Picker({ label, value, onChange, notation }) {
  const rail = useRef(null)
  useEffect(() => {
    const selected = rail.current?.querySelector('[aria-pressed="true"]')
    if (selected) rail.current.scrollLeft = Math.max(0, selected.offsetLeft - 60)
  }, [])
  return <div className="lab-picker">
    <div className="lab-picker-caption"><span>{label}</span><span>Swipe to browse →</span></div>
    <div ref={rail} className="lab-note-rail" role="group" aria-label={label}>
      {choices.map(count => <button key={count} type="button" aria-pressed={value === count}
        aria-label={`${notationFor(count).name}, ${count} ${count === 1 ? 'click' : 'clicks'} per beat`}
        onClick={() => onChange(count)}><Value count={count} notation={notation} /></button>)}
    </div>
    <p className="lab-choice-name" aria-live="polite">{notationFor(value).name}</p>
  </div>
}

function Lab() {
  const [notation, setNotation] = useState(true)
  const [view, setView] = useState('metronome')
  const [subdivision, setSubdivision] = useState(4)
  const [stages, setStages] = useState([{ subdivision: 2, bars: 2 }, { subdivision: 3, bars: 2 }])
  const [enabled, setEnabled] = useState(true)
  const [editing, setEditing] = useState(null)
  const [bpm, setBpm] = useState(100)
  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pulse, setPulse] = useState({ beat: -1, subdivision: -1, stage: 0, count: 4 })
  const engineRef = useRef(null)
  const startToken = useRef(0)
  const getEngine = () => {
    if (!engineRef.current) {
      const engine = new AudioEngine()
      engine.setVolume(.45)
      engine.onStateChange(setPlaying)
      engine.onBeat(event => {
        const state = engine.getState()
        setPulse({ ...event, stage: state.subdivTrainerStageIndex, count: state.subdivision })
      })
      engineRef.current = engine
    }
    return engineRef.current
  }
  const stop = () => {
    startToken.current++
    engineRef.current?.stop()
    setBusy(false)
    setPulse(p => ({ ...p, beat: -1, subdivision: -1 }))
  }
  useEffect(() => {
    const onHide = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      startToken.current++
      document.removeEventListener('visibilitychange', onHide)
      engineRef.current?.stop()
      engineRef.current?.ctx?.close()
    }
  }, [])
  useEffect(() => { engineRef.current?.setBpm(bpm) }, [bpm])
  const play = async () => {
    if (playing || busy) { stop(); return }
    const token = ++startToken.current
    setBusy(true)
    setError('')
    const engine = getEngine()
    engine.setBpm(bpm)
    engine.setBeatsPerBar(4)
    engine.setSubdivision(subdivision)
    engine.setSubdivisionTrainer(view === 'trainer' && enabled, stages)
    try {
      await engine.start()
      if (token !== startToken.current) { engine.stop(); return }
      if (!engine.isPlaying) setError('Audio could not start. Tap Play to try again.')
    } catch { setError('Audio could not start. Tap Play to try again.') }
    finally { if (token === startToken.current) setBusy(false) }
  }
  const updateStage = (index, change) => {
    stop()
    setStages(previous => previous.map((stage, i) => i === index ? { ...stage, ...change } : stage))
  }
  const shownCount = playing ? pulse.count : view === 'trainer' && enabled ? stages[0].subdivision : subdivision
  return <div className="notation-lab" style={{ ...getBrandCssProperties(activeBrand), '--trainer-accent': getTempoColor(bpm), '--tempo-heat-color': getTempoColor(bpm) }}>
    <header className="lab-top"><a href="../../">← App</a><span>Subdivision study</span><span className="lab-tag">Mockup</span></header>
    <div className="lab-phone">
      <img className="lab-logo" src={resolveBrandAsset(activeBrand.logo.src)} alt="Drums Only" />
      <div className="lab-compare" role="group" aria-label="Subdivision display">
        <button aria-pressed={notation} onClick={() => setNotation(true)}>Notation</button>
        <button aria-pressed={!notation} onClick={() => setNotation(false)}>Numbers</button>
      </div>
      <nav className="lab-tabs" aria-label="Preview screen">
        {[['metronome', 'Metronome'], ['trainer', 'Practice tools']].map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => { stop(); setView(id); setEditing(null) }}>{label}</button>)}
      </nav>

      {view === 'metronome' ? <section className="lab-main-card">
        <header><h1>Shape the click</h1><span>4 beats</span></header>
        <div className="lab-selected"><Value count={shownCount} notation={notation} active={playing ? pulse.subdivision : -1} /></div>
        <Picker label="Subdivision" value={subdivision} notation={notation} onChange={value => { stop(); setSubdivision(value) }} />
      </section> : <div className="pulse-training-stack lab-trainer-stack">
        <section className={`pulse-panel pulse-trainer-card ${enabled ? 'is-enabled' : ''}`}>
          <TrainerCardHeader type="subdivision" title="Subdivision Trainer" description="Cycle through subdivisions."
            enabled={enabled} controlsId="lab-stage-controls" onToggle={() => { stop(); setEnabled(!enabled); setEditing(null) }}
            readout={<div className="lab-sequence" aria-label="Subdivision sequence">{stages.map((stage, index) => <React.Fragment key={index}>
              {index > 0 && <span aria-hidden="true">→</span>}
              <span className={playing && pulse.stage === index ? 'is-current' : ''} aria-label={`Stage ${index + 1}: ${notationFor(stage.subdivision).name}`}><Value count={stage.subdivision} notation={notation} /></span>
            </React.Fragment>)}</div>} />
          {enabled && <div id="lab-stage-controls" className="lab-stages">
            <div className="lab-stage-labels"><span>Stage</span><span>Subdivision</span><span>Bars</span></div>
            {stages.map((stage, index) => <div key={index} className={`lab-stage ${playing && pulse.stage === index ? 'is-current' : ''}`}>
              <div className="lab-stage-row"><span>{String.fromCharCode(65 + index)}</span>
                <button className="lab-stage-choice" aria-expanded={editing === index} aria-controls={`lab-picker-${index}`} aria-label={`Change stage ${String.fromCharCode(65 + index)} subdivision: ${notationFor(stage.subdivision).name}`} onClick={() => setEditing(editing === index ? null : index)}>
                  <Value count={stage.subdivision} notation={notation} /><span className="lab-chevron" aria-hidden="true">⌄</span>
                </button>
                <NumberWheel compact label={`Stage ${String.fromCharCode(65 + index)} bars`} min={1} max={16} value={stage.bars} onChange={bars => updateStage(index, { bars })} />
              </div>
              {editing === index && <div id={`lab-picker-${index}`}><Picker label={`Stage ${String.fromCharCode(65 + index)}`} value={stage.subdivision} notation={notation} onChange={value => { updateStage(index, { subdivision: value }); setEditing(null) }} /></div>}
            </div>)}
          </div>}
        </section>
      </div>}

      <section className="lab-audition" aria-label="Audition the selected subdivisions">
        <div className="lab-audition-top"><label htmlFor="lab-bpm">{bpm} <span>BPM</span></label><div className="lab-beats" aria-label="Beat in a four-beat bar">{[0, 1, 2, 3].map(beat => <i key={beat} className={playing && pulse.beat === beat ? 'is-current' : ''} />)}</div></div>
        <input id="lab-bpm" type="range" min="40" max="200" value={bpm} onChange={event => setBpm(Number(event.target.value))} />
        <button className="lab-play" onClick={play} aria-pressed={playing}>{busy ? 'Cancel' : playing ? '■ Stop' : '▶ Play'}</button>
        {error && <p role="alert">{error}</p>}
      </section>
      <p className="lab-footnote">One group = one beat. {view === 'trainer' ? 'Tap a note group to change it. ' : ''}Pattern edits stop the preview; Play restarts from the beginning.</p>
      <footer><a href="https://github.com/steinbergmedia/bravura" target="_blank" rel="noreferrer">Bravura music font</a><span> · </span><a href="./OFL.txt">OFL license</a></footer>
    </div>
  </div>
}

createRoot(document.getElementById('root')).render(<Lab />)
