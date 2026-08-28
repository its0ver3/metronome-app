export const TAP_TEMPO_MIN_TAPS = 4
export const TAP_TEMPO_MAX_TAPS = 5
export const TAP_TEMPO_IDLE_RESET_MS = 5000

export function registerTempoTap(previousTaps, now) {
  const taps = Array.isArray(previousTaps) ? previousTaps : []
  const lastTap = taps.at(-1)
  const sessionExpired = lastTap !== undefined && now - lastTap >= TAP_TEMPO_IDLE_RESET_MS
  const nextTaps = [...(sessionExpired ? [] : taps), now].slice(-TAP_TEMPO_MAX_TAPS)

  if (nextTaps.length < TAP_TEMPO_MIN_TAPS) {
    return { taps: nextTaps, bpm: null }
  }

  let totalInterval = 0
  for (let index = 1; index < nextTaps.length; index += 1) {
    totalInterval += nextTaps[index] - nextTaps[index - 1]
  }

  const averageInterval = totalInterval / (nextTaps.length - 1)
  return {
    taps: nextTaps,
    bpm: Math.round(60000 / averageInterval),
  }
}
