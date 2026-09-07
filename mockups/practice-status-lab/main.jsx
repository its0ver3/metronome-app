import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Play, Pause, SkipForward, X, Metronome, SlidersHorizontal, GearSix, CaretDown } from '@phosphor-icons/react'
import TrainerIcon from '../../src/components/training/TrainerIcon.jsx'
import GapPatternNotation from '../../src/components/training/GapPatternNotation.jsx'
import SubdivisionNotation from '../../src/components/metronome/SubdivisionNotation.jsx'
import PolyrhythmOrbit, { StandardRhythmOrbit } from '../../src/components/metronome/PolyrhythmOrbit.jsx'
import { getGapPatternLabel } from '../../src/audio/gapPatterns.js'
import './style.css'

const DESIGNS = [
  { id: 'rack', number: '05', name: 'Practice rack', tag: 'Selected · refined', idea: 'The same three steady rows, with aligned values, explicit bar counts, and a clean left edge without icons or accent markers.', audience: 'Combining practice tools', tradeoff: 'Keeps every tool equally easy to find. The reference for this round.', selected: true },
  { id: 'rings', number: '06', name: 'Count rings', tag: 'Read progress as a shape', idea: 'Each trainer gets a small ring that fills one bar at a time. The current pattern or tempo sits at its center.', audience: 'Glancing between phrases', tradeoff: 'Makes progress visible without scanning numbers. Needs the labels to distinguish each cycle.' },
  { id: 'ledger', number: '07', name: 'Change ledger', tag: 'Current → next', idea: 'A compact rehearsal chart: what is happening now, what comes next, and how many bars until it changes.', audience: 'Structured practice routines', tradeoff: 'The clearest view of upcoming changes. More information to read at a distance.' },
  { id: 'tiles', number: '08', name: 'Tool tiles', tag: 'One tool, one surface', idea: 'Three vertical tiles, each with a large current value and a progress line along the bottom.', audience: 'Quick individual checks', tradeoff: 'Each tool is easy to target. Long rhythm names need a compact notation preview.' },
  { id: 'lines', number: '09', name: 'Signal lines', tag: 'Lightest footprint', idea: 'Three open lines of status above the tempo dial. A quiet bar-progress rule replaces the enclosing panel.', audience: 'Minimal everyday setup', tradeoff: 'Keeps the screen open and calm. The status area is less visually separated from the metronome.' },
]
const TYPES = ['gap', 'tempo', 'subdivision']
const NAMES = { gap: 'Gap', tempo: 'Tempo', subdivision: 'Subdivision' }
const SUBDIVISIONS = [1, 2, 4, 3]

function Icon({ type }) { return <span className="tool-icon"><TrainerIcon type={type} /></span> }
function Notes({ count }) { return <span className="notes"><SubdivisionNotation count={count} /></span> }
function GapNotes({ pattern }) { return <span className="notes gap-notes"><GapPatternNotation pattern={pattern} /></span> }
function Meter({ filled, total, gap = false }) { return <span className={`mini-meter ${gap ? 'is-gap' : ''}`} aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={i < filled ? 'filled' : ''} />)}</span> }
function ToolButton({ type, onInspect, children, className = '', label }) {
  return <button type="button" className={`tool-button ${className}`} title={label} onClick={() => onInspect(type)} aria-label={label || `Inspect ${NAMES[type]} Trainer`}>{children}</button>
}

