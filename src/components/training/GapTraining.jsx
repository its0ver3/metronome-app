import { useState } from 'react'

export default function GapTraining({ enabled, clickBars, silentBars, onChange }) {
  const [localClick, setLocalClick] = useState(clickBars)
  const [localSilent, setLocalSilent] = useState(silentBars)

  const handleToggle = () => {
    onChange(!enabled, localClick, localSilent)
  }

  const handleClickBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    setLocalClick(v)
    if (enabled) onChange(true, v, localSilent)
  }

  const handleSilentBars = (val) => {
    const v = Math.max(1, Math.min(16, val))
    setLocalSilent(v)
    if (enabled) onChange(true, localClick, v)
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-xl text-dark">Gap Training</h3>
          <p className="text-xs text-dark/50">Play bars, then silence bars, repeat</p>
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

      <div className={`flex gap-4 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex-1">
          <label className="text-xs text-dark/50 font-semibold block mb-1">Click Bars</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleClickBars(localClick - 1)}
              className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
            >
              −
            </button>
            <span className="font-heading text-2xl text-dark w-8 text-center">{localClick}</span>
            <button
              onClick={() => handleClickBars(localClick + 1)}
              className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-dark/50 font-semibold block mb-1">Silent Bars</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSilentBars(localSilent - 1)}
              className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
            >
              −
            </button>
            <span className="font-heading text-2xl text-dark w-8 text-center">{localSilent}</span>
            <button
              onClick={() => handleSilentBars(localSilent + 1)}
              className="w-9 h-9 rounded-lg bg-secondary text-dark font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
