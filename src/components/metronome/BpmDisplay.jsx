import { useState, useRef } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'
import { TEMPO_UNITS } from '../../audio/meter.js'

export default function BpmDisplay({ bpm, onBpmChange, disabled, tempoUnit }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  const handleClick = () => {
    if (disabled) return
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleSubmit = () => {
    const val = parseInt(inputRef.current?.value)
    if (!isNaN(val)) onBpmChange(val)
    setEditing(false)
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    } else if (event.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <div className="text-center">
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          defaultValue={bpm}
          min={MIN_BPM}
          max={MAX_BPM}
          aria-label="Tempo in beats per minute"
          className="w-40 text-center font-heading text-7xl bg-transparent border-b-2 border-primary text-dark outline-none"
          onBlur={handleSubmit}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label={disabled ? `${bpm} BPM. Tempo is controlled by Tempo Trainer.` : `Edit tempo, currently ${bpm} BPM`}
          className={`min-w-40 min-h-11 font-heading text-7xl select-none bg-transparent ${disabled ? 'text-dark/40 cursor-not-allowed' : 'text-dark cursor-pointer'}`}
        >
          {bpm}
        </button>
      )}
      <p className="text-sm text-dark/50 mt-1 font-body">
        {tempoUnit && <span className="pulse-meter-unit-mark" aria-label={TEMPO_UNITS[tempoUnit].name}>{TEMPO_UNITS[tempoUnit].symbol}</span>}{disabled ? 'Tempo trainer active' : 'BPM'}
      </p>
    </div>
  )
}
