import { useState, useEffect, useCallback } from 'react'
import { getAllSetlists, saveSetlist, deleteSetlist } from '../storage/presetDb'

export default function useSetlists() {
  const [setlists, setSetlists] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllSetlists()
    setSetlists(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (setlist) => {
    const id = await saveSetlist(setlist)
    await refresh()
    return id
  }, [refresh])

  const remove = useCallback(async (id) => {
    await deleteSetlist(id)
    await refresh()
  }, [refresh])

  return { setlists, save, remove, refresh }
}
