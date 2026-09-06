import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SubdivisionNotation from './SubdivisionNotation.jsx'
import { getSubdivisionLabel } from './subdivisionMusic.js'
import { SUBDIVISION_OPTIONS } from '../../audio/constants'

export default function SubdivisionDropdown({ value, onChange, disabled = false, label = 'Subdivision', denominator = 4, allowGroupOnly = false, options, renderNotation, getOptionLabel, className = '', menuClassName = '', menuWidth = 200 }) {
  const choices = options || (allowGroupOnly ? [{ type: 0 }, ...SUBDIVISION_OPTIONS] : SUBDIVISION_OPTIONS)
  const optionLabel = type => getOptionLabel ? getOptionLabel(type) : getSubdivisionLabel(type, denominator)
  const notation = type => renderNotation ? renderNotation(type) : <SubdivisionNotation count={type} denominator={denominator} />
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const trigger = useRef(null)
  const menu = useRef(null)
  const id = useId()
  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus({ preventScroll: true })
  }
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])
  useLayoutEffect(() => {
    if (!open || disabled) return
    const rect = trigger.current.getBoundingClientRect()
    const viewport = window.visualViewport
    const leftEdge = (viewport?.offsetLeft || 0) + 8
    const topEdge = (viewport?.offsetTop || 0) + 8
    const rightEdge = leftEdge + (viewport?.width || window.innerWidth) - 16
    const bottomEdge = topEdge + (viewport?.height || window.innerHeight) - 16
    const width = Math.min(menuWidth, rightEdge - leftEdge)
    const below = bottomEdge - rect.bottom - 6
    const above = rect.top - topEdge - 6
    const height = Math.min(232, Math.max(below, above))
    const styles = getComputedStyle(trigger.current)
    setPosition({ left: Math.max(leftEdge, Math.min(rect.left, rightEdge - width)), top: below >= height ? rect.bottom + 6 : Math.max(topEdge, rect.top - height - 6), width, maxHeight: height,
      '--notation-accent': styles.getPropertyValue('--trainer-accent').trim() || styles.getPropertyValue('--tempo-heat-color').trim() || '#98aaa6',
      '--brand-color-ink': styles.getPropertyValue('--brand-color-ink').trim() || '#e5e3dc' })
    const outside = event => {
      if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false)
    }
    const scroll = event => { if (!menu.current?.contains(event.target)) setOpen(false) }
    const resize = () => setOpen(false)
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside)
    document.addEventListener('scroll', scroll, true)
    window.addEventListener('resize', resize)
    viewport?.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('scroll', scroll, true)
      window.removeEventListener('resize', resize)
      viewport?.removeEventListener('resize', resize)
    }
  }, [open, disabled, menuWidth])
  useLayoutEffect(() => {
    if (!open || !position) return
    const selected = menu.current?.querySelector('[aria-selected="true"]')
    selected?.focus({ preventScroll: true })
    if (selected) menu.current.scrollTop = selected.offsetTop - (menu.current.clientHeight - selected.offsetHeight) / 2
  }, [open, position])
  const keys = event => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
    } else if (event.key === 'Tab') {
      close(true)
    } else if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const options = [...menu.current.querySelectorAll('[role="option"]')]
      const index = options.indexOf(document.activeElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
      const option = options[next]
      option.focus({ preventScroll: true })
      if (option.offsetTop < menu.current.scrollTop) menu.current.scrollTop = option.offsetTop
      else if (option.offsetTop + option.offsetHeight > menu.current.scrollTop + menu.current.clientHeight) menu.current.scrollTop = option.offsetTop + option.offsetHeight - menu.current.clientHeight
    }
  }
  return <>
    <button ref={trigger} type="button" className={`pulse-subdivision-dropdown ${className}`} disabled={disabled} aria-label={`${label}: ${optionLabel(value)}`} aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={open && !disabled ? id : undefined}
      onClick={() => setOpen(previous => !previous)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) } }}>
      {notation(value)}<span aria-hidden="true">⌄</span>
    </button>
    {open && !disabled && position && createPortal(<div ref={menu} id={id} role="listbox" aria-label={label} className={`pulse-subdivision-menu ${menuClassName}`} style={position} onKeyDown={keys}>
      {choices.map(({ type, description }) => <button key={type} type="button" role="option" tabIndex={-1} aria-selected={value === type} aria-label={optionLabel(type)} title={description || optionLabel(type)} onClick={() => { onChange(type); close(true) }}>
        {type === 0 ? <span className="pulse-group-pulse-option">Group pulses</span> : notation(type)}{options && <span className="pulse-pattern-option-label">{optionLabel(type)}</span>}<span aria-hidden="true">{value === type ? '✓' : ''}</span>
      </button>)}
    </div>, document.body)}
  </>
}
