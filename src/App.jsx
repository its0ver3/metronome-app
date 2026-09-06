import { useCallback, useState } from 'react'
import PhoneFrame from './components/layout/PhoneFrame'
import AppShell from './components/layout/AppShell'

export default function App() {
  const [kitOpen, setKitOpen] = useState(false)
  const toggleKit = useCallback(() => setKitOpen(open => !open), [])
  const closeKit = useCallback(() => setKitOpen(false), [])

  return (
    <PhoneFrame kitOpen={kitOpen} onKitToggle={toggleKit}>
      <AppShell kitOpen={kitOpen} onExitKit={closeKit} />
    </PhoneFrame>
  )
}
