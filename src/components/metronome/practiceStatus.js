import { getGapPatternLabel } from '../../audio/gapPatterns.js'

const STAGES = ['A', 'B', 'C', 'D']
const boundedBars = (value, fallback = 2) => Number.isFinite(Number(value))
  ? Math.max(1, Math.min(32, Math.round(Number(value)))) : fallback

// Playback snapshots are captured by the audio scheduler, then delivered when
// that bar sounds. Saved settings are used for the stopped/ready state.
export function getPracticeRows(props) {
  const {
    isPlaying: transportPlaying, session, inGap, bpm, meter, gapEnabled, gapPattern = 'silence',
    gapClickBars = 2, gapPlayback, tempoEnabled, tempoTargetBpm,
    tempoEveryBars = 4, subdivTrainerEnabled, subdivTrainerStages = [],
    trainerPlayback, polyrhythmMode,
  } = props
  if (polyrhythmMode) return []
  const isPlaying = transportPlaying && session?.phase !== 'count-in'
  const rows = []
  const progress = (bar, total, active = true) => ({
    total: boundedBars(total),
    bar: isPlaying && active ? Math.max(1, Math.min(boundedBars(total), bar || 1)) : 0,
    progressLabel: !isPlaying ? 'Ready' : active ? null : 'Next bar',
  })
  if (gapEnabled) {
    const gap = isPlaying && inGap
    const pattern = gapPlayback?.pattern ?? gapPattern
    rows.push({
      id: 'gap', name: 'Gap', value: gap ? (pattern === 'silence' ? 'Silent' : getGapPatternLabel(pattern, meter?.denominator)) : 'Click',
      ...progress(gapPlayback?.bar, gapPlayback?.bars ?? gapClickBars, Boolean(gapPlayback?.enabled)),
    })
  }
  if (tempoEnabled) {
    const live = isPlaying ? trainerPlayback?.tempo : null
    rows.push({
      id: 'tempo', name: 'Tempo', value: bpm, target: live?.target ?? tempoTargetBpm,
      ...progress(live?.bar, live?.bars ?? tempoEveryBars, Boolean(live?.enabled)),
      ...(live?.enabled && live.reached ? { progressLabel: 'Target reached', bar: boundedBars(live.bars) } : {}),
    })
  }
  if (subdivTrainerEnabled) {
    const live = isPlaying ? trainerPlayback?.subdivision : null
    const stage = live?.enabled ? live.stage : subdivTrainerStages[0]
    if (stage) rows.push({
      id: 'subdivision', name: 'Subdivision', value: STAGES[live?.enabled ? live.index : 0] || 'A',
      subdivision: stage.subdivision, denominator: meter?.denominator ?? 4,
      ...progress(live?.bar, stage.bars, Boolean(live?.enabled)),
    })
  }
  return rows
}
