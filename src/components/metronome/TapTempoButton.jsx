import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { registerTempoTap, TAP_TEMPO_IDLE_RESET_MS } from './tapTempo'

const TapTempoButton = forwardRef(function TapTempoButton({ onBpmChange, disabled = false, className = '' }, ref) {
  const tapsRef = useRef([])
  const resetTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (disabled) {
      tapsRef.current = []
      clearTimeout(resetTimerRef.current)
      clearTimeout(flashTimerRef.current)
      setFlash(false)
    }
  }, [disabled])

  useEffect(() => () => {
    clearTimeout(resetTimerRef.current)
    clearTimeout(flashTimerRef.current)
  }, [])

  const handleTap = () => {
    if (disabled) return

    const now = performance.now()

    setFlash(true)
    clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(false), 100)

    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      tapsRef.current = []
    }, TAP_TEMPO_IDLE_RESET_MS)

    const result = registerTempoTap(tapsRef.current, now)
    tapsRef.current = result.taps

    if (result.bpm !== null) {
      onBpmChange?.(result.bpm)
    }
  }

  useImperativeHandle(ref, () => ({
    click: handleTap,
  }))

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={disabled}
      aria-label="Tap tempo"
      aria-keyshortcuts="T"
      title={disabled ? 'Tempo is controlled by Tempo Trainer' : 'Tap four times to set tempo (T)'}
      className={`${className} ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : flash
            ? 'is-flashing'
            : ''
      }`}
    >
      <span className="pulse-tap-glyph" aria-hidden="true">
        <span className="pulse-tap-ripple pulse-tap-ripple-one" />
        <span className="pulse-tap-ripple pulse-tap-ripple-two" />
        <span className="pulse-tap-stick" />
        <span className="pulse-tap-pad" />
      </span>
    </button>
  )
})

export default TapTempoButton
