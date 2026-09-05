import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { HandTapIcon } from '@phosphor-icons/react/dist/csr/HandTap'
import {
  registerTempoTap,
  TAP_TEMPO_IDLE_RESET_MS,
  TAP_TEMPO_MIN_TAPS,
} from './tapTempo'

const TapTempoButton = forwardRef(function TapTempoButton({
  onBpmChange,
  onTapFeedback,
  disabled = false,
  className = '',
}, ref) {
  const tapsRef = useRef([])
  const resetTimerRef = useRef(null)
  const flashTimerRef = useRef(null)
  const [flash, setFlash] = useState(false)
  const [tapStage, setTapStage] = useState(0)
  const [pulseId, setPulseId] = useState(0)

  useEffect(() => {
    if (disabled) {
      tapsRef.current = []
      clearTimeout(resetTimerRef.current)
      clearTimeout(flashTimerRef.current)
      setFlash(false)
      setTapStage(0)
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
      setTapStage(0)
    }, TAP_TEMPO_IDLE_RESET_MS)

    const result = registerTempoTap(tapsRef.current, now)
    tapsRef.current = result.taps
    const nextStage = Math.min(result.taps.length, TAP_TEMPO_MIN_TAPS)
    setTapStage(nextStage)
    setPulseId((current) => current + 1)
    onTapFeedback?.(nextStage)

    if (result.bpm !== null) {
      onBpmChange?.(result.bpm)
    }
  }

  useImperativeHandle(ref, () => ({
    click: handleTap,
  }))

  const accessibleLabel = tapStage === 0
    ? 'Tap tempo'
    : tapStage < TAP_TEMPO_MIN_TAPS
      ? `Tap tempo, ${tapStage} of ${TAP_TEMPO_MIN_TAPS} taps registered`
      : 'Tap tempo, tempo set; keep tapping to refine'

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={disabled}
      aria-label={accessibleLabel}
      aria-keyshortcuts="T"
      data-tap-stage={tapStage}
      style={{ '--tap-reset-duration': `${TAP_TEMPO_IDLE_RESET_MS}ms` }}
      title={disabled ? 'Tempo is controlled by Tempo Trainer' : 'Tap four times to set tempo (T)'}
      className={`${className} ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : flash
            ? 'is-flashing'
            : ''
      }`}
    >
      <span className="pulse-tap-charge" aria-hidden="true">
        {tapStage > 0 && (
          <>
            <span key={`fill-${pulseId}`} className="pulse-tap-fill" />
            <span key={`wave-${pulseId}`} className="pulse-tap-wave" />
          </>
        )}
      </span>
      <span className="pulse-tap-glyph" aria-hidden="true">
        <HandTapIcon className="pulse-tap-hand" size={34} weight="regular" />
      </span>
    </button>
  )
})

export default TapTempoButton
