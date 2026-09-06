const integer = (value, min, max, fallback) => Number.isFinite(Number(value))
  ? Math.max(min, Math.min(max, Math.round(Number(value)))) : fallback

export function normalizeSessionSettings(value = {}) {
  return {
    countInBars: integer(value?.countInBars, 0, 2, 0),
    mode: ['off', 'minutes', 'bars'].includes(value?.mode) ? value.mode : 'off',
    minutes: integer(value?.minutes, 1, 180, 5),
    bars: integer(value?.bars, 1, 999, 50),
  }
}

export function formatSessionTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds || 0))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
