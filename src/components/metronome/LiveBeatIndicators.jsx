import { useSyncExternalStore } from 'react'
import BeatIndicators from './BeatIndicators'

export default function LiveBeatIndicators({ visualStore, ...props }) {
  const beat = useSyncExternalStore(visualStore.subscribeBeat, visualStore.getBeat)
  return <BeatIndicators {...props} {...beat} />
}
