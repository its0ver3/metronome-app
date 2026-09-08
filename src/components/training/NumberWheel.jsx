import { memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { clampWheelValue, createWheelMotion, parseWheelEntry } from './numberWheelMotion'
import './numberWheel.css'

const RIBS = Array.from({ length: 29 }, (_, index) => index - 14)
const NEIGHBOURS = [-2, -1, 0, 1, 2]

// Playback/status renders elsewhere do not rebuild this texture.
const CylinderFace = memo(function CylinderFace({ value, offset, min, max, disabled }) {
  return <>
    <span className="wheel-window" aria-hidden="true">
      <span className="wheel-texture">
        {RIBS.map(rib => {
          const angle = rib * 7 + offset * 42
          return <i key={rib} className="wheel-rib" style={{
            transform: `translateZ(calc(-1 * var(--wheel-radius))) rotateY(${angle}deg) translateZ(var(--wheel-radius))`,
            // Change the disabled appearance once; only rotation animates.
            opacity: Math.max(0, Math.cos(angle * Math.PI / 180)) * (disabled ? 0.25 : 1),
          }} />
        })}
      </span>
      {NEIGHBOURS.map(distance => <span key={value + distance} className={`wheel-digit ${distance === 0 ? 'current' : ''}`} style={{
        transform: `translateZ(calc(-1 * var(--wheel-radius))) rotateY(${(distance + offset) * 42}deg) translateZ(var(--wheel-radius))`,
        opacity: clampWheelValue((Math.cos((distance + offset) * 42 * Math.PI / 180) - 0.15) / 0.85, 0, 1),
      }}>{value + distance >= min && value + distance <= max ? value + distance : ''}</span>)}
    </span>
    <span className="wheel-surface" aria-hidden="true" />
    <span className="wheel-index" aria-hidden="true" />
  </>
})

export default function NumberWheel({ label, value, onChange, min = 1, max = 16, disabled = false, compact = false }) {
  const hintId = useId()
  const element = useRef(null)
  const control = useRef(null)
  const input = useRef(null)
  const restoreEntryFocus = useRef(false)
  const selectEntryOnFocus = useRef(true)
  const pointerId = useRef(null)
  const suppressClick = useRef(false)
  const reducedMotion = useRef(false)
  const entryRef = useRef(null)
  const [entry, setEntry] = useState(null)
  const latest = useRef(null)
  latest.current = { value, onChange, min, max, disabled, get reducedMotion() { return reducedMotion.current } }
  const [view, setView] = useState({ value, offset: 0, moving: false })
  const motion = useRef(null)
  if (!motion.current) motion.current = createWheelMotion({
    read: () => latest.current,
    paint: next => setView(old => old.value === next.value && old.offset === next.offset && old.moving === next.moving ? old : next),
    commit: next => latest.current.onChange(next),
    raf: callback => requestAnimationFrame(callback),
    caf: id => cancelAnimationFrame(id),
    delay: (callback, ms) => setTimeout(callback, ms),
    cancelDelay: id => clearTimeout(id),
  })
  const edit = text => {
    if (latest.current.disabled) return
    const draft = text ?? String(view.value)
    selectEntryOnFocus.current = text === undefined
    motion.current.finish()
    entryRef.current = draft
    setEntry(draft)
  }
  const closeEntry = (apply, restoreFocus = false) => {
    if (entryRef.current === null) return
    const { value, min, max, disabled, onChange } = latest.current
    const next = parseWheelEntry(entryRef.current, min, max)
    entryRef.current = null
    setEntry(null)
    if (apply && !disabled && next !== null && next !== value) onChange(next)
    restoreEntryFocus.current = restoreFocus
  }
  useLayoutEffect(() => {
    if (motion.current.sync()) {
      pointerId.current = null
      entryRef.current = null
      setEntry(null)
    }
  }, [value, min, max, disabled])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = preference.matches
      if (preference.matches) motion.current.finish()
    }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    if (entry === null && restoreEntryFocus.current) {
      restoreEntryFocus.current = false
      control.current?.focus({ preventScroll: true })
    }
    if (entry !== null && document.activeElement !== input.current) {
      input.current?.focus({ preventScroll: true })
      if (selectEntryOnFocus.current) input.current?.select()
      else input.current?.setSelectionRange(entry.length, entry.length)
    }
  }, [entry])
  useEffect(() => {
    const node = element.current
    const controller = motion.current
    const wheel = event => {
      if (latest.current.disabled || entryRef.current !== null || event.ctrlKey) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!delta) return
      event.preventDefault()
      control.current?.focus({ preventScroll: true })
      controller.scroll(delta, event.deltaMode)
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => { node.removeEventListener('wheel', wheel); controller.dispose() }
  }, [])
  const releasePointer = (event, cancel = false) => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = null
    if (cancel) motion.current.finish()
    else if (motion.current.end(event.clientX, event.clientY)) edit()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <>
    <div ref={element} className={`number-wheel ${compact ? 'compact-wheel' : ''} ${view.moving ? 'is-moving' : ''} ${entry !== null ? 'is-editing' : ''}`}
      role="group" aria-label={label} aria-disabled={disabled}
      data-long-range={max >= 100 ? 'true' : undefined}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          motion.current.finish()
          closeEntry(true)
        }
      }}>
      <CylinderFace value={view.value} offset={view.offset} min={min} max={max} disabled={disabled} />
      <div ref={control} className="wheel-drag-area" role="spinbutton" aria-label={label}
        aria-valuenow={view.value} aria-valuemin={min} aria-valuemax={max}
        aria-disabled={disabled} aria-describedby={hintId} tabIndex={disabled || entry !== null ? -1 : 0}
        title="Drag left or right. Release to roll; grab to stop. Tap the number to type."
        onKeyDown={event => {
          if (motion.current.key(event.key)) event.preventDefault()
          if (event.key === 'Enter' || event.key === ' ' || /^\d$/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault()
            edit(/^\d$/.test(event.key) ? event.key : undefined)
          }
          if (event.key === 'Escape') { motion.current.finish(); event.currentTarget.blur() }
        }}
        onClick={event => {
          if (!suppressClick.current && event.detail === 0) edit()
          suppressClick.current = false
        }}
        onPointerDown={event => {
          if (disabled || event.button !== 0 || pointerId.current !== null) return
          event.preventDefault()
          suppressClick.current = true
          event.currentTarget.focus({ preventScroll: true })
          pointerId.current = event.pointerId
          event.currentTarget.setPointerCapture(event.pointerId)
          motion.current.begin(event.clientX, event.clientY)
        }}
        onPointerMove={event => {
          if (pointerId.current === event.pointerId) motion.current.move(event.clientX, event.clientY)
        }}
        onPointerUp={event => releasePointer(event)}
        onPointerCancel={event => releasePointer(event, true)}
        onLostPointerCapture={event => {
          if (pointerId.current === event.pointerId) {
            pointerId.current = null
            motion.current.finish()
          }
        }} />
      {[-1, 1].map(step => <button key={step} type="button"
        className={`wheel-step ${step < 0 ? 'wheel-step-minus' : 'wheel-step-plus'}`}
        aria-label={`${step < 0 ? 'Decrease' : 'Increase'} ${label}`} title={`${step < 0 ? 'Decrease' : 'Increase'} ${label}`}
        disabled={disabled || (entry === null && (step < 0 ? view.value <= min : view.value >= max))}
        onClick={() => {
          if (entryRef.current !== null) {
            const current = latest.current
            const base = parseWheelEntry(entryRef.current, current.min, current.max) ?? current.value
            closeEntry(false)
            motion.current.reset()
            const next = clampWheelValue(base + step, current.min, current.max)
            if (next !== current.value) current.onChange(next)
          } else motion.current.key(step < 0 ? 'ArrowDown' : 'ArrowUp')
        }}>
        <span aria-hidden="true">{step < 0 ? '−' : '+'}</span>
      </button>)}
      {entry !== null && <input ref={input} className="wheel-entry" type="text" inputMode="numeric" pattern="[0-9]*"
        aria-label={`Enter ${label}`} aria-describedby={hintId} value={entry} maxLength={9}
        onChange={event => { entryRef.current = event.target.value; setEntry(event.target.value) }}
        onBlur={() => closeEntry(true)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            closeEntry(event.key === 'Enter', true)
          }
        }} />}
    </div>
    <span className="pulse-wheel-help" id={hintId}>Drag left or right, then release to roll. Grab the wheel to stop it. Scroll or use arrow keys. Tap the number or press Enter to type. Use minus or plus for one step. Enter saves; Escape cancels. Values range from {min} to {max}.</span>
  </>
}
