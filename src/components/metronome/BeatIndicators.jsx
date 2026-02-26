import { ACCENT_STYLES } from '../../audio/constants'

export default function BeatIndicators({
  beatsPerBar,
  currentBeat,
  accents,
  onCycleAccent,
  isPlaying,
  inGap,
}) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap px-4">
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const accent = accents[i] || 'NORMAL'
        const isActive = isPlaying && currentBeat === i
        const baseStyle = ACCENT_STYLES[accent]

        return (
          <button
            key={i}
            onClick={() => onCycleAccent(i)}
            className={`rounded-full transition-all duration-100 flex-shrink-0 ${baseStyle} ${
              isActive
                ? inGap
                  ? 'ring-2 ring-dark/20 ring-offset-2 opacity-40'
                  : 'ring-2 ring-primary ring-offset-2 scale-125'
                : ''
            }`}
            title={`Beat ${i + 1}: ${accent}`}
          />
        )
      })}
    </div>
  )
}
