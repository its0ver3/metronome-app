export function nextFlashPulse(previous, event) {
  if (event.visualPulse === false) return previous
  const downbeat = Boolean(event.downbeat && event.rhythm !== 2)
  // Both poly voices can arrive at the same audio timestamp. Keep one flash,
  // with the primary downbeat taking priority regardless of callback order.
  if (Number.isFinite(event.time) && previous?.time === event.time) {
    if (previous.downbeat || !downbeat) return previous
  }
  return { sequence: (previous?.sequence ?? 0) + 1, time: event.time, downbeat }
}

export function getFlashAnimation(pulse, includeSubdivisions) {
  if (!pulse || (!pulse.downbeat && !includeSubdivisions)) return null
  return { opacity: pulse.downbeat ? 0.24 : 0.08, duration: pulse.downbeat ? 150 : 80 }
}
