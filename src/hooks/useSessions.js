import { useState, useEffect, useCallback } from 'react'
import { getAllSessions } from '../storage/presetDb'

export default function useSessions() {
  const [sessions, setSessions] = useState([])

  const refresh = useCallback(async () => {
    const all = await getAllSessions()
    setSessions(all)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { sessions, refresh }
}
