import { useEffect, useRef } from 'react'
import { ARTICULATION_META } from '../../groove/grooveConstants'

export default function GrooveCellPopover({ voice, options, current, onSelect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 bg-muted rounded-md shadow-lg p-1 flex gap-1 border border-dark/10"
    >
      {options.map((sym) => {
        const meta = ARTICULATION_META[sym] || { label: sym }
        const active = sym === current
        return (
          <button
            key={sym}
            role="menuitem"
            onClick={() => onSelect(sym)}
            aria-label={`${voice} ${meta.label}`}
            className={`px-2 py-1 text-xs rounded font-semibold whitespace-nowrap ${
              active ? 'bg-primary text-light' : 'text-dark/80 hover:bg-dark/10'
            }`}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
