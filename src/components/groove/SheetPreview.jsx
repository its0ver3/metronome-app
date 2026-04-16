import { useEffect, useRef, useState } from 'react'
import { renderGrooveSvg } from '../../groove/sheetRenderer'

const DEBOUNCE_MS = 150

export default function SheetPreview({ pattern }) {
  const containerRef = useRef(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setSvg(renderGrooveSvg(pattern))
      } catch {
        setSvg('')
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [pattern])

  return (
    <div className="border-t border-muted pt-3">
      <div className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-2">
        Notation
      </div>
      <div
        ref={containerRef}
        className="bg-muted/20 rounded-md px-2 py-3 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
