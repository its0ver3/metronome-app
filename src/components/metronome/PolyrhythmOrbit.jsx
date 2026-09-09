import { memo, useMemo } from 'react'
import {
  getOrbitAccentLevel,
  getStandardOrbitAccentIndex,
} from './orbitAccents'
import {
  getGapDistance,
  parallelArcPath,
  parallelSegmentPath,
} from './orbitGeometry'
import { meterGroups } from '../../audio/meter.js'

const TRACK_OUTER_RADIUS = 48
const TRACK_INNER_RADIUS = 37.5
const OUTER_RADIUS = 46.8
const INNER_RADIUS = 38.7
const ON_OUTER_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2
const HIT_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2

function handleSegmentKeyDown(event, onActivate) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  onActivate()
}

function RhythmArc({
  rhythm,
  count,
  startAngle,
  sweepAngle,
  activeBeat,
  isPlaying,
  accents,
  accentIndexForBeat,
  controlIndexForBeat,
  onCycleAccent,
  interactive = true,
  spans,
}) {
  const stepAngle = sweepAngle / count
  const gapAngle = Math.min(3.5, stepAngle * 0.18)
  const gapDistance = getGapDistance(gapAngle, HIT_RADIUS)

  const geometry = useMemo(() => Array.from({ length: count }, (_, beat) => {
    const segmentStart = spans?.[beat]?.startAngle ?? startAngle + beat * stepAngle
    const segmentEnd = spans?.[beat]?.endAngle ?? startAngle + (beat + 1) * stepAngle
    const trackPath = parallelSegmentPath(
      segmentStart,
      segmentEnd,
      gapDistance,
      TRACK_OUTER_RADIUS,
      TRACK_INNER_RADIUS,
    )
    const surfacePath = parallelSegmentPath(
      segmentStart,
      segmentEnd,
      gapDistance,
      OUTER_RADIUS,
      INNER_RADIUS,
    )
    const onPath = parallelSegmentPath(
      segmentStart,
      segmentEnd,
      gapDistance,
      ON_OUTER_RADIUS,
      INNER_RADIUS,
    )
    const hitPath = parallelArcPath(segmentStart, segmentEnd, gapDistance, HIT_RADIUS)
    return { trackPath, surfacePath, onPath, hitPath }
  }), [count, spans, startAngle, stepAngle, gapDistance])

  return Array.from({ length: count }, (_, beat) => {
    const isActive = isPlaying && activeBeat === beat
    const accentIndex = accentIndexForBeat(beat)
    const controlIndex = controlIndexForBeat(beat)
    const accent = getOrbitAccentLevel(accents, accentIndex)
    const stateClass = `accent-${accent.toLowerCase()}`
    const description = rhythm === 'standard'
      ? `${spans ? 'Group' : 'Beat'} ${beat + 1}`
      : `Rhythm ${rhythm === 'one' ? '1' : '2'}, pulse ${beat + 1}`
    const { trackPath, surfacePath, onPath, hitPath } = geometry[beat]
    const facePath = accent === 'ACCENT' ? trackPath : accent === 'ON' ? onPath : surfacePath
    const activate = () => onCycleAccent(controlIndex)

    return (
      <g
        key={`${rhythm}-${beat}`}
        className="pulse-orbit-segment-control"
        data-rhythm={rhythm}
        data-beat={beat}
        data-active={isActive ? 'true' : 'false'}
        data-accent={accent.toLowerCase()}
      >
        <path
          d={trackPath}
          className="pulse-orbit-segment-track"
          aria-hidden="true"
        />
        <path
          d={facePath}
          className={`pulse-orbit-segment-surface rhythm-${rhythm} ${stateClass} ${isActive ? 'is-active' : ''}`}
          style={{
            animationDelay: `${-(beat % 3) * 180}ms`,
          }}
          aria-hidden="true"
        />
        {interactive && <path
          d={hitPath}
          className="pulse-orbit-segment-hit"
          role="button"
          tabIndex="0"
          aria-label={`${description} accent: ${accent.toLowerCase()}. ${rhythm === 'standard' ? 'Activate to change the beat accent; Off silences all subdivisions.' : 'Activate to change.'}`}
          onClick={activate}
          onKeyDown={(event) => handleSegmentKeyDown(event, activate)}
        />}
      </g>
    )
  })
}

export const StandardRhythmOrbit = memo(function StandardRhythmOrbit({
  beatCount,
  subdivision,
  accents,
  activeBeat,
  isPlaying,
  onCycleBeatAccent,
  interactive = true,
  meter,
}) {
  const groups = useMemo(() => meter ? meterGroups(meter) : null, [meter])
  const spans = useMemo(() => groups?.map(group => ({ startAngle: -90 + group.start / beatCount * 360, endAngle: -90 + group.end / beatCount * 360 })), [groups, beatCount])
  const activeGroup = groups ? groups.findIndex(group => activeBeat >= group.start && activeBeat < group.end) : activeBeat
  return (
    <svg
      className="pulse-segmented-orbit pulse-standard-orbit"
      viewBox="0 0 100 100"
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? 'Beat accent controls' : undefined}
      aria-hidden={!interactive || undefined}
    >
      <RhythmArc
        rhythm="standard"
        count={groups?.length ?? beatCount}
        spans={spans}
        startAngle={-90}
        sweepAngle={360}
        activeBeat={activeGroup}
        isPlaying={isPlaying}
        accents={accents}
        accentIndexForBeat={(beat) => getStandardOrbitAccentIndex(groups?.[beat]?.start ?? beat, subdivision)}
        controlIndexForBeat={(beat) => groups?.[beat]?.start ?? beat}
        onCycleAccent={onCycleBeatAccent}
        interactive={interactive}
      />
    </svg>
  )
})

export default memo(function PolyrhythmOrbit({
  rhythm1,
  rhythm2,
  activeBeat1,
  activeBeat2,
  isPlaying,
  accents1,
  accents2,
  onCycleAccent,
  interactive = true,
}) {
  return (
    <svg
      className="pulse-segmented-orbit pulse-poly-orbit"
      viewBox="0 0 100 100"
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? 'Polyrhythm accent controls' : undefined}
      aria-hidden={!interactive || undefined}
    >
      <RhythmArc
        rhythm="one"
        count={rhythm1}
        startAngle={180}
        sweepAngle={180}
        activeBeat={activeBeat1}
        isPlaying={isPlaying}
        accents={accents1}
        accentIndexForBeat={(beat) => beat}
        controlIndexForBeat={(beat) => beat}
        onCycleAccent={(beat) => onCycleAccent(1, beat)}
        interactive={interactive}
      />
      <RhythmArc
        rhythm="two"
        count={rhythm2}
        startAngle={0}
        sweepAngle={180}
        activeBeat={activeBeat2}
        isPlaying={isPlaying}
        accents={accents2}
        accentIndexForBeat={(beat) => beat}
        controlIndexForBeat={(beat) => beat}
        onCycleAccent={(beat) => onCycleAccent(2, beat)}
        interactive={interactive}
      />
    </svg>
  )
})
