import TimeSignature from './TimeSignature.jsx'
import { METER_PRESETS, normalizeMeter } from '../../audio/meter.js'

export default function MeterPicker({ meter, onChange, children }) {
  const key = `${meter.numerator}/${meter.denominator}`
  const options = meter.denominator === 8 && meter.numerator === 7 ? [[2, 2, 3], [2, 3, 2], [3, 2, 2]] : meter.denominator === 8 && meter.numerator === 5 ? [[2, 3], [3, 2]] : []
  return <div className="pulse-meter-controls">
    <div className="pulse-rhythm-pickers">
      <label className="pulse-meter-select-label"><span>Meter</span><div className="pulse-meter-select">
        <TimeSignature {...meter} /><span aria-hidden="true">⌄</span>
        <select aria-label="Time signature" value={key} onChange={event => {
          const [numerator, denominator] = event.target.value.split('/').map(Number)
          onChange(normalizeMeter({ numerator, denominator }))
        }}>
          {METER_PRESETS.map(item => <option key={`${item.numerator}/${item.denominator}`} value={`${item.numerator}/${item.denominator}`}>{item.numerator}/{item.denominator}</option>)}
          {!METER_PRESETS.some(item => `${item.numerator}/${item.denominator}` === key) && <option value={key}>{key}</option>}
        </select>
      </div></label>
      {children}
    </div>
    {options.length > 0 && <div className="pulse-meter-grouping" role="group" aria-label="Eighth-note grouping">{options.map(groups => <button key={groups.join()} type="button" aria-pressed={groups.join() === meter.groups.join()} onClick={() => onChange({ ...meter, groups })}>{groups.join(' + ')}</button>)}</div>}
  </div>
}