function toolState(type, s) {
  const label = type === 'gap' ? s.phaseLabel : type === 'tempo' ? `${s.bpm} BPM` : `Stage ${s.stage}`
  const count = type === 'tempo' ? s.tempoBar : s.phaseBar
  const total = type === 'tempo' ? 4 : 2
  const done = type === 'tempo' && s.bpm === 120
  const next = type === 'gap' ? (s.inGap ? 'Click' : s.pattern === 'silence' ? 'Silent' : getGapPatternLabel(s.pattern))
    : type === 'tempo' ? `${Math.min(120, s.bpm + 5)} BPM` : `Stage ${s.nextStage}`
  const remaining = total - count + 1
  return { label, count, total, done, next, remaining, progress: done ? 1 : count / total,
    description: `${NAMES[type]} Trainer: ${label}. ${done ? 'Target reached.' : `Bar ${count} of ${total}. Next: ${next}, in ${remaining} ${remaining === 1 ? 'bar' : 'bars'}.`} Inspect details.` }
}
function CountRings({ state: s, onInspect }) {
  return <div className="count-rings">{TYPES.filter(type => s.enabled[type]).map(type => {
    const t = toolState(type, s)
    return <ToolButton key={type} type={type} onInspect={onInspect} className={type === 'gap' && s.inGap ? 'gap-state' : ''} label={t.description}>
      <span className="ring-name"><Icon type={type} />{type === 'subdivision' ? 'Subdiv' : NAMES[type]}</span>
      <span className="count-ring">
        <svg viewBox="0 0 80 80" aria-hidden="true"><circle className="ring-track" cx="40" cy="40" r="34" /><circle className="ring-fill" cx="40" cy="40" r="34" pathLength="100" strokeDasharray={`${t.progress * 100} 100`} transform="rotate(-90 40 40)" /></svg>
        <span className="ring-value">{type === 'gap' ? (s.inGap ? <GapNotes pattern={s.pattern} /> : <Notes count={s.subdivision} />) : type === 'tempo' ? <b>{s.bpm}</b> : <Notes count={s.subdivision} />}</span>
      </span>
      <strong>{type === 'gap' ? s.phaseLabel : type === 'tempo' ? '→ 120 BPM' : `Stage ${s.stage}`}</strong>
      <small>{t.done ? 'At target' : `Bar ${t.count}/${t.total}`}</small>
    </ToolButton>
  })}</div>
}
function ChangeLedger({ state: s, onInspect }) {
  return <div className="change-ledger">
    <div className="ledger-heading" aria-hidden="true"><span>Tool</span><span>Now</span><span>Next</span><span>In</span></div>
    {TYPES.filter(type => s.enabled[type]).map(type => {
      const t = toolState(type, s)
      return <ToolButton key={type} type={type} onInspect={onInspect} label={t.description}>
        <span className="ledger-tool"><Icon type={type} /><small>{type === 'subdivision' ? 'Subdiv' : NAMES[type]}</small></span>
        <span className={`ledger-now ${type === 'gap' && s.inGap ? 'gap-state' : ''}`}>{type === 'gap' ? <><strong>{s.inGap ? 'Gap' : 'Click'}</strong>{s.inGap && <GapNotes pattern={s.pattern} />}</> : type === 'tempo' ? <strong>{s.bpm}</strong> : <><b>{s.stage}</b><Notes count={s.subdivision} /></>}</span>
        <span className="ledger-next">{type === 'gap' ? (s.inGap ? 'Click' : s.pattern === 'silence' ? 'Silent' : <GapNotes pattern={s.pattern} />) : type === 'tempo' ? t.done ? 'Target' : s.bpm + 5 : <>{s.nextStage}<Notes count={s.nextSubdivision} /></>}</span>
        <span className="ledger-when">{t.done ? <span>✓</span> : <><b>{t.remaining}</b><small>{t.remaining === 1 ? 'bar' : 'bars'}</small></>}</span>
      </ToolButton>
    })}
  </div>
}
function ToolTiles({ state: s, onInspect }) {
  return <div className="tool-tiles">{TYPES.filter(type => s.enabled[type]).map(type => {
    const t = toolState(type, s)
    return <ToolButton key={type} type={type} onInspect={onInspect} className={type === 'gap' && s.inGap ? 'gap-state' : ''} label={t.description}>
      <span className="tile-name"><Icon type={type} />{type === 'subdivision' ? 'Subdiv' : NAMES[type]}</span>
      <span className="tile-value">{type === 'gap' ? (s.inGap ? <GapNotes pattern={s.pattern} /> : <Notes count={s.subdivision} />) : type === 'tempo' ? <b>{s.bpm}</b> : <Notes count={s.subdivision} />}</span>
      <strong>{type === 'gap' ? s.phaseLabel : type === 'tempo' ? '→ 120 BPM' : `Stage ${s.stage}`}</strong>
      <span className="tile-bottom"><small>{t.done ? 'At target' : `${t.count}/${t.total} bars`}</small><span className="tile-rule" aria-hidden="true"><i style={{ width: `${t.progress * 100}%` }} /></span></span>
    </ToolButton>
  })}</div>
}
function SignalLines({ state: s, onInspect }) {
  return <div className="signal-lines">{TYPES.filter(type => s.enabled[type]).map(type => {
    const t = toolState(type, s)
    return <ToolButton key={type} type={type} onInspect={onInspect} className={type === 'gap' && s.inGap ? 'gap-state' : ''} label={t.description}>
      <span className="signal-label"><Icon type={type} /><small>{type === 'subdivision' ? 'Subdiv' : NAMES[type]}</small></span>
      <strong>{type === 'gap' ? s.phaseLabel : type === 'tempo' ? <>{s.bpm}<ArrowRight />120</> : <>{s.stage}<Notes count={s.subdivision} /></>}</strong>
      <span className="signal-count">{t.done ? '✓' : <>{t.count}<em>/{t.total}</em></>}</span>
      <span className="signal-rule" aria-hidden="true"><i style={{ width: `${t.progress * 100}%` }} /></span>
    </ToolButton>
  })}</div>
}
function Rack({ state: s, onInspect }) {
  return <div className="practice-rack">{TYPES.filter(type => s.enabled[type]).map(type => {
    const t = toolState(type, s)
    return <ToolButton key={type} type={type} onInspect={onInspect} className="rack-row" label={t.description}>
      <span className="rack-copy"><small>{NAMES[type]}</small><strong>{type === 'gap' ? s.phaseLabel : type === 'tempo' ? <>{s.bpm}<ArrowRight /><span className="rack-target">120</span></> : <><span className="stage-letter">{s.stage}</span><Notes count={s.subdivision} /></>}</strong></span>
      <span className="rack-progress"><span>{t.done ? 'Target ✓' : <>Bar <b>{t.count}<em>/{t.total}</em></b></>}</span><Meter filled={t.done ? t.total : t.count} total={t.total} gap={type === 'gap' && s.inGap} /></span>
    </ToolButton>
  })}</div>
}
const VIEWS = { rack: Rack, rings: CountRings, ledger: ChangeLedger, tiles: ToolTiles, lines: SignalLines }

