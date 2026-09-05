import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import TrainerIcon from '../../src/components/training/TrainerIcon.jsx'
import TrainerToggle from '../../src/components/training/TrainerToggle.jsx'
import './styles.css'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// Inline cylinder: no overlay, shared touch, mouse and keyboard behavior.
function NumberWheel({ label, value, onChange, min = 1, max = 16, disabled = false, compact = false }) {
  const element = useRef(null)
  const drag = useRef(null)
  const stopScroll = useRef(() => {})
  const current = useRef(null)
  current.current = { value, onChange, min, max, disabled }
  const [offset, setOffset] = useState(0)
  const [moving, setMoving] = useState(false)
  useEffect(() => {
    const node = element.current
    let position = null
    let settleTimer
    function settle() {
      clearTimeout(settleTimer)
      position = null
      setOffset(0)
      setMoving(false)
    }
    stopScroll.current = settle
    function scroll(event) {
      const state = current.current
      // Leave page scrolling alone until this specific wheel is engaged.
      if (state.disabled || document.activeElement !== node || event.ctrlKey) return
      event.preventDefault()
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
      position = clamp((position ?? state.value) + pixels / 30, state.min, state.max)
      const next = Math.round(position)
      state.onChange(next)
      setMoving(true)
      setOffset(next - position)
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, 120)
    }
    node.addEventListener('wheel', scroll, { passive: false })
    node.addEventListener('blur', settle)
    return () => { clearTimeout(settleTimer); node.removeEventListener('wheel', scroll); node.removeEventListener('blur', settle) }
  }, [])
  function release() { drag.current = null; stopScroll.current() }
  return <div ref={element} role="spinbutton" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
    data-long-range={max >= 100 ? 'true' : undefined}
    aria-disabled={disabled} aria-describedby="wheel-help" tabIndex={disabled ? -1 : 0}
    className={`number-wheel ${compact ? 'compact-wheel' : ''} ${moving ? 'is-moving' : ''}`}
    onBlur={release}
    onKeyDown={event => {
      if (disabled) return
      const steps = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
      if (event.key in steps || event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        stopScroll.current()
        onChange(event.key === 'Home' ? min : event.key === 'End' ? max : clamp(value + steps[event.key], min, max))
      }
      if (event.key === 'Escape') event.currentTarget.blur()
    }}
    onPointerDown={event => {
      if (disabled || event.button !== 0) return
      stopScroll.current()
      event.currentTarget.focus({ preventScroll: true })
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { x: event.clientX, position: value }
      setMoving(true)
    }}
    onPointerMove={event => {
      if (!drag.current) return
      const position = clamp(drag.current.position + (drag.current.x - event.clientX) / 18, min, max)
      drag.current = { x: event.clientX, position }
      const next = Math.round(position)
      onChange(next)
      setOffset(next - position)
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
    <span className="wheel-window" aria-hidden="true">
      <span className="wheel-texture">
        {Array.from({ length: 29 }, (_, i) => i - 14).map(rib => {
          const angle = rib * 7 + offset * 42
          return <i key={rib} className="wheel-rib" style={{
            transform: `translateZ(calc(-1 * var(--wheel-radius))) rotateY(${angle}deg) translateZ(var(--wheel-radius))`,
            // Fade the leaves, not their preserve-3d parent: parent opacity
            // would flatten the cylinder until the enable fade reaches 1.
            opacity: Math.max(0, Math.cos(angle * Math.PI / 180)) * (disabled ? 0.25 : 1),
          }} />
        })}
      </span>
      {[-2, -1, 0, 1, 2].map(distance => <span className={`wheel-digit ${distance === 0 ? 'current' : ''}`} key={value + distance}
        style={{
          transform: `translateZ(calc(-1 * var(--wheel-radius))) rotateY(${(distance + offset) * 42}deg) translateZ(var(--wheel-radius))`,
          opacity: clamp((Math.cos((distance + offset) * 42 * Math.PI / 180) - 0.15) / 0.85, 0, 1),
        }}>
        {value + distance >= min && value + distance <= max ? value + distance : ''}
      </span>)}
    </span>
    <span className="wheel-surface" aria-hidden="true" />
    <span className="wheel-index" aria-hidden="true" />
  </div>
}

function App() {
  const [enabled, setEnabled] = useState({ gap: true, tempo: true, subdivision: true })
  const [gap, setGap] = useState({ click: 2, silent: 1 })
  const [tempo, setTempo] = useState({ start: 80, target: 140, step: 5, bars: 4 })
  const [stages, setStages] = useState([{ clicks: 1, bars: 2 }, { clicks: 2, bars: 2 }, { clicks: 4, bars: 2 }])
  function metric(type, key, label, min, max) {
    const data = type === 'gap' ? gap : tempo
    const set = type === 'gap' ? setGap : setTempo
    return <div className="metric"><span>{label}</span><NumberWheel label={label} value={data[key]} min={min} max={max}
      disabled={!enabled[type]} onChange={value => set(old => ({ ...old, [key]: value }))} /></div>
  }
  function stageValue(index, field, value) { setStages(old => old.map((stage, i) => i === index ? { ...stage, [field]: value } : stage)) }
  function card(type, title, metrics, content) {
    return <article className={`pulse-trainer-card ${enabled[type] ? 'is-enabled' : ''}`}>
      <header className="card-header" id={!content ? `${type}-controls` : undefined}>
        <div className="hoop"><TrainerIcon type={type} /></div>
        <div className="card-copy"><h2>{title}</h2><div className="metrics">{metrics}</div></div>
      </header>
      <TrainerToggle enabled={enabled[type]} label={`Enable ${title}`} controlsId={`${type}-controls`} onToggle={() => setEnabled(old => ({ ...old, [type]: !old[type] }))} />
      {content && <div className="reveal" id={`${type}-controls`} aria-hidden={!enabled[type]} inert={!enabled[type] ? true : undefined}><div><div className="card-controls">{content}</div></div></div>}
    </article>
  }
  return <main className="lab">
    <header className="lab-heading"><span>Interaction study</span><h1>A little turn. Right here.</h1><p id="wheel-help">Swipe a number left or right. On desktop, click to engage, then scroll.</p></header>
    <section className="phone" aria-label="Inline trainer wheels prototype">
      <div className="brand"><img src="../../logo.png" alt="Drums Only" /><span>Training</span></div>
      <div className="pulse-training-stack">
        {card('gap', 'Gap Trainer', <>
          {metric('gap', 'click', 'Click bars', 1, 16)}
          {metric('gap', 'silent', 'Silent bars', 1, 16)}
        </>)}
        {card('tempo', 'Tempo Trainer', <>
          {metric('tempo', 'start', 'Start BPM', 20, 300)}
          {metric('tempo', 'target', 'Target BPM', 20, 300)}
        </>, <div className="tempo-extras">
          <div className="inline-setting"><span>Increase by</span><NumberWheel compact disabled={!enabled.tempo} label="BPM increase" value={tempo.step} max={20} onChange={step => setTempo(old => ({ ...old, step }))} /><span>BPM</span></div>
          <div className="inline-setting"><span>Every</span><NumberWheel compact disabled={!enabled.tempo} label="Bars between increases" value={tempo.bars} max={32} onChange={bars => setTempo(old => ({ ...old, bars }))} /><span>bars</span></div>
        </div>)}
        {card('subdivision', 'Subdivision Trainer', <p className="stage-summary">{stages.length} stages · {stages.reduce((sum, stage) => sum + stage.bars, 0)} bars</p>, <>
          <div className="stage-labels"><span>Stage</span><span>Clicks / beat</span><span>Bars</span><span /></div>
          <div className="stages">{stages.map((stage, i) => <div className="stage" key={i}>
            <span className="stage-number">{i + 1}</span>
            <NumberWheel compact disabled={!enabled.subdivision} label={`Stage ${i + 1} clicks per beat`} value={stage.clicks} max={13} onChange={value => stageValue(i, 'clicks', value)} />
            <NumberWheel compact disabled={!enabled.subdivision} label={`Stage ${i + 1} bars`} value={stage.bars} onChange={value => stageValue(i, 'bars', value)} />
            {i > 1 ? <button className="remove-stage" aria-label={`Remove stage ${i + 1}`} onClick={() => setStages(old => old.filter((_, index) => index !== i))}>×</button> : <span />}
          </div>)}</div>
          {stages.length < 4 && <button className="add-stage" onClick={() => setStages(old => [...old, { clicks: 4, bars: 2 }])}>+ Add stage</button>}
        </>)}
      </div>
      <p className="prototype-note">Prototype only · Your saved settings are untouched</p>
    </section>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
