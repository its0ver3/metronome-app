import { useState, useEffect, useRef, useCallback } from 'react'
import AccentPie from './AccentPie'
import useSwipe from '../../hooks/useSwipe'
import { meterGroups } from '../../audio/meter.js'

const ROWS_PER_PAGE = 4

export default function BeatIndicators({
  beatsPerBar,
  subdivision,
  subdivisionAccents,
  currentBeat,
  currentSubdivision,
  onCycleSubdivisionAccent,
  isPlaying,
  inGap,
  meter,
  groupOnly = false,
  onCycleBeatAccent,
}) {
  const spans = meter ? meterGroups(meter) : Array.from({ length: beatsPerBar }, (_, start) => ({ start, length: 1, end: start + 1, index: start }))
  const useStacked = !groupOnly && (subdivision > 1 || spans.some(group => group.length > 1))
  const unitLabel = meter?.denominator === 8 ? 'Group' : 'Beat'

  // Build beat groups
  const groups = spans.map(({ start, length, end, index: beat }) => {
    const dots = Array.from({ length: groupOnly ? 1 : subdivision * length }, (_, sub) => {
      const flatIndex = start * subdivision + sub
      const accent = subdivisionAccents[flatIndex] || 'ON'
      const isActive =
        isPlaying && (groupOnly ? currentBeat >= start && currentBeat < end : currentBeat === start + Math.floor(sub / subdivision) && currentSubdivision === sub % subdivision)
      const isDownbeat = sub === 0

      return { flatIndex, accent, isActive, isDownbeat, click: sub + 1 }
    })
    return { beat, start, dots }
  })

  const compact = subdivision > 8
  const dotSize = compact ? 14 : 20
  const hitSize = 44

  // Pagination
  const needsPagination = useStacked && groups.length > ROWS_PER_PAGE
  const totalPages = needsPagination ? Math.ceil(groups.length / ROWS_PER_PAGE) : 1
  const [currentPage, setCurrentPage] = useState(0)
  const trackRef = useRef(null)

  // Reset page when config changes
  useEffect(() => {
    setCurrentPage(0)
  }, [beatsPerBar, subdivision, meter, groupOnly])

  // Auto-follow active beat during playback
  useEffect(() => {
    if (isPlaying && needsPagination) {
      const activePage = Math.max(0, Math.floor(spans.findIndex(group => currentBeat >= group.start && currentBeat < group.end) / ROWS_PER_PAGE))
      setCurrentPage(activePage)
    }
  }, [isPlaying, currentBeat, needsPagination])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  useSwipe(trackRef, {
    currentPage,
    totalPages,
    onPageChange: handlePageChange,
  })

  if (useStacked) {
    // Split groups into pages
    const pages = needsPagination
      ? Array.from({ length: totalPages }, (_, i) =>
          groups.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE)
        )
      : [groups]

    return (
      <div className="w-full">
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex"
            style={{ willChange: needsPagination ? 'transform' : undefined }}
          >
            {pages.map((pageGroups, pi) => (
              <div
                key={pi}
                className="flex flex-col gap-2 px-4 w-full flex-shrink-0"
              >
                {pageGroups.map((group) => (
                  <div key={group.beat} className="flex items-center gap-1">
                    <span className="text-xs text-dark/30 w-5 text-right mr-1 flex-shrink-0">
                      {group.beat + 1}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {group.dots.map((dot) => (
                        <AccentPie
                          key={dot.flatIndex}
                          level={dot.accent}
                          size={dotSize}
                          hitSize={hitSize}
                          isActive={dot.isActive}
                          isDownbeat={dot.isDownbeat}
                          inGap={inGap}
                          accessibleLabel={`${unitLabel} ${group.beat + 1}, click ${dot.click} accent: ${dot.accent.toLowerCase()}. Activate to change.`}
                          onClick={() => onCycleSubdivisionAccent(dot.flatIndex)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {needsPagination && (
          <div className="flex justify-center items-center gap-1.5 pt-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i)}
                className="w-11 h-11 flex items-center justify-center rounded-full"
                aria-label={`Show beat page ${i + 1} of ${totalPages}`}
                aria-current={i === currentPage ? 'page' : undefined}
              >
                <span
                  aria-hidden="true"
                  className={`rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? 'w-5 h-1.5 bg-dark'
                      : 'w-1.5 h-1.5 bg-dark/25'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Single row with gaps between groups
  return (
    <div className="flex items-center justify-center flex-wrap px-4">
      {groups.map((group, gi) => (
        <div key={group.beat} className={`flex items-center gap-1 ${gi > 0 ? 'ml-3' : ''}`}>
          {group.dots.map((dot) => (
            <AccentPie
              key={dot.flatIndex}
              level={dot.accent}
              size={20}
              hitSize={44}
              isActive={dot.isActive}
              isDownbeat={dot.isDownbeat}
              inGap={inGap}
              accessibleLabel={`${unitLabel} ${group.beat + 1} accent: ${dot.accent.toLowerCase()}. Activate to change.`}
              onClick={() => groupOnly ? onCycleBeatAccent?.(group.start) : onCycleSubdivisionAccent(dot.flatIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
