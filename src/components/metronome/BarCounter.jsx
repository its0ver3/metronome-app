export default function BarCounter({ currentBeat, beatsPerBar, currentBar, isPlaying }) {
  if (!isPlaying) {
    return <div className="text-sm text-dark/40 text-center h-5">Ready</div>
  }

  return (
    <div className="text-sm text-dark/50 text-center">
      Beat {currentBeat + 1} of {beatsPerBar} &nbsp;|&nbsp; Bar {currentBar}
    </div>
  )
}
