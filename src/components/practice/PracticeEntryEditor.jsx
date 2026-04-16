import { useState } from 'react'
import { MIN_BPM, MAX_BPM } from '../../audio/constants'

export default function PracticeEntryEditor({
  entry,
  onSave,
  onDelete,
  onCancel,
  liveBpm,
  isActive,
  onToggleActive,
}) {
  const isEditing = !!entry?.id

  const [label, setLabel] = useState(entry?.label || '')
  const [goalBpm, setGoalBpm] = useState(entry?.goalBpm || 120)
  const [currentBpm, setCurrentBpm] = useState(entry?.currentBpm || 60)
  const [journalEntries, setJournalEntries] = useState(entry?.journalEntries || [])
  const [showDelete, setShowDelete] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const clampBpm = (n) => Math.max(MIN_BPM, Math.min(MAX_BPM, n))

  const handleLogBpm = () => {
    const t = Date.now()
    setCurrentBpm(liveBpm)
    setJournalEntries((prev) => [
      { t, text: '', bpmAtSnapshot: liveBpm },
      ...prev,
    ])
  }

  const handleSaveNote = () => {
    const text = noteText.trim()
    if (!text) {
      setAddingNote(false)
      setNoteText('')
      return
    }
    setJournalEntries((prev) => [{ t: Date.now(), text }, ...prev])
    setNoteText('')
    setAddingNote(false)
  }

  const handleSave = () => {
    if (!label.trim()) return
    onSave({
      ...(entry?.id ? { id: entry.id } : {}),
      label: label.trim(),
      goalBpm,
      currentBpm,
      journalEntries,
    })
  }

  const progressPct = goalBpm > 0 ? Math.min(100, Math.round((currentBpm / goalBpm) * 100)) : 0

  return (
    <div className="absolute inset-0 z-50 bg-light flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
        <button onClick={onCancel} className="text-dark/60 font-semibold text-sm">
          Cancel
        </button>
        <h2 className="font-heading text-2xl text-dark">
          {isEditing ? 'Edit Entry' : 'New Entry'}
        </h2>
        <button
          onClick={handleSave}
          disabled={!label.trim()}
          className={`font-semibold text-sm ${label.trim() ? 'text-primary' : 'text-dark/30'}`}
        >
          Save
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Label */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Single Stroke Roll"
            className="w-full px-4 py-3 rounded-lg bg-secondary text-dark placeholder-dark/30 font-semibold text-lg"
            autoFocus={!isEditing}
          />
        </div>

        {/* Goal BPM */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            Goal BPM
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGoalBpm(clampBpm(goalBpm - 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={goalBpm}
              onChange={(e) => setGoalBpm(clampBpm(parseInt(e.target.value) || MIN_BPM))}
              className="w-20 h-12 text-center rounded-lg bg-secondary text-dark font-heading text-3xl"
            />
            <button
              onClick={() => setGoalBpm(clampBpm(goalBpm + 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              +
            </button>
          </div>
        </div>

        {/* Current BPM + Log BPM */}
        <div>
          <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
            Current BPM
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentBpm(clampBpm(currentBpm - 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              −
            </button>
            <input
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={currentBpm}
              onChange={(e) => setCurrentBpm(clampBpm(parseInt(e.target.value) || MIN_BPM))}
              className="w-20 h-12 text-center rounded-lg bg-secondary text-dark font-heading text-3xl"
            />
            <button
              onClick={() => setCurrentBpm(clampBpm(currentBpm + 1))}
              className="w-12 h-12 rounded-full bg-secondary text-dark text-2xl font-bold flex items-center justify-center active:bg-secondary/70"
            >
              +
            </button>
          </div>
          <button
            onClick={handleLogBpm}
            className="mt-3 w-full py-3 rounded-lg bg-primary text-light font-semibold text-sm active:bg-primary/80"
          >
            Log current BPM ({liveBpm})
          </button>
          {/* Progress toward goal */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-dark/50 mb-1">
              <span>Progress to goal</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tracking toggle (only after save) */}
        {isEditing && (
          <div>
            <label className="text-xs text-dark/50 font-semibold uppercase tracking-wide block mb-1">
              Session tracking
            </label>
            <button
              onClick={onToggleActive}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-light active:bg-primary/80'
                  : 'bg-secondary text-dark active:bg-secondary/70'
              }`}
            >
              {isActive ? 'Stop tracking' : 'Set as active'}
            </button>
          </div>
        )}

        {/* Journal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark/50 font-semibold uppercase tracking-wide">
              Journal
            </span>
            {!addingNote && (
              <button
                onClick={() => setAddingNote(true)}
                className="text-primary font-semibold text-xs"
              >
                + Add note
              </button>
            )}
          </div>

          {addingNote && (
            <div className="mb-3 space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note…"
                rows={3}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-secondary text-dark placeholder-dark/30 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingNote(false); setNoteText('') }}
                  className="flex-1 py-2 rounded-lg bg-secondary text-dark font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex-1 py-2 rounded-lg bg-primary text-light font-semibold text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {journalEntries.length === 0 && !addingNote && (
            <p className="text-dark/40 text-sm text-center py-4">No notes yet.</p>
          )}

          <div className="space-y-2">
            {journalEntries.map((j, idx) => (
              <div key={idx} className="bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-dark/40">
                    {formatTimestamp(j.t)}
                  </span>
                  {typeof j.bpmAtSnapshot === 'number' && (
                    <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold">
                      {j.bpmAtSnapshot} BPM
                    </span>
                  )}
                </div>
                {j.text && (
                  <p className="text-dark text-sm whitespace-pre-wrap">{j.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete */}
        {isEditing && (
          <div className="pt-4 border-t border-secondary">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full py-3 rounded-lg text-dark/50 font-semibold text-sm"
              >
                Delete entry
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-dark/60 text-sm text-center">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDelete(false)}
                    className="flex-1 py-3 rounded-lg bg-secondary text-dark font-semibold text-sm"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="flex-1 py-3 rounded-lg bg-primary text-light font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTimestamp(t) {
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
  const sameYear = d.getFullYear() === now.getFullYear()
  const date = d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
  return `${date} ${time}`
}
