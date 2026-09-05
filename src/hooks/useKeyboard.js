import { useEffect } from 'react'

export default function useKeyboard({ onToggle, onBpmUp, onBpmDown, onTap }) {
  useEffect(() => {
    const handler = (e) => {
      // Let focused controls handle their own keyboard interactions. This also
      // avoids firing a global shortcut in addition to a button's native click.
      if (
        e.target?.closest?.(
          'input, textarea, select, button, a, [contenteditable="true"], [role="button"], [role="slider"], [role="spinbutton"], [role="switch"]',
        )
      ) {
        return
      }

      switch (e.code) {
        case 'Space':
          if (typeof onToggle === 'function') {
            e.preventDefault()
            onToggle()
          }
          break
        case 'ArrowUp':
          if (typeof onBpmUp === 'function') {
            e.preventDefault()
            onBpmUp()
          }
          break
        case 'ArrowDown':
          if (typeof onBpmDown === 'function') {
            e.preventDefault()
            onBpmDown()
          }
          break
        case 'KeyT':
          if (typeof onTap === 'function') {
            e.preventDefault()
            onTap()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToggle, onBpmUp, onBpmDown, onTap])
}
