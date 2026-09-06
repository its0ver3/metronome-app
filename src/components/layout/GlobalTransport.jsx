import PolyrhythmOrbit, { StandardRhythmOrbit } from '../metronome/PolyrhythmOrbit'
import { getTempoColor } from '../metronome/tempoHeat'
import { MIN_BPM, MAX_BPM, clampBpm } from '../../audio/constants'
import { TEMPO_UNITS } from '../../audio/meter.js'
import SessionStatus from '../metronome/SessionStatus'

export default function GlobalTransport({
  bpm, maxBpm = MAX_BPM, isPlaying, beatsPerBar, subdivision, subdivisionAccents, currentBeat,
  polyrhythmMode, polyRhythm1, polyRhythm2, polyBeat1, polyBeat2, polyAccents1, polyAccents2,
  tempoEnabled, onToggle, onBpmChange, onOpenMetronome,
  collapsed = false, onCollapsedChange,
  meter,
  session,
}) {
  const tempoLocked = tempoEnabled && !polyrhythmMode
  const nudge = (delta) => {
    if (!tempoLocked) onBpmChange(clampBpm(bpm + delta, maxBpm))
  }

  return (
    <aside className={`pulse-global-dock ${collapsed ? 'is-collapsed' : ''}`} aria-label="Playback controls" style={{ '--tempo-heat-color': getTempoColor(bpm, maxBpm) }}>
      <button type="button" className="pulse-global-handle"
        aria-label={collapsed ? 'Show mini metronome' : 'Hide mini metronome'}
        title={collapsed ? 'Show mini metronome' : 'Hide mini metronome'}
        aria-expanded={!collapsed} aria-controls="mini-metronome-panel"
        onClick={() => onCollapsedChange?.(!collapsed)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="mini-metronome-panel" className="pulse-global-reveal" aria-hidden={collapsed} inert={collapsed ? true : undefined}>
        <div className="pulse-global-clip">
          <SessionStatus session={session} />
          <div className="pulse-global-transport">
      <button type="button" onClick={onOpenMetronome} className="pulse-global-orbit" aria-label={`Open Metronome, ${bpm} BPM${meter && !polyrhythmMode ? `, ${TEMPO_UNITS[meter.tempoUnit].name}, ${meter.numerator}/${meter.denominator}` : ''}`}>
        {polyrhythmMode ? (
          <PolyrhythmOrbit rhythm1={polyRhythm1} rhythm2={polyRhythm2}
            activeBeat1={polyBeat1} activeBeat2={polyBeat2} isPlaying={isPlaying}
            accents1={polyAccents1} accents2={polyAccents2} interactive={false} />
        ) : (
          <StandardRhythmOrbit beatCount={beatsPerBar} subdivision={subdivision} meter={meter}
            accents={subdivisionAccents} activeBeat={currentBeat} isPlaying={isPlaying} interactive={false} />
        )}
        <span aria-hidden="true">{bpm}</span>
      </button>
      <div className="pulse-global-controls">
        <button type="button" className="pulse-global-nudge" aria-label="Decrease tempo by 1 BPM"
          title={tempoLocked ? 'Tempo is controlled by Tempo Trainer' : 'Decrease tempo'}
          disabled={tempoLocked || bpm <= MIN_BPM} onClick={() => nudge(-1)}>−</button>
        <button type="button" onClick={onToggle} className="pulse-global-play"
          aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'} aria-pressed={isPlaying}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button type="button" className="pulse-global-nudge" aria-label="Increase tempo by 1 BPM"
          title={tempoLocked ? 'Tempo is controlled by Tempo Trainer' : 'Increase tempo'}
          disabled={tempoLocked || bpm >= maxBpm} onClick={() => nudge(1)}>+</button>
      </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
