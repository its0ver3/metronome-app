import { useLayoutEffect, useRef } from 'react'
import { MAX_VISUAL_LATENESS_MS } from '../../audio/VisualTimeline'
import { getFlashAnimation } from './flashPulse'
import './downbeatFlash.css'

export default function DownbeatFlash({ enabled, includeSubdivisions, isPlaying, pulse }) {
  const overlayRef = useRef(null)
  const previousSequence = useRef(pulse?.sequence)
  const animationRef = useRef(null)

  useLayoutEffect(() => () => animationRef.current?.cancel(), [enabled, includeSubdivisions, isPlaying])

  useLayoutEffect(() => {
    const newPulse = previousSequence.current !== pulse?.sequence
    previousSequence.current = pulse?.sequence
    // Enabling the preference or changing views must not create an extra flash.
    if (!enabled || !isPlaying || !newPulse) return
    const flash = getFlashAnimation(pulse, includeSubdivisions)
    if (!flash) return

    const age = Number.isFinite(pulse.outputTime) ? Math.max(0, performance.now() - pulse.outputTime) : 0
    if (age > MAX_VISUAL_LATENESS_MS) return

    animationRef.current?.cancel()
    animationRef.current = overlayRef.current?.animate(
      [{ opacity: flash.opacity }, { opacity: 0 }],
      { duration: flash.duration, easing: 'ease-out' },
    )
    // Preserve the audio-clock phase of the release even if this frame is a
    // few milliseconds late. The effect runs before this frame is painted.
    if (animationRef.current) animationRef.current.currentTime = age
  }, [enabled, includeSubdivisions, isPlaying, pulse])

  // Stay inside the app frame so its bounds and rounded corners clip the flash.
  return (
    <div ref={overlayRef} className="pulse-downbeat-flash" aria-hidden="true" />
  )
}
