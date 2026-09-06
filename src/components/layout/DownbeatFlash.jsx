import { useEffect, useRef } from 'react'
import { getFlashAnimation } from './flashPulse'
import './downbeatFlash.css'

export default function DownbeatFlash({ enabled, includeSubdivisions, isPlaying, pulse }) {
  const overlayRef = useRef(null)
  const previousSequence = useRef(pulse?.sequence)
  const animationRef = useRef(null)

  useEffect(() => () => animationRef.current?.cancel(), [enabled, includeSubdivisions, isPlaying])

  useEffect(() => {
    const newPulse = previousSequence.current !== pulse?.sequence
    previousSequence.current = pulse?.sequence
    // Enabling the preference or changing views must not create an extra flash.
    if (!enabled || !isPlaying || !newPulse) return
    const flash = getFlashAnimation(pulse, includeSubdivisions)
    if (!flash) return

    animationRef.current?.cancel()
    animationRef.current = overlayRef.current?.animate(
      [{ opacity: flash.opacity }, { opacity: 0 }],
      { duration: flash.duration, easing: 'ease-out' },
    )
  }, [enabled, includeSubdivisions, isPlaying, pulse])

  // Stay inside the app frame so its bounds and rounded corners clip the flash.
  return (
    <div ref={overlayRef} className="pulse-downbeat-flash" aria-hidden="true" />
  )
}