function Phone({ design, state: s, running, onRun }) {
  const [inspected, setInspected] = useState(null)
  const View = VIEWS[design.id]
  const activeCount = TYPES.filter(type => s.enabled[type]).length
  return <div className={`phone ${s.paused ? 'is-paused' : ''}`} onKeyDown={event => { if (event.key === 'Escape') setInspected(null) }}>
    <header className="phone-brand"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="Drums Only" /><span>METRONOME</span></header>
    <div className="status-zone">
      {s.paused && activeCount > 0 ? <button className="paused-status" onClick={() => setInspected('paused')}><Pause size={16} /><span>{activeCount} practice {activeCount === 1 ? 'tool' : 'tools'} paused<small>Polyrhythm is on</small></span></button>
        : activeCount > 0 ? <View state={s} onInspect={setInspected} /> : <div className="no-tools">Practice tools off</div>}
    </div>
    <div className="demo-orbit">
      {s.paused ? <PolyrhythmOrbit rhythm1={3} rhythm2={4} accents1={['ACCENT','ACCENT','ACCENT']} accents2={['ACCENT','ACCENT','ACCENT','ACCENT']} isPlaying={false} interactive={false} /> : <StandardRhythmOrbit beatCount={4} subdivision={1} accents={['ACCENT','ACCENT','ACCENT','ACCENT']} activeBeat={s.beat} isPlaying={running} interactive={false} />}
      <div className="orbit-value"><strong>{s.bpm}</strong><span>BPM</span></div>
    </div>
    <div className="demo-transport"><span aria-hidden="true">−</span><button disabled={s.paused} onClick={onRun} aria-label={running ? 'Pause silent animation' : 'Play silent animation'}>{running ? <Pause weight="fill" /> : <Play weight="fill" />}<span>{running ? 'Stop' : 'Start'}</span></button><span aria-hidden="true">+</span></div>
    <div className="demo-slider" aria-hidden="true"><i /><b /></div>
    <div className="demo-quickbar"><span>Tap tempo</span><span>{s.paused ? '3:4' : '4/4'} <Notes count={s.subdivision} /><CaretDown /></span></div>
    <footer className="phone-nav"><span className="selected"><Metronome />Metronome</span><span><SlidersHorizontal />Practice</span><span><GearSix />Settings</span></footer>
    {inspected && <div className="inspector-backdrop" onClick={() => setInspected(null)}><section className="inspector" aria-label="Demo trainer details" onClick={event => event.stopPropagation()}><button className="close-detail" autoFocus onClick={() => setInspected(null)} aria-label="Close details"><X /></button>
      <small>STATUS DETAIL</small><h3>{inspected === 'paused' ? 'Training paused' : `${NAMES[inspected]} Trainer`}</h3>
      <p>{inspected === 'gap' ? `2 click bars → 2 gap bars. Gap pattern: ${getGapPatternLabel(s.pattern)}.` : inspected === 'tempo' ? 'Start at 100 BPM. Add 5 BPM every 4 bars, up to 120 BPM.' : inspected === 'subdivision' ? 'A: quarters → B: eighths → C: sixteenths → D: triplets. Each stage lasts 2 bars.' : 'Saved trainer settings resume when Polyrhythm is turned off.'}</p><span className="detail-note">Mockup detail · no settings changed</span>
    </section></div>}
  </div>
}

