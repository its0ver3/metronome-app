import { useState } from 'react'

export default function PresetManager({ presets, onSave, onLoad, onDelete }) {
  const [name, setName] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim())
    setName('')
  }

  return (
    <div>
      <h3 className="font-heading text-xl text-dark mb-2">Presets</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Preset name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 h-10 px-3 rounded-lg bg-secondary text-dark text-sm placeholder:text-dark/30"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="h-10 px-4 rounded-lg bg-primary text-white font-semibold text-sm disabled:opacity-40"
        >
          Save
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-xs text-dark/40 text-center py-4">No presets saved yet</p>
      ) : (
        <div className="space-y-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between px-3 py-2.5 bg-secondary/50 rounded-lg"
            >
              <button
                onClick={() => onLoad(preset)}
                className="text-sm font-semibold text-dark text-left flex-1"
              >
                {preset.name}
                <span className="text-xs text-dark/40 ml-2">{preset.bpm} BPM</span>
              </button>
              <button
                onClick={() => onDelete(preset.id)}
                className="text-dark/30 hover:text-primary p-1"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
