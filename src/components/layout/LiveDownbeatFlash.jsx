import { useSyncExternalStore } from 'react'
import DownbeatFlash from './DownbeatFlash'

const noSubscription = () => () => {}
export default function LiveDownbeatFlash({ visualStore, enabled, ...props }) {
  const pulse = useSyncExternalStore(enabled ? visualStore.subscribeFlash : noSubscription, visualStore.getPulse)
  return <DownbeatFlash {...props} enabled={enabled} pulse={pulse} />
}
