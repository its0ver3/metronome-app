import test from 'node:test'
import assert from 'node:assert/strict'
import { createSheetDragHandlers } from '../src/components/metronome/sheetDrag.js'

function setup({ interactive = false, closing = false } = {}) {
  let dismissed = 0
  let captured = false
  const styles = {}
  const sheet = {
    offsetHeight: 500, dataset: {},
    classList: { contains: () => closing },
    style: { setProperty: (key, value) => { styles[key] = value } },
  }
  const surface = {
    setPointerCapture: () => { captured = true },
    hasPointerCapture: () => captured,
    releasePointerCapture: () => { captured = false },
  }
  const handlers = createSheetDragHandlers(() => sheet, () => { dismissed++ })
  const event = (x = 0, y = 0, extra = {}) => ({
    pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y,
    target: { closest: () => interactive }, currentTarget: surface,
    preventDefault() {}, ...extra,
  })
  handlers.onPointerDown(event())
  return { handlers, event, sheet, styles, dismissed: () => dismissed, captured: () => captured }
}

test('sheet tracks a downward drag and dismisses from its current position', () => {
  const s = setup()
  s.handlers.onPointerMove(s.event(2, 90))
  assert.equal(s.sheet.dataset.dragState, 'dragging')
  assert.equal(s.styles['--sheet-drag-y'], '90px')
  s.handlers.onPointerUp(s.event(2, 90))
  assert.equal(s.dismissed(), 1)
  assert.equal(s.captured(), false)
  assert.equal(s.styles['--sheet-drag-y'], '90px', 'closing begins at the drag offset')
  s.handlers.onLostPointerCapture(s.event())
  assert.equal(s.dismissed(), 1)
})

test('short drags and dragging back up settle without dismissing', () => {
  for (const distances of [[20], [110, 15], [90, -10]]) {
    const s = setup()
    for (const dy of distances) s.handlers.onPointerMove(s.event(0, dy))
    s.handlers.onPointerUp(s.event())
    assert.equal(s.dismissed(), 0)
    assert.equal(s.sheet.dataset.dragState, 'settling')
    assert.equal(s.styles['--sheet-drag-y'], '0px')
  }
})

test('cancelled or lost gestures return even after passing the dismissal threshold', () => {
  for (const method of ['onPointerCancel', 'onLostPointerCapture']) {
    const s = setup()
    s.handlers.onPointerMove(s.event(0, 100))
    s.handlers[method](s.event())
    assert.equal(s.dismissed(), 0)
    assert.equal(s.styles['--sheet-drag-y'], '0px')
  }
})

test('taps, upward and sideways gestures do not move or dismiss the sheet', () => {
  for (const [x, y] of [[0, 3], [0, -40], [80, 20]]) {
    const s = setup()
    s.handlers.onPointerMove(s.event(x, y))
    s.handlers.onPointerUp(s.event(x, y))
    assert.equal(s.dismissed(), 0)
    assert.deepEqual(s.styles, {})
  }
})

test('Done and other interactive targets, closing sheets, and unrelated pointers are ignored', () => {
  for (const options of [{ interactive: true }, { closing: true }]) {
    const s = setup(options)
    assert.equal(s.captured(), false)
    s.handlers.onPointerMove(s.event(0, 100))
    s.handlers.onPointerUp(s.event())
    assert.equal(s.dismissed(), 0)
  }
  const s = setup()
  s.handlers.onPointerMove(s.event(0, 100, { pointerId: 2 }))
  s.handlers.onPointerUp(s.event(0, 100, { pointerId: 2 }))
  assert.deepEqual(s.styles, {})
  assert.equal(s.captured(), true)
  s.handlers.onPointerCancel(s.event())
})