function App() {
  const [enabled, setEnabled] = useState({ gap: true, tempo: true, subdivision: true })
  const [pattern, setPattern] = useState('silence')
  const [tick, setTick] = useState(8)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [focus, setFocus] = useState('all')
  useEffect(() => {
    if (!running || paused) return
    const timer = setInterval(() => setTick(value => (value + 1) % 80), 550)
    return () => clearInterval(timer)
  }, [running, paused])
  const bar = Math.floor(tick / 4), beat = tick % 4
  const stageIndex = Math.floor(bar / 2) % 4
  const inGap = bar % 4 >= 2
  const state = { enabled, pattern, paused, bar, beat, inGap, phaseBar: bar % 2 + 1, stageBar: bar % 2 + 1, tempoBar: bar % 4 + 1,
    bpm: enabled.tempo ? Math.min(120, 100 + Math.floor(bar / 4) * 5) : 108,
    stage: 'ABCD'[stageIndex], nextStage: 'ABCD'[(stageIndex + 1) % 4], subdivision: enabled.subdivision ? SUBDIVISIONS[stageIndex] : 1,
    nextSubdivision: SUBDIVISIONS[(stageIndex + 1) % 4], phaseLabel: inGap ? (pattern === 'silence' ? 'Silent' : getGapPatternLabel(pattern)) : 'Click' }
  return <main className="lab">
    <header className="lab-heading"><div><p className="eyebrow">DRUMS ONLY / STATUS STUDY · ROUND 02</p><h1>Practice, at a glance.</h1><p>Practice rack, refined. Four new ways to keep the whole practice session in view.</p></div><span className="study-badge">Standalone mockup<br /><b>1 favorite · 4 new ideas</b></span></header>
    <section className="lab-controls" aria-label="Compare status designs">
      <fieldset><legend>Active tools</legend><div className="control-group">{TYPES.map(type => <button key={type} aria-pressed={enabled[type]} onClick={() => setEnabled(values => ({ ...values, [type]: !values[type] }))}><Icon type={type} />{NAMES[type]}</button>)}</div></fieldset>
      <label className="select-label">Gap pattern<select value={pattern} onChange={event => setPattern(event.target.value)}><option value="silence">Silence</option><option value="offbeat">Offbeat &</option><option value="triplet-third">Third triplet</option></select></label>
      <fieldset><legend>Moment</legend><div className="control-group"><button aria-pressed={!inGap && !paused} onClick={() => { setPaused(false); setTick(0); setRunning(false) }}>Click bars</button><button aria-pressed={inGap && !paused} onClick={() => { setPaused(false); setTick(8); setRunning(false) }}>Gap bars</button><button aria-pressed={paused} onClick={() => { setPaused(!paused); setRunning(false) }}>Paused</button></div></fieldset>
      <div className="preview-controls"><button className="play-preview" disabled={paused} onClick={() => setRunning(!running)}>{running ? <Pause weight="fill" /> : <Play weight="fill" />}{running ? 'Freeze' : 'Animate'}</button><button disabled={paused} onClick={() => { setRunning(false); setTick(value => (Math.floor(value / 4) * 4 + 4) % 80) }}><SkipForward />Next bar</button><small>Silent visual preview</small></div>
    </section>
    <div className="comparison-heading"><span>Your favorite, alongside four new directions. <small>Tap any status to inspect its details.</small></span><label>View<select value={focus} onChange={event => setFocus(event.target.value)}><option value="all">All five</option>{DESIGNS.map(design => <option key={design.id} value={design.id}>{design.number} · {design.name}</option>)}</select></label></div>
    <div className={`design-grid ${focus !== 'all' ? 'focused' : ''}`}>
      {DESIGNS.filter(design => focus === 'all' || focus === design.id).map(design => <article className={`design ${design.selected ? 'is-selected' : ''}`} key={design.id}><header className="design-heading"><span>{design.number}</span><div><h2>{design.name}</h2><p>{design.tag}</p></div></header><Phone design={design} state={state} running={running} onRun={() => { if (!paused) setRunning(!running) }} /><div className="design-notes"><span className="audience">{design.audience}</span><p>{design.idea}</p><small>{design.tradeoff}</small></div></article>)}
    </div>
    <aside className="design-take"><span>THE REFERENCE</span><p><b>05 · Practice rack stays.</b> The refinement keeps the original row structure and makes every count read “Bar 1/2” or “Bar 3/4.” Compare it with Signal lines for a lighter treatment, or Change ledger if seeing the next change matters most.</p></aside>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
