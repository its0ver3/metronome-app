import { SOUND_NAMES } from '../../audio/constants'

export default function PolyrhythmPickers({
  rhythm1,
  rhythm2,
  soundIndex1,
  soundIndex2,
  onRhythm1Change,
  onRhythm2Change,
  onSoundIndex1Change,
  onSoundIndex2Change,
  onSoundPreview,
}) {
  return (
    <div className="flex flex-col gap-3 px-4 w-full">
      <RhythmRow
        label="Rhythm 1"
        rhythm={rhythm1}
        soundIndex={soundIndex1}
        onRhythmChange={onRhythm1Change}
        onSoundChange={onSoundIndex1Change}
        onSoundPreview={onSoundPreview}
      />
      <RhythmRow
        label="Rhythm 2"
        rhythm={rhythm2}
        soundIndex={soundIndex2}
        onRhythmChange={onRhythm2Change}
        onSoundChange={onSoundIndex2Change}
        onSoundPreview={onSoundPreview}
      />
    </div>
  )
}

function RhythmRow({ label, rhythm, soundIndex, onRhythmChange, onSoundChange, onSoundPreview }) {
  return (
    <div className="flex gap-3 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
          {label}
        </span>
        <div className="relative">
          <select
            value={rhythm}
            onChange={(e) => onRhythmChange(parseInt(e.target.value))}
            className="h-10 px-3 pr-8 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer w-full"
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/40 text-xs">
            ▼
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
          Sound
        </span>
        <div className="relative">
          <select
            value={soundIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value)
              onSoundChange(idx)
              onSoundPreview?.(idx)
            }}
            className="h-10 px-3 pr-8 rounded-lg bg-secondary text-dark font-semibold text-sm appearance-none cursor-pointer w-full"
          >
            {SOUND_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dark/40 text-xs">
            ▼
          </span>
        </div>
      </div>
    </div>
  )
}
