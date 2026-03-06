import AccentPie from './AccentPie'

export default function PolyrhythmIndicators({
  rhythm1,
  rhythm2,
  polyBeat1,
  polyBeat2,
  polyAccents1,
  polyAccents2,
  onCyclePolyAccent,
  isPlaying,
}) {
  return (
    <div className="flex flex-col gap-3 px-4 w-full">
      <PolyRow
        label="R1"
        count={rhythm1}
        activeBeat={polyBeat1}
        accents={polyAccents1}
        isPlaying={isPlaying}
        fillColor="var(--color-primary)"
        ringColor="ring-primary"
        onCycleAccent={(beatIndex) => onCyclePolyAccent(1, beatIndex)}
      />
      <PolyRow
        label="R2"
        count={rhythm2}
        activeBeat={polyBeat2}
        accents={polyAccents2}
        isPlaying={isPlaying}
        fillColor="#3b82f6"
        ringColor="ring-blue-500"
        onCycleAccent={(beatIndex) => onCyclePolyAccent(2, beatIndex)}
      />
    </div>
  )
}

function PolyRow({ label, count, activeBeat, accents, isPlaying, fillColor, ringColor, onCycleAccent }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dark/40 w-6 text-right font-semibold flex-shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: count }, (_, i) => {
          const isActive = isPlaying && activeBeat === i
          const isDownbeat = i === 0
          const level = accents?.[i] || 'ON'

          return (
            <AccentPie
              key={i}
              level={level}
              size={20}
              isActive={isActive}
              isDownbeat={isDownbeat}
              fillColor={fillColor}
              activeRingClass={ringColor}
              onClick={() => onCycleAccent(i)}
            />
          )
        })}
      </div>
    </div>
  )
}
