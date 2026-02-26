import { useRef, useState, forwardRef, useImperativeHandle } from 'react'

const TapTempoButton = forwardRef(function TapTempoButton({ onBpmChange }, ref) {
  const tapsRef = useRef([])
  const resetTimerRef = useRef(null)
  const [flash, setFlash] = useState(false)

  const handleTap = () => {
    const now = performance.now()

    setFlash(true)
    setTimeout(() => setFlash(false), 100)

    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      tapsRef.current = []
    }, 3000)

    tapsRef.current.push(now)

    if (tapsRef.current.length > 5) {
      tapsRef.current = tapsRef.current.slice(-5)
    }

    if (tapsRef.current.length >= 2) {
      const taps = tapsRef.current
      let totalInterval = 0
      for (let i = 1; i < taps.length; i++) {
        totalInterval += taps[i] - taps[i - 1]
      }
      const avgInterval = totalInterval / (taps.length - 1)
      const detectedBpm = Math.round(60000 / avgInterval)
      onBpmChange(detectedBpm)
    }
  }

  useImperativeHandle(ref, () => ({
    click: handleTap,
  }))

  return (
    <button
      onClick={handleTap}
      className={`px-6 h-12 rounded-full border-2 border-primary text-primary font-semibold text-sm transition-all ${
        flash ? 'bg-primary text-light scale-95' : 'bg-transparent active:bg-primary/10'
      }`}
    >
      TAP
    </button>
  )
})

export default TapTempoButton
