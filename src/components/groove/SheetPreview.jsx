import { useEffect, useRef, useState } from 'react'
import { grooveToAbc } from '../../groove/abcGenerator'
import { renderGrooveSvg } from '../../groove/sheetRenderer'

const DEBOUNCE_MS = 150

const ABC_OPTIONS = {
  responsive: 'resize',
  staffwidth: 520,
  paddingtop: 4,
  paddingbottom: 4,
  paddingleft: 0,
  paddingright: 0,
  scale: 1,
  foregroundColor: '#F5F0E8',
  selectionColor: '#F5F0E8',
}

// Lazily loaded abcjs module (kept out of the main bundle).
let abcjsPromise = null
function loadAbcjs() {
  if (!abcjsPromise) {
    abcjsPromise = import('abcjs').then((m) => m.default || m)
  }
  return abcjsPromise
}

export default function SheetPreview({ pattern, bpm }) {
  const containerRef = useRef(null)
  const fallbackRef = useRef(null)
  const [abcjsReady, setAbcjsReady] = useState(false)
  const abcjsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadAbcjs()
      .then((mod) => {
        if (cancelled) return
        abcjsRef.current = mod
        setAbcjsReady(true)
      })
      .catch(() => {
        // Leave abcjs unavailable; fallback renderer will be used
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = containerRef.current
      const fallback = fallbackRef.current
      if (!container) return
      const abcjs = abcjsRef.current
      if (abcjs && abcjsReady) {
        try {
          const abc = grooveToAbc(pattern, { tempo: bpm })
          abcjs.renderAbc(container, abc, ABC_OPTIONS)
          container.querySelectorAll('path, rect, line, text, circle, ellipse').forEach((el) => {
            if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') {
              el.setAttribute('fill', 'currentColor')
            }
            if (el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
              el.setAttribute('stroke', 'currentColor')
            }
          })
          if (fallback) fallback.innerHTML = ''
          return
        } catch {
          // fall through to minimal renderer
        }
      }
      container.innerHTML = ''
      if (fallback) fallback.innerHTML = renderGrooveSvg(pattern)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [pattern, bpm, abcjsReady])

  return (
    <div className="border-t border-muted pt-3">
      <div className="text-xs text-dark/60 font-semibold uppercase tracking-wide mb-2">
        Notation
      </div>
      <div className="bg-muted/20 rounded-md px-2 py-3 overflow-x-auto text-dark">
        <div ref={containerRef} />
        <div ref={fallbackRef} />
      </div>
    </div>
  )
}
