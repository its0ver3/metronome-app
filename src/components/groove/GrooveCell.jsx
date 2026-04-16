import { useRef, useState } from 'react'
import { SYMBOLS, ARTICULATION_META } from '../../groove/grooveConstants'
import GrooveCellPopover from './GrooveCellPopover'

const LONG_PRESS_MS = 400

function glyph(voice, symbol) {
  if (symbol === '-') {
    // Empty-cell affordance: faint dot so users see the cell is tappable
    return <span className="w-1 h-1 rounded-full bg-dark/20" />
  }
  if (symbol === 'g') {
    return <span className="text-[0.7rem] leading-none opacity-70">(●)</span>
  }
  if (voice === 'hh' && symbol === 'o') {
    return <span className="text-base leading-none">◯</span>
  }
  const isAccent = symbol === 'X' || symbol === 'O'
  return (
    <span
      className={`inline-block rounded-full ${isAccent ? 'w-3.5 h-3.5 ring-2 ring-primary' : 'w-2.5 h-2.5'} bg-primary`}
    />
  )
}

export default function GrooveCell({
  voice,
  slot,
  symbol,
  beatGroupStart,
  oddBeat,
  active,
  onTap,
  onSet,
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const pressTimer = useRef(null)
  const longPressFired = useRef(false)

  const cycle = SYMBOLS[voice] || ['-']

  const clear = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handlePointerDown = () => {
    longPressFired.current = false
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setPopoverOpen(true)
    }, LONG_PRESS_MS)
  }

  const handlePointerUp = () => {
    clear()
    if (!longPressFired.current && !popoverOpen) {
      onTap(voice, slot)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    setPopoverOpen(true)
  }

  const meta = ARTICULATION_META[symbol] || ARTICULATION_META['-']
  const label = `${voice} slot ${slot} ${meta.label}`

  const filled = symbol !== '-'
  const baseBg = active
    ? 'bg-primary/30'
    : filled
    ? 'bg-muted'
    : oddBeat
    ? 'bg-muted/50'
    : 'bg-muted/25'
  const borderLeft = beatGroupStart
    ? 'border-l-2 border-primary/60'
    : 'border-l border-dark/10'

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={handleContextMenu}
        className={`w-10 h-10 flex items-center justify-center ${baseBg} ${borderLeft} border-b border-dark/10 ${
          active ? 'ring-2 ring-primary' : ''
        } transition-colors cursor-pointer hover:bg-muted/80`}
      >
        {glyph(voice, symbol)}
      </button>
      {popoverOpen && (
        <GrooveCellPopover
          voice={voice}
          options={cycle}
          current={symbol}
          onSelect={(sym) => {
            onSet(voice, slot, sym)
            setPopoverOpen(false)
          }}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  )
}
