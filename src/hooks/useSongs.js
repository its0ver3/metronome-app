import { useState, useEffect, useCallback } from 'react'
import { getAllSongs, saveSong, deleteSong } from '../storage/presetDb'

export default function useSongs() {
  const [songs, setSongs] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllSongs()
    setSongs(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (song) => {
    const id = await saveSong(song)
    await refresh()
    return id
  }, [refresh])

  const remove = useCallback(async (id) => {
    await deleteSong(id)
    await refresh()
  }, [refresh])

  return { songs, save, remove, refresh }
}
