import { SOUND_NAMES } from '../../audio/constants'

export default function SoundSelector({ selectedIndex, onSelect, onPreview }) {
  return (
    <div>
      <h3 className="font-heading text-xl text-dark mb-2">Click Sound</h3>
      <div className="space-y-1">
        {SOUND_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(i)
              onPreview(i)
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              selectedIndex === i
                ? 'bg-primary/10 border border-primary'
                : 'bg-secondary/50 active:bg-secondary'
            }`}
          >
            <span className={`text-sm font-semibold ${selectedIndex === i ? 'text-primary' : 'text-dark'}`}>
              {name}
            </span>
            {selectedIndex === i && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
