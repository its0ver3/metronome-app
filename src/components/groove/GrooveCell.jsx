import { useRef, useState } from 'react'
import { SYMBOLS, ARTICULATION_META } from '../../groove/grooveConstants'
import GrooveCellPopover from './GrooveCellPopover'

const LONG_PRESS_MS = 400

function glyph(voice, symbol) {
  if (symbol === '-') return null
  // Use simple visual glyphs — the sheet music preview carries the notation.
  if (symbol === 'g') {
    // Ghost: small parenthesised dot
    return <span className="text-[0.7rem] leading-none opacity-60">(●)</span>
  }
  if (voice === 'hh' && symbol === 'o') {
    return <span className="text-base leading-none">◯</span>
  }
  const isAccent = symbol === 'X' || symbol === 'O'
  return (
    <span
      className={`inline-block rounded-full ${isAccent ? 'w-3 h-3 ring-2 ring-primary' : 'w-2.5 h-2.5'} bg-primary`}
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

  const baseBg = active ? 'bg-primary/25' : oddBeat ? 'bg-muted/30' : 'bg-muted/10'
  const borderLeft = beatGroupStart ? 'border-l-2 border-primary/50' : 'border-l border-muted/30'

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
        className={`w-8 h-8 flex items-center justify-center ${baseBg} ${borderLeft} ${
          active ? 'outline outline-primary' : ''
        } transition-colors`}
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
