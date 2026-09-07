export function nextFlashPulse(previous, event) {
  if (event.visualPulse === false || event.visualLate) return previous
  const downbeat = Boolean(event.downbeat && event.rhythm !== 2)
  // Both poly voices can arrive at the same audio timestamp. Keep one flash,
  // with the primary downbeat taking priority regardless of callback order.
  if (Number.isFinite(event.time) && previous?.time === event.time) {
    if (previous.downbeat || !downbeat) return previous
  }
  if (event.presentationFrame !== undefined && previous?.presentationFrame === event.presentationFrame &&
      previous.downbeat && !downbeat) return previous
  return { sequence: (previous?.sequence ?? 0) + 1, time: event.time, downbeat,
    ...(event.outputTime !== undefined ? { outputTime: event.outputTime } : {}),
    ...(event.presentationFrame !== undefined ? { presentationFrame: event.presentationFrame } : {}) }
}

export function getFlashAnimation(pulse, includeSubdivisions) {
  if (!pulse || (!pulse.downbeat && !includeSubdivisions)) return null
  return { opacity: pulse.downbeat ? 0.312 : 0.104, duration: pulse.downbeat ? 150 : 80 }
}
