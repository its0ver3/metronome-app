import { useState, useRef } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'

export default function BpmDisplay({ bpm, onBpmChange }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  const handleClick = () => {
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
          className="w-40 text-center font-heading text-8xl bg-transparent border-b-2 border-primary text-dark outline-none"
          onBlur={handleSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      ) : (
        <span className="font-heading text-8xl text-dark cursor-pointer select-none">
          {bpm}
        </span>
      )}
      <p className="text-sm text-dark/50 mt-1 font-body">BPM</p>
    </div>
  )
}
