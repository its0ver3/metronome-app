// Selected from the trainer-card study: Gap C, Tempo A, Subdivision A.
// Original 24-unit pictograms; the card title provides their accessible name.
export default function TrainerIcon({ type }) {
  return (
    <svg
      className="pulse-trainer-pictogram"
      viewBox="0 0 24 24"
      fill="none"
      stroke={type === 'gap' ? 'currentColor' : 'none'}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {type === 'gap' && (
        <>
          <path d="M12 3a9 9 0 1 0 9 9" />
          <circle cx="16.5" cy="4.2" r="1" fill="currentColor" stroke="none" />
          <circle cx="19.8" cy="7.5" r="1" fill="currentColor" stroke="none" />
          <path d="M8 12h2l1-3 2 6 1-3h2" />
        </>
      )}
      {type === 'tempo' && (
        <>
          <ellipse cx="6" cy="17.5" rx="3" ry="2.25" fill="currentColor" transform="rotate(-18 6 17.5)" />
          <path d="M8.5 17V4.5L12 7" stroke="currentColor" />
          <path d="M18 19V7M14.75 10.25 18 7l3.25 3.25" stroke="currentColor" />
        </>
      )}
      {type === 'subdivision' && (
        <>
          <rect x="3" y="4" width="18" height="3" rx="0.65" fill="currentColor" />
          <rect x="3" y="10.5" width="8" height="3" rx="0.65" fill="currentColor" />
          <rect x="13" y="10.5" width="8" height="3" rx="0.65" fill="currentColor" />
          {[3, 8, 13, 18].map((x) => (
            <rect key={x} x={x} y="17" width="3" height="3" rx="0.65" fill="currentColor" />
          ))}
        </>
      )}
    </svg>
  )
}
