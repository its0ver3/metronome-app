import './meterControls.css'
export default function TimeSignature({ numerator = 4, denominator = 4 }) {
  return <span className="pulse-time-signature" aria-hidden="true"><span>{numerator}</span><span>{denominator}</span></span>
}
