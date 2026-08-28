const CENTER = 50

function toRadians(angle) {
  return angle * Math.PI / 180
}

function clampOffset(offset, radius) {
  const limit = Math.max(0, radius - 0.001)
  return Math.max(-limit, Math.min(limit, offset))
}

export function getParallelCutPoint(angle, radius, tangentOffset) {
  const radians = toRadians(angle)
  const offset = clampOffset(tangentOffset, radius)
  const radialDistance = Math.sqrt(radius ** 2 - offset ** 2)
  const radialX = Math.cos(radians)
  const radialY = Math.sin(radians)
  const tangentX = -radialY
  const tangentY = radialX

  return {
    x: CENTER + radialDistance * radialX + offset * tangentX,
    y: CENTER + radialDistance * radialY + offset * tangentY,
  }
}

export function getGapDistance(gapAngle, radius) {
  return radius * Math.sin(toRadians(gapAngle / 2))
}

export function parallelArcPath(startAngle, endAngle, gapDistance, radius) {
  const start = getParallelCutPoint(startAngle, radius, gapDistance)
  const end = getParallelCutPoint(endAngle, radius, -gapDistance)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    'M', start.x.toFixed(3), start.y.toFixed(3),
    'A', radius, radius, 0, largeArc, 1, end.x.toFixed(3), end.y.toFixed(3),
  ].join(' ')
}

export function parallelSegmentPath(
  startAngle,
  endAngle,
  gapDistance,
  outerRadius,
  innerRadius,
) {
  const outerStart = getParallelCutPoint(startAngle, outerRadius, gapDistance)
  const outerEnd = getParallelCutPoint(endAngle, outerRadius, -gapDistance)
  const innerEnd = getParallelCutPoint(endAngle, innerRadius, -gapDistance)
  const innerStart = getParallelCutPoint(startAngle, innerRadius, gapDistance)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    'M', outerStart.x.toFixed(3), outerStart.y.toFixed(3),
    'A', outerRadius, outerRadius, 0, largeArc, 1, outerEnd.x.toFixed(3), outerEnd.y.toFixed(3),
    'L', innerEnd.x.toFixed(3), innerEnd.y.toFixed(3),
    'A', innerRadius, innerRadius, 0, largeArc, 0, innerStart.x.toFixed(3), innerStart.y.toFixed(3),
    'Z',
  ].join(' ')
}
