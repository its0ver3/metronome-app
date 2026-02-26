import { useEffect } from 'react'

export default function useKeyboard({ onToggle, onBpmUp, onBpmDown, onTap }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't capture when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onToggle()
          break
        case 'ArrowUp':
          e.preventDefault()
          onBpmUp()
          break
        case 'ArrowDown':
          e.preventDefault()
          onBpmDown()
          break
        case 'KeyT':
          e.preventDefault()
          onTap()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToggle, onBpmUp, onBpmDown, onTap])
}
