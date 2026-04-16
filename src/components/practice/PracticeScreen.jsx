import { useState } from 'react'
import StatsCards from './StatsCards'
import ActiveEntryBanner from './ActiveEntryBanner'
import PracticeEntryEditor from './PracticeEntryEditor'
import usePracticeEntries from '../../hooks/usePracticeEntries'

export default function PracticeScreen({
  sessions,
  liveBpm,
  activeEntryId,
  onSetActiveEntry,
}) {
  const { entries, save, remove } = usePracticeEntries()
  const [editing, setEditing] = useState(null) // null | {} (new) | entry

  const activeEntry = entries.find((e) => e.id === activeEntryId) || null

  const handleNew = () => {
    setEditing({})
  }

  const handleSave = async (entry) => {
    await save(entry)
    setEditing(null)
  }

  const handleDelete = async (id) => {
    if (activeEntryId === id) {
      onSetActiveEntry(null)
    }
    await remove(id)
    setEditing(null)
  }

  const handleToggleActive = () => {
    if (!editing?.id) return
    onSetActiveEntry(activeEntryId === editing.id ? null : editing.id)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-heading text-3xl text-dark mb-3">Practice</h2>
        <StatsCards sessions={sessions} />
      </div>

      {activeEntry && (
        <div className="px-4 pb-2">
          <ActiveEntryBanner
            entry={activeEntry}
            onStop={() => onSetActiveEntry(null)}
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
        {entries.length === 0 && (
          <p className="text-dark/40 text-sm text-center py-8">
            No practice entries yet. Create one to track a rudiment or pattern.
          </p>
        )}
        {entries.map((entry) => {
          const isActive = entry.id === activeEntryId
          return (
            <button
              key={entry.id}
              onClick={() => setEditing(entry)}
              className={`w-full text-left rounded-xl px-4 py-3 transition-colors flex items-center justify-between ${
                isActive
                  ? 'bg-primary/10 border border-primary'
                  : 'bg-secondary/50 active:bg-secondary'
              }`}
            >
              <div className="min-w-0 mr-3">
                <div className="font-heading text-lg text-dark truncate">
                  {entry.label}
                </div>
                {isActive && (
                  <div className="text-xs text-primary font-semibold uppercase tracking-wide mt-0.5">
                    Tracking
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-dark/50 text-xs">Current / Goal</div>
                <div className="text-dark font-heading text-base">
                  {entry.currentBpm} / {entry.goalBpm}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={handleNew}
          className="w-full py-3 rounded-lg bg-primary text-light font-semibold text-sm active:bg-primary/80 transition-colors"
        >
          + New entry
        </button>
      </div>

      {/* Editor overlay */}
      {editing !== null && (
        <PracticeEntryEditor
          entry={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => setEditing(null)}
          liveBpm={liveBpm}
          isActive={!!editing?.id && editing.id === activeEntryId}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  )
}
