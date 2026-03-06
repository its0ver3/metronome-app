import { ACCENT_WEDGES } from '../../audio/constants'

const WEDGE_ANGLES = [
  // Each wedge: [startAngle, endAngle] in degrees, clockwise from 12 o'clock
  [-90, 30],    // top-right
  [30, 150],    // bottom
  [150, 270],   // top-left
]

function polarToCart(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function wedgePath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polarToCart(cx, cy, r, startDeg)
  const [x2, y2] = polarToCart(cx, cy, r, endDeg)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

export default function AccentPie({
  level = 'ON',
  size = 20,
  isActive = false,
  isDownbeat = false,
  inGap = false,
  fillColor,
  activeRingClass = 'ring-primary',
  onClick,
}) {
  const filledCount = ACCENT_WEDGES[level] ?? 0
  const cx = 10
  const cy = 10
  const r = 9
  const gap = 0.8

  const wrapper = onClick ? 'button' : 'span'
  const Wrapper = wrapper

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-100 ${
        isDownbeat ? 'ring-1 ring-dark/20' : ''
      } ${
        isActive
          ? inGap
            ? 'ring-2 ring-dark/20 ring-offset-2 opacity-40'
            : `ring-2 ${activeRingClass} ring-offset-2 scale-125`
          : ''
      }`}
      style={{ width: size, height: size }}
      {...(onClick ? { title: `${level}` } : {})}
    >
      <svg
        viewBox="0 0 20 20"
        width={size * 0.85}
        height={size * 0.85}
        className="block"
      >
        {WEDGE_ANGLES.map(([start, end], i) => {
          const filled = i < filledCount
          return (
            <path
              key={i}
              d={wedgePath(cx, cy, r, start + gap, end - gap)}
              fill={filled ? (fillColor || 'var(--color-primary)') : 'transparent'}
              stroke={filled ? 'none' : (fillColor || 'var(--color-primary)')}
              strokeWidth={filled ? 0 : 0.8}
              opacity={filled ? 1 : 0.3}
            />
          )
        })}
      </svg>
    </Wrapper>
  )
}
