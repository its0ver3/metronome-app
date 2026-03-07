import SubdivisionPicker from '../metronome/SubdivisionPicker'

export default function SubdivisionTrainer({
  enabled,
  subA,
  barsA,
  subB,
  barsB,
  onChange,
}) {
  const handleToggle = () => {
    onChange(!enabled, subA, barsA, subB, barsB)
  }

  const handleSubAChange = (val) => {
    onChange(enabled, val, barsA, subB, barsB)
  }

  const handleSubBChange = (val) => {
    onChange(enabled, subA, barsA, val, barsB)
  }

  const handleBarsA = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, subA, v, subB, barsB)
  }

  const handleBarsB = (val) => {
    const v = Math.max(1, Math.min(16, val))
    onChange(enabled, subA, barsA, subB, v)
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-xl text-dark">Subdivision Trainer</h3>
          <p className="text-xs text-dark/50">Alternate between two subdivisions</p>
        </div>
        <button
          onClick={handleToggle}
          className={`w-12 h-7 rounded-full transition-colors relative ${
            enabled ? 'bg-primary' : 'bg-dark/20'
          }`}
        >
          <span
            className={`absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className={`space-y-4 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs text-dark/50 font-semibold block mb-1">Subdivision A</label>
            <SubdivisionPicker subdivision={subA} onChange={handleSubAChange} />
          </div>
          <div>
            <label className="text-xs text-dark/50 font-semibold block mb-1">Bars</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBarsA(barsA - 1)}
                className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
              >
                −
              </button>
              <span className="font-heading text-2xl text-dark w-8 text-center">{barsA}</span>
              <button
                onClick={() => handleBarsA(barsA + 1)}
                className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs text-dark/50 font-semibold block mb-1">Subdivision B</label>
            <SubdivisionPicker subdivision={subB} onChange={handleSubBChange} />
          </div>
          <div>
            <label className="text-xs text-dark/50 font-semibold block mb-1">Bars</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBarsB(barsB - 1)}
                className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
              >
                −
              </button>
              <span className="font-heading text-2xl text-dark w-8 text-center">{barsB}</span>
              <button
                onClick={() => handleBarsB(barsB + 1)}
                className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
