import { useState, useRef } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'

export default function BpmDisplay({ bpm, onBpmChange, disabled }) {
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

  return (
    <div className="text-center" onClick={!editing ? handleClick : undefined}>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          defaultValue={bpm}
          min={MIN_BPM}
          max={MAX_BPM}
          className="w-40 text-center font-heading text-7xl bg-transparent border-b-2 border-primary text-dark outline-none"
          onBlur={handleSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      ) : (
        <span className={`font-heading text-7xl select-none ${disabled ? 'text-dark/40' : 'text-dark cursor-pointer'}`}>
          {bpm}
        </span>
      )}
      <p className="text-sm text-dark/50 mt-1 font-body">
        {disabled ? 'Tempo trainer active' : 'BPM'}
      </p>
    </div>
  )
}
