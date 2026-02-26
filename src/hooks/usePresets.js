import { useState, useEffect, useCallback } from 'react'
import { getAllPresets, savePreset, deletePreset } from '../storage/presetDb'

export default function usePresets() {
  const [presets, setPresets] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllPresets()
    setPresets(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (preset) => {
    await savePreset(preset)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id) => {
    await deletePreset(id)
    await refresh()
  }, [refresh])

  return { presets, save, remove }
}
