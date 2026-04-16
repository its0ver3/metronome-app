import { normalizeGroove, GROOVE_VERSION } from '../groove/grooveModel'

const KEY = 'drums-only-metronome-groove'

export function saveGroove(state) {
  try {
    const payload = {
      version: GROOVE_VERSION,
      pattern: state.pattern,
      swingPercent: state.swingPercent ?? 0,
      countInBars: state.countInBars ?? 0,
      showToms: state.showToms ?? false,
    }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // storage quota / privacy mode — ignore
  }
}

export function loadGroove() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      pattern: normalizeGroove(parsed.pattern),
      swingPercent: Number.isFinite(parsed.swingPercent) ? parsed.swingPercent : 0,
      countInBars: Number.isFinite(parsed.countInBars) ? parsed.countInBars : 0,
      showToms: !!parsed.showToms,
    }
  } catch {
    return null
  }
}
