import { memo, useEffect, useId, useRef, useState } from 'react'
import { clampWheelValue, createWheelMotion } from './numberWheelMotion'
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
  const latest = useRef(null)
  latest.current = { value, onChange, min, max, disabled }
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
  useEffect(() => { motion.current.reset() }, [value, min, max, disabled])
  useEffect(() => {
    const node = element.current
    const controller = motion.current
    const wheel = event => {
      if (latest.current.disabled || document.activeElement !== node || event.ctrlKey) return
      event.preventDefault()
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      controller.scroll(delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1))
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => { node.removeEventListener('wheel', wheel); controller.dispose() }
  }, [])
  return <>
    <div ref={element} className={`number-wheel ${compact ? 'compact-wheel' : ''} ${view.moving ? 'is-moving' : ''}`}
      role="spinbutton" aria-label={label} aria-valuenow={view.value} aria-valuemin={min} aria-valuemax={max}
      aria-disabled={disabled} aria-describedby={hintId} tabIndex={disabled ? -1 : 0}
      data-long-range={max >= 100 ? 'true' : undefined}
      onBlur={() => motion.current.finish()}
      onKeyDown={event => {
        if (motion.current.key(event.key)) event.preventDefault()
        if (event.key === 'Escape') { motion.current.reset(); event.currentTarget.blur() }
      }}
      onPointerDown={event => {
        if (disabled || event.button !== 0) return
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        motion.current.begin(event.clientX)
      }}
      onPointerMove={event => motion.current.move(event.clientX)}
      onPointerUp={() => motion.current.finish()}
      onPointerCancel={() => motion.current.reset()}
      onLostPointerCapture={() => motion.current.finish()}>
      <CylinderFace value={view.value} offset={view.offset} min={min} max={max} disabled={disabled} />
    </div>
    <span className="pulse-wheel-help" id={hintId}>Swipe left or right. Click to use the scroll wheel, or use arrow keys. Release to apply.</span>
  </>
}
