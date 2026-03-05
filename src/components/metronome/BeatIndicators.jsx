import { ACCENT_STYLES } from '../../audio/constants'

const DOWNBEAT_RING = 'ring-1 ring-dark/20'

export default function BeatIndicators({
  beatsPerBar,
  subdivision,
  subdivisionAccents,
  currentBeat,
  currentSubdivision,
  onCycleSubdivisionAccent,
  isPlaying,
  inGap,
}) {
  const totalDots = beatsPerBar * subdivision
  const useStacked = totalDots > 16

  // Build beat groups
  const groups = Array.from({ length: beatsPerBar }, (_, beat) => {
    const dots = Array.from({ length: subdivision }, (_, sub) => {
      const flatIndex = beat * subdivision + sub
      const accent = subdivisionAccents[flatIndex] || 'ON'
      const isActive =
        isPlaying && currentBeat === beat && currentSubdivision === sub
      const isDownbeat = sub === 0

      return { flatIndex, accent, isActive, isDownbeat }
    })
    return { beat, dots }
  })

  if (useStacked) {
    return (
      <div className="flex flex-col gap-2 px-4 w-full">
        {groups.map((group) => (
          <div key={group.beat} className="flex items-center gap-1">
            <span className="text-xs text-dark/30 w-5 text-right mr-1 flex-shrink-0">
              {group.beat + 1}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {group.dots.map((dot) => (
                <Dot
                  key={dot.flatIndex}
                  {...dot}
                  onCycle={onCycleSubdivisionAccent}
                  inGap={inGap}
                  compact={subdivision > 8}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Single row with gaps between groups
  return (
    <div className="flex items-center justify-center flex-wrap px-4">
      {groups.map((group, gi) => (
        <div key={group.beat} className={`flex items-center gap-1 ${gi > 0 ? 'ml-3' : ''}`}>
          {group.dots.map((dot) => (
            <Dot
              key={dot.flatIndex}
              {...dot}
              onCycle={onCycleSubdivisionAccent}
              inGap={inGap}
              compact={false}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Dot({ flatIndex, accent, isActive, isDownbeat, onCycle, inGap, compact }) {
  const baseStyle = ACCENT_STYLES[accent]

  return (
    <button
      onClick={() => onCycle(flatIndex)}
      className={`rounded-full transition-all duration-100 flex-shrink-0 flex items-center justify-center ${
        compact ? 'w-7 h-7' : 'w-10 h-10'
      }`}
      title={`Click ${flatIndex + 1}: ${accent}`}
    >
      <span
        className={`rounded-full block transition-all duration-100 ${baseStyle} ${
          isDownbeat ? DOWNBEAT_RING : ''
        } ${
          isActive
            ? inGap
              ? 'ring-2 ring-dark/20 ring-offset-2 opacity-40'
              : 'ring-2 ring-primary ring-offset-2 scale-125'
            : ''
        }`}
      />
    </button>
  )
}
