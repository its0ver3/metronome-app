export function getTempoThumbTilt(previousBpm, nextBpm) {
  if (nextBpm === previousBpm) return 0
  return nextBpm > previousBpm ? 3.5 : -3.5
}
