import { SUBDIVISION_OPTIONS } from '../audio/constants'

export function computeTotalMs(sessions) {
  let total = 0
  for (const s of sessions) {
    if (typeof s.durationMs === 'number' && s.durationMs > 0) total += s.durationMs
  }
  return total
}

export function computeStreak(sessions) {
  if (sessions.length === 0) return 0

  const days = new Set()
  for (const s of sessions) {
    if (typeof s.startedAt !== 'number') continue
    days.add(new Date(s.startedAt).toDateString())
  }
  if (days.size === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let cursor = new Date(today)
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toDateString())) return 0
  }

  let streak = 0
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeFavouriteSubdivision(sessions) {
  const counts = new Map()
  for (const s of sessions) {
    const samples = s.subdivisionSamples || []
    for (const sample of samples) {
      const v = sample.subdivision
      if (typeof v !== 'number') continue
      counts.set(v, (counts.get(v) || 0) + 1)
    }
  }
  if (counts.size === 0) return null

  let best = null
  let bestCount = -1
  for (const [sub, count] of counts) {
    if (count > bestCount) {
      best = sub
      bestCount = count
    }
  }

  const opt = SUBDIVISION_OPTIONS.find((o) => o.type === best)
  return { subdivision: best, label: opt ? opt.label : String(best) }
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '0m'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}
