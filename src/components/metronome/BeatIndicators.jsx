import AccentPie from './AccentPie'

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

  const compact = subdivision > 8
  const dotSize = compact ? 14 : 20

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
                <div
                  key={dot.flatIndex}
                  className={`flex items-center justify-center ${compact ? 'w-7 h-7' : 'w-10 h-10'}`}
                >
                  <AccentPie
                    level={dot.accent}
                    size={dotSize}
                    isActive={dot.isActive}
                    isDownbeat={dot.isDownbeat}
                    inGap={inGap}
                    onClick={() => onCycleSubdivisionAccent(dot.flatIndex)}
                  />
                </div>
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
            <div
              key={dot.flatIndex}
              className="w-10 h-10 flex items-center justify-center"
            >
              <AccentPie
                level={dot.accent}
                size={20}
                isActive={dot.isActive}
                isDownbeat={dot.isDownbeat}
                inGap={inGap}
                onClick={() => onCycleSubdivisionAccent(dot.flatIndex)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
