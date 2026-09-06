import { formatSessionTime } from '../../audio/sessionSettings'
import './sessionStatus.css'

export default function SessionStatus({ session }) {
  if (!session || (!session.countInBars && session.mode === 'off')) return null
  const counting = session.phase === 'count-in'
  const running = session.phase === 'playing'
  const complete = session.phase === 'complete'
  return <div className="pulse-session-pills" aria-label="Count-in and timer status">
    {counting ? <span className="pulse-session-pill">
      <span>Count-in</span><strong>{session.countInBeat || '…'}</strong>
      <span>Bar {session.countInBar}/{session.countInBars}</span>
    </span> : session.countInBars > 0 && !running && !complete && <span className="pulse-session-pill">
      <span>Count-in</span><strong>{session.countInBars} {session.countInBars === 1 ? 'bar' : 'bars'}</strong>
    </span>}
    {session.mode !== 'off' && <span className="pulse-session-pill">
      <span>{complete ? 'Complete' : 'Playback timer'}</span>
      <strong>{session.mode === 'minutes' ? formatSessionTime(session.remainingSeconds)
        : `${session.remainingBars} ${session.remainingBars === 1 ? 'bar' : 'bars'}`}</strong>
      {!complete && <span>{running ? 'left' : counting ? 'after count-in' : 'ready'}</span>}
    </span>}
  </div>
}
