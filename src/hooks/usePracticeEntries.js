import { useState, useEffect, useCallback } from 'react'
import { getAllPracticeEntries, savePracticeEntry, deletePracticeEntry } from '../storage/presetDb'

export default function usePracticeEntries() {
  const [entries, setEntries] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllPracticeEntries()
    setEntries(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (entry) => {
    const id = await savePracticeEntry(entry)
    await refresh()
    return id
  }, [refresh])

  const remove = useCallback(async (id) => {
    await deletePracticeEntry(id)
    await refresh()
  }, [refresh])

  return { entries, save, remove, refresh }
}
