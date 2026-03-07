import { useState, useEffect, useRef, useCallback } from 'react'
import AccentPie from './AccentPie'
import useSwipe from '../../hooks/useSwipe'

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
}) {
  const useStacked = subdivision > 1

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

  // Pagination
  const needsPagination = useStacked && beatsPerBar > ROWS_PER_PAGE
  const totalPages = needsPagination ? Math.ceil(beatsPerBar / ROWS_PER_PAGE) : 1
  const [currentPage, setCurrentPage] = useState(0)
  const trackRef = useRef(null)

  // Reset page when config changes
  useEffect(() => {
    setCurrentPage(0)
  }, [beatsPerBar, subdivision])

  // Auto-follow active beat during playback
  useEffect(() => {
    if (isPlaying && needsPagination) {
      const activePage = Math.floor(currentBeat / ROWS_PER_PAGE)
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
            ))}
          </div>
        </div>
        {needsPagination && (
          <div className="flex justify-center items-center gap-1.5 pt-3">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPage
                    ? 'w-5 h-1.5 bg-dark'
                    : 'w-1.5 h-1.5 bg-dark/25'
                }`}
                aria-label={`Page ${i + 1}`}
              />
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
