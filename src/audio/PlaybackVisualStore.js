import { nextFlashPulse } from '../components/layout/flashPulse.js'

// Only mounted visual consumers subscribe to frame-rate data. Configuration
// screens and the app shell do not need subdivision or flash notifications.
export default class PlaybackVisualStore {
  constructor() {
    this.beat = { currentBeat: -1, currentSubdivision: -1 }
    this.pulse = null
    this.beatListeners = new Set()
    this.flashListeners = new Set()
  }
  getBeat = () => this.beat
  getPulse = () => this.pulse
  subscribeBeat = listener => { this.beatListeners.add(listener); return () => this.beatListeners.delete(listener) }
  subscribeFlash = listener => { this.flashListeners.add(listener); return () => this.flashListeners.delete(listener) }
  present(event) {
    if (!event.rhythm) {
      const currentBeat = event.visualLate ? -1 : event.beat
      const currentSubdivision = event.visualLate ? -1 : event.displaySubdivision ?? event.subdivision
      if (currentBeat !== this.beat.currentBeat || currentSubdivision !== this.beat.currentSubdivision) {
        this.beat = { currentBeat, currentSubdivision }
        this.beatListeners.forEach(listener => listener())
      }
    }
    if (this.flashListeners.size) {
      const next = nextFlashPulse(this.pulse, event)
      if (next !== this.pulse) {
        this.pulse = next
        this.flashListeners.forEach(listener => listener())
      }
    }
  }
  clear() {
    this.beat = { currentBeat: -1, currentSubdivision: -1 }
    this.pulse = null
    this.beatListeners.forEach(listener => listener())
    this.flashListeners.forEach(listener => listener())
  }
}
