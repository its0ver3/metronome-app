import { SUBDIVISION_TYPES } from '../../audio/constants'

const options = [
  { type: SUBDIVISION_TYPES.QUARTER, label: '♩', desc: 'Quarter' },
  { type: SUBDIVISION_TYPES.EIGHTH, label: '♪♪', desc: '8th' },
  { type: SUBDIVISION_TYPES.TRIPLET, label: '♪♪♪', desc: 'Triplet' },
  { type: SUBDIVISION_TYPES.SIXTEENTH, label: '♬♬', desc: '16th' },
  { type: SUBDIVISION_TYPES.QUINTUPLET, label: '5', desc: 'Quintuplet' },
]

export default function SubdivisionPicker({ subdivision, onChange }) {
  return (
    <div className="w-full px-4">
      <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-2">
        Subdivision
      </span>
      <div className="flex gap-2 justify-center">
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={`flex-1 py-2 rounded-lg text-center transition-colors ${
              subdivision === opt.type
                ? 'bg-primary text-light'
                : 'bg-secondary text-dark active:bg-secondary/70'
            }`}
          >
            <span className="block text-lg leading-none">{opt.label}</span>
            <span className="block text-xs mt-0.5 opacity-70">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
