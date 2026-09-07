import AudioRenderTimeline from './AudioRenderTimeline.js'

class MetronomeProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.events = []
    this.timeline = new AudioRenderTimeline(sampleRate, event => this.events.push(event))
    this.closed = false
    this.generation = 0
    this.port.onmessage = ({ data }) => {
      if (data.type === 'start') {
        this.started = true
        this.generation = data.generation
        this.timeline.ctx.currentTime = currentFrame / sampleRate
        this.timeline.begin(data.settings, data.bank, Math.max(data.startTime, currentFrame / sampleRate))
      } else if (data.type === 'stop') {
        this.timeline.stop(); this.closed = true
      } else if (data.type === 'command') {
        this.timeline.command(data.method, data.args, data.revision)
      } else if (data.type === 'bank') {
        this.timeline.setBank(data.bank)
      }
    }
  }

  process(inputs, outputs) {
    this.timeline.render(currentFrame, outputs[0])
    if (this.events.length) {
      this.port.postMessage({ generation: this.generation, events: this.events })
      this.events = []
    }
    return !this.closed && (!this.started || this.timeline.isPlaying)
  }
}

registerProcessor('metronome-renderer', MetronomeProcessor)
