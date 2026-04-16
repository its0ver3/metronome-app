import { useMemo } from 'react'
import {
  computeTotalMs,
  computeStreak,
  computeFavouriteSubdivision,
  formatDuration,
} from '../../practice/stats'

export default function StatsCards({ sessions }) {
  const totalMs = useMemo(() => computeTotalMs(sessions), [sessions])
  const streak = useMemo(() => computeStreak(sessions), [sessions])
  const favourite = useMemo(() => computeFavouriteSubdivision(sessions), [sessions])

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard value={formatDuration(totalMs)} label="Total time" />
      <StatCard value={String(streak)} label={streak === 1 ? 'Day streak' : 'Day streak'} />
      <StatCard value={favourite ? favourite.label : '—'} label="Favourite sub" />
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="bg-secondary/50 rounded-xl p-4 flex flex-col items-center justify-center">
      <span className="font-heading text-2xl text-dark leading-tight">{value}</span>
      <span className="text-xs text-dark/50 mt-1 text-center">{label}</span>
    </div>
  )
}
