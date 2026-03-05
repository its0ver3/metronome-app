const DOWNBEAT_RING = 'ring-1 ring-dark/20'

export default function PolyrhythmIndicators({
  rhythm1,
  rhythm2,
  polyBeat1,
  polyBeat2,
  isPlaying,
}) {
  return (
    <div className="flex flex-col gap-3 px-4 w-full">
      <PolyRow
        label="R1"
        count={rhythm1}
        activeBeat={polyBeat1}
        isPlaying={isPlaying}
        dotColor="bg-primary"
        ringColor="ring-primary"
      />
      <PolyRow
        label="R2"
        count={rhythm2}
        activeBeat={polyBeat2}
        isPlaying={isPlaying}
        dotColor="bg-blue-500"
        ringColor="ring-blue-500"
      />
    </div>
  )
}

function PolyRow({ label, count, activeBeat, isPlaying, dotColor, ringColor }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dark/40 w-6 text-right font-semibold flex-shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: count }, (_, i) => {
          const isActive = isPlaying && activeBeat === i
          const isDownbeat = i === 0

          return (
            <span
              key={i}
              className={`w-5 h-5 rounded-full block transition-all duration-100 ${dotColor} ${
                isDownbeat ? DOWNBEAT_RING : ''
              } ${
                isActive
                  ? `ring-2 ${ringColor} ring-offset-2 scale-125`
                  : 'opacity-60'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
