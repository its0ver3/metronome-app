import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

const MIN_TAPS = 4
const MAX_TAPS = 5

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
    }, 3000)

    tapsRef.current.push(now)

    if (tapsRef.current.length > MAX_TAPS) {
      tapsRef.current = tapsRef.current.slice(-MAX_TAPS)
    }

    if (tapsRef.current.length >= MIN_TAPS) {
      const taps = tapsRef.current
      let totalInterval = 0
      for (let i = 1; i < taps.length; i++) {
        totalInterval += taps[i] - taps[i - 1]
      }
      const avgInterval = totalInterval / (taps.length - 1)
      const detectedBpm = Math.round(60000 / avgInterval)
      onBpmChange?.(detectedBpm)
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
      className={`h-11 rounded-full border-2 border-primary px-5 text-primary font-semibold text-sm transition-all ${className} ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : flash
            ? 'bg-primary text-light scale-95'
            : 'bg-transparent active:bg-primary/10'
      }`}
    >
      TAP
    </button>
  )
})

export default TapTempoButton
