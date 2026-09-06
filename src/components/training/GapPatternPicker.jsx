import SubdivisionDropdown from '../metronome/SubdivisionDropdown'
import GapPatternNotation from './GapPatternNotation'
import { GAP_PATTERNS, getGapPatternLabel, getGapPatternDescription } from '../../audio/gapPatterns'
import './gapPattern.css'

export default function GapPatternPicker({ value, denominator = 4, disabled, onChange }) {
  return <SubdivisionDropdown value={value} onChange={onChange} disabled={disabled}
    label="Gap pattern" denominator={denominator}
    options={GAP_PATTERNS.map(({ id }) => ({ type: id, description: getGapPatternDescription(id, denominator) }))}
    getOptionLabel={id => getGapPatternLabel(id, denominator)}
    renderNotation={id => <GapPatternNotation pattern={id} denominator={denominator} />}
    className="pulse-gap-pattern-picker" menuClassName="pulse-gap-pattern-menu" menuWidth={288}
  />
}
