import { useEffect, useRef } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'
import { getTempoThumbTilt } from './bpmControlMotion.js'

export default function BpmControls({ bpm, onBpmChange, disabled, className = '' }) {
  const inputRef = useRef(null)
  const previousBpmRef = useRef(bpm)
  const settleTimerRef = useRef(null)

  useEffect(() => {
    previousBpmRef.current = bpm
  }, [bpm])

  useEffect(() => () => window.clearTimeout(settleTimerRef.current), [])

  const handleChange = (event) => {
    const nextBpm = Number.parseInt(event.target.value, 10)
    const tilt = getTempoThumbTilt(previousBpmRef.current, nextBpm)

    event.currentTarget.style.setProperty('--tempo-thumb-tilt', `${tilt}deg`)
    previousBpmRef.current = nextBpm
    window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      inputRef.current?.style.setProperty('--tempo-thumb-tilt', '0deg')
    }, 120)

    onBpmChange(nextBpm)
  }

  return (
    <div className={`flex flex-col items-center gap-4 w-full px-6 ${className} ${disabled ? 'opacity-40' : ''}`}>
      <div className="pulse-tempo-slider-track flex items-center w-full">
        <span className="pulse-tempo-slider-rail" aria-hidden="true" />
        <input
          ref={inputRef}
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          value={bpm}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Tempo"
          aria-valuetext={`${bpm} beats per minute`}
          className="flex-1 h-11 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed accent-primary bg-secondary"
        />
      </div>
    </div>
  )
}
