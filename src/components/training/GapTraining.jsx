export default function GapTraining({ enabled, clickBars, silentBars, disabled = false, onChange }) {
  const handleToggle = () => {
    onChange(!enabled, clickBars, silentBars)
  }

  const handleClickBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, v, silentBars)
  }

  const handleSilentBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, clickBars, v)
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-xl text-dark">Gap Training</h3>
          <p className="text-xs text-dark/50">Play bars, then silence bars, repeat</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable gap training"
          disabled={disabled}
          onClick={handleToggle}
          className="relative w-12 h-11 rounded-full disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-2 h-7 w-12 rounded-full transition-colors ${
              enabled ? 'bg-primary' : 'bg-dark/20'
            }`}
          >
            <span
              className={`absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <div className={`flex gap-4 ${!enabled || disabled ? 'opacity-40' : ''}`}>
        <div className="flex-1">
          <label className="text-xs text-dark/50 font-semibold block mb-1">Click Bars</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease click bars"
              disabled={!enabled || disabled}
              onClick={() => handleClickBars(clickBars - 1)}
              className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="font-heading text-2xl text-dark w-8 text-center">{clickBars}</span>
            <button
              type="button"
              aria-label="Increase click bars"
              disabled={!enabled || disabled}
              onClick={() => handleClickBars(clickBars + 1)}
              className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-dark/50 font-semibold block mb-1">Silent Bars</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease silent bars"
              disabled={!enabled || disabled}
              onClick={() => handleSilentBars(silentBars - 1)}
              className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="font-heading text-2xl text-dark w-8 text-center">{silentBars}</span>
            <button
              type="button"
              aria-label="Increase silent bars"
              disabled={!enabled || disabled}
              onClick={() => handleSilentBars(silentBars + 1)}
              className="w-11 h-11 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
