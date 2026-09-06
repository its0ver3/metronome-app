import { getGapPatternLabel } from '../../audio/gapPatterns.js'

const STAGE_LABELS = ['A', 'B', 'C', 'D']

export function getActiveTrainerCount({ gapEnabled, tempoEnabled, subdivTrainerEnabled }) {
  return [gapEnabled, tempoEnabled, subdivTrainerEnabled].filter(Boolean).length
}

export function getPlaybackSummary({
  bpm,
  isPlaying,
  currentBar,
  currentBeat,
  beatsPerBar,
  inGap,
  gapEnabled,
  gapPattern = 'silence',
  gapPlayback,
  meter,
  tempoEnabled,
  tempoTargetBpm,
  subdivTrainerEnabled,
  subdivTrainerStages = [],
  subdivTrainerStageIndex = 0,
  subdivTrainerBarCount = 0,
  polyrhythmMode,
  session,
}) {
  const trainerCount = getActiveTrainerCount({ gapEnabled, tempoEnabled, subdivTrainerEnabled })
  if (session?.phase === 'count-in') {
    return { mode: 'Count-in', detail: `Bar ${session.countInBar} of ${session.countInBars}`, chips: [] }
  }

  if (polyrhythmMode) {
    return {
      mode: 'Polyrhythm',
      detail: isPlaying ? `${bpm} BPM · Playing` : `${bpm} BPM · Ready`,
      chips: trainerCount > 0 ? [`${trainerCount} trainer${trainerCount === 1 ? '' : 's'} paused`] : [],
    }
  }

  const chips = []
  if (gapEnabled) {
    const pattern = isPlaying ? gapPlayback?.pattern ?? gapPattern : gapPattern
    const label = inGap ? (pattern === 'silence' ? 'Silent' : getGapPatternLabel(pattern, meter?.denominator)) : 'Click'
    const progress = isPlaying && gapPlayback ? ` · ${gapPlayback.bar}/${gapPlayback.bars}` : ''
    chips.push(`Gap · ${label}${progress}`)
  }
  if (tempoEnabled) chips.push(`Tempo · ${bpm} → ${tempoTargetBpm}`)
  if (subdivTrainerEnabled) {
    const stage = subdivTrainerStages[subdivTrainerStageIndex] || subdivTrainerStages[0]
    if (stage) {
      const label = STAGE_LABELS[subdivTrainerStageIndex] || String(subdivTrainerStageIndex + 1)
      chips.push(`Subdiv · ${label}:${stage.subdivision} · ${Math.min(subdivTrainerBarCount + 1, stage.bars)}/${stage.bars}`)
    } else {
      chips.push('Subdivision trainer')
    }
  }

  const beat = Math.max(0, currentBeat) + 1
  const detail = isPlaying
    ? `Bar ${currentBar} · Beat ${beat} of ${beatsPerBar}`
    : `${bpm} BPM · Ready`

  return { mode: trainerCount > 0 ? 'Training metronome' : 'Metronome', detail, chips }
}

export default function PlaybackStatus(props) {
  const summary = getPlaybackSummary(props)

  return (
    <section
      className="w-full rounded-xl border border-dark/10 bg-secondary/70 px-3 py-2.5"
      aria-label="Current playback status"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/45">
            {summary.mode}
          </p>
          <p className="truncate text-sm font-semibold text-dark/80">{summary.detail}</p>
        </div>
        <span
          className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${props.isPlaying ? 'bg-primary shadow-[0_0_10px_rgba(245,240,232,0.6)]' : 'bg-dark/20'}`}
          aria-hidden="true"
        />
      </div>

      {summary.chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {summary.chips.map((chip) => (
            <span key={chip} className="rounded-full bg-dark/10 px-2 py-1 text-[10px] font-semibold text-dark/65">
              {chip}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
