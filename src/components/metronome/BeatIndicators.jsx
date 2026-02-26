import { ACCENT_LEVELS } from '../../audio/constants'

const accentStyles = {
  STRONG: 'w-5 h-5 bg-primary',
  MEDIUM: 'w-4 h-4 bg-primary/70',
  NORMAL: 'w-3.5 h-3.5 bg-dark/40',
  GHOST: 'w-3 h-3 bg-dark/20',
  SILENT: 'w-3 h-3 bg-transparent border-2 border-dark/20',
}

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
        const baseStyle = accentStyles[accent]

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
