import { useEffect, useRef } from 'react'
import { saveSession } from '../storage/presetDb'

const MIN_DURATION_MS = 3000

export default function useSessionTracker({
  isPlaying,
  bpm,
  subdivision,
  activeEntryIdRef,
  onSessionSaved,
}) {
  const sessionRef = useRef(null)
  const bpmRef = useRef(bpm)
  const subRef = useRef(subdivision)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { subRef.current = subdivision }, [subdivision])

  useEffect(() => {
    if (isPlaying && !sessionRef.current) {
      const now = Date.now()
      sessionRef.current = {
        startedAt: now,
        bpmSamples: [{ t: now, bpm: bpmRef.current }],
        subdivisionSamples: [{ t: now, subdivision: subRef.current }],
      }
    } else if (!isPlaying && sessionRef.current) {
      const snapshot = sessionRef.current
      sessionRef.current = null
      const endedAt = Date.now()
      const durationMs = endedAt - snapshot.startedAt
      if (durationMs < MIN_DURATION_MS) return
      saveSession({
        startedAt: snapshot.startedAt,
        endedAt,
        durationMs,
        bpmSamples: snapshot.bpmSamples,
        subdivisionSamples: snapshot.subdivisionSamples,
        practiceEntryId: activeEntryIdRef?.current ?? null,
      }).then(() => {
        if (onSessionSaved) onSessionSaved()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.bpmSamples.push({ t: Date.now(), bpm })
    }
  }, [bpm])

  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.subdivisionSamples.push({ t: Date.now(), subdivision })
    }
  }, [subdivision])
}
