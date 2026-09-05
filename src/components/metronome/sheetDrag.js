// Pointer events keep the drag consistent for touch, pen, and mouse. Only the
// fixed header owns this gesture; the controls below retain native scrolling.
export function createSheetDragHandlers(getSheet, onDismiss) {
  let gesture = null

  const finish = (event, cancelled = false) => {
    if (!gesture || event.pointerId !== gesture.id) return
    const { surface, sheet, offset, moved } = gesture
    gesture = null
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId)
    if (!moved) return

    const threshold = Math.min(80, sheet.offsetHeight * 0.15)
    if (!cancelled && offset >= threshold) {
      onDismiss()
    } else {
      sheet.dataset.dragState = 'settling'
      sheet.style.setProperty('--sheet-drag-y', '0px')
    }
  }

  return {
    onPointerDown(event) {
      const sheet = getSheet()
      if (!sheet || gesture || !event.isPrimary || event.button !== 0 ||
          sheet.classList.contains('is-closing') ||
          event.target.closest('button, input, select, a, [role="button"]')) return
      gesture = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        surface: event.currentTarget, sheet, offset: 0, moved: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove(event) {
      if (!gesture || event.pointerId !== gesture.id) return
      const dy = event.clientY - gesture.startY
      const dx = event.clientX - gesture.startX
      if (!gesture.moved) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return
        if (dy <= 0 || Math.abs(dx) > dy) {
          finish(event, true)
          return
        }
        gesture.moved = true
      }
      event.preventDefault()
      gesture.offset = Math.max(0, dy)
      gesture.sheet.dataset.dragState = 'dragging'
      gesture.sheet.style.setProperty('--sheet-drag-y', `${gesture.offset}px`)
    },
    onPointerUp: event => finish(event),
    onPointerCancel: event => finish(event, true),
    onLostPointerCapture: event => finish(event, true),
  }
}
