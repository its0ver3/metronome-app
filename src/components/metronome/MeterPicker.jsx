import { useId, useRef, useState } from 'react'
import TimeSignature from './TimeSignature.jsx'
import { METER_PRESETS, defaultMeterGroups, normalizeMeter, parseCustomMeter } from '../../audio/meter.js'

export function CustomMeterEditor({ meter, onApply, onCancel }) {
  const [numerator, setNumerator] = useState(String(meter.numerator))
  const [denominator, setDenominator] = useState(meter.denominator)
  const [grouping, setGrouping] = useState(meter.groups.join('+'))
  const id = useId()
  const result = parseCustomMeter(numerator, denominator, grouping)
  const changeSignature = (n, d) => {
    setNumerator(n)
    setDenominator(d)
    // Replace only the automatic grouping. Preserve a musician's edited pattern.
    if (Number.isInteger(Number(numerator)) && Number(numerator) >= 1 && Number(numerator) <= 16 && grouping === defaultMeterGroups(Number(numerator), denominator).join('+') && Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 16) {
      setGrouping(defaultMeterGroups(Number(n), d).join('+'))
    }
  }
  return <form className="pulse-custom-meter" aria-label="Custom meter" onSubmit={event => {
    event.preventDefault()
    if (result.meter) onApply({ ...result.meter, groupOnly: meter.groupOnly })
  }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel() }
  }}>
    <div className="pulse-custom-meter-fields">
      <label>Beats<input autoFocus type="number" min="1" max="16" step="1" value={numerator} onChange={event => changeSignature(event.target.value, denominator)} /></label>
      <label>Note value<select value={denominator} onChange={event => changeSignature(numerator, Number(event.target.value))}>
        <option value="2">Half · /2</option><option value="4">Quarter · /4</option><option value="8">Eighth · /8</option><option value="16">Sixteenth · /16</option>
      </select></label>
    </div>
    <label>Grouping<input type="text" value={grouping} placeholder="4+4+4+3" maxLength="63" aria-describedby={`${id}-help ${id}-error`} aria-invalid={Boolean(result.error)} onChange={event => setGrouping(event.target.value)} /></label>
    <p id={`${id}-help`}>Separate groups with +. The total must match the beats.</p>
    <p id={`${id}-error`} className="pulse-custom-meter-error" aria-live="polite">{result.error || `${numerator}/${denominator} · ${grouping.split('+').join(' + ')}`}</p>
    <div className="pulse-custom-meter-actions"><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={Boolean(result.error)}>Apply meter</button></div>
  </form>
}

export default function MeterPicker({ meter, onChange, children }) {
  const [editing, setEditing] = useState(false)
  const select = useRef(null)
  const key = `${meter.numerator}/${meter.denominator}`
  const options = meter.denominator >= 8 && meter.numerator === 7 ? [[2, 2, 3], [2, 3, 2], [3, 2, 2]] : meter.denominator >= 8 && meter.numerator === 5 ? [[2, 3], [3, 2]] : []
  const finish = () => { setEditing(false); select.current?.focus({ preventScroll: true }) }
  return <div className="pulse-meter-controls">
    <div className="pulse-rhythm-pickers">
      <label className="pulse-meter-select-label"><span>Meter</span><div className="pulse-meter-select">
        <TimeSignature {...meter} /><span aria-hidden="true">⌄</span>
        <select ref={select} aria-label="Time signature" value={editing ? 'custom' : key} onChange={event => {
          if (event.target.value === 'custom') { setEditing(true); return }
          const [numerator, denominator] = event.target.value.split('/').map(Number)
          setEditing(false)
          onChange(normalizeMeter({ numerator, denominator }))
        }}>
          {METER_PRESETS.map(item => <option key={`${item.numerator}/${item.denominator}`} value={`${item.numerator}/${item.denominator}`}>{item.numerator}/{item.denominator}</option>)}
          {!METER_PRESETS.some(item => `${item.numerator}/${item.denominator}` === key) && <option value={key}>{key}</option>}
          <option value="custom">Custom…</option>
        </select>
      </div></label>
      {children}
    </div>
    {editing ? <CustomMeterEditor key={`${key}:${meter.groups.join()}`} meter={meter} onCancel={finish} onApply={next => { onChange(next); finish() }} /> : <>
      {options.length > 0 && <div className="pulse-meter-grouping" role="group" aria-label="Beat grouping">{options.map(groups => <button key={groups.join()} type="button" aria-pressed={groups.join() === meter.groups.join()} onClick={() => onChange({ ...meter, groups })}>{groups.join(' + ')}</button>)}</div>}
      {!METER_PRESETS.some(item => `${item.numerator}/${item.denominator}` === key && item.groups.join() === meter.groups.join()) && <button className="pulse-custom-meter-edit" type="button" onClick={() => setEditing(true)}>Edit grouping · {meter.groups.join(' + ')}</button>}
    </>}
  </div>
}
