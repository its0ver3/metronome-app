class ObserveClicks extends AudioWorkletProcessor {
  constructor() { super(); this.last = -Infinity }
  process(inputs) {
    const data = inputs[0]?.[0]
    if (data) for (let i = 0; i < data.length; i++) {
      const frame = currentFrame + i
      if (Math.abs(data[i]) > 0.0001 && frame - this.last > sampleRate * .2) {
        this.last = frame
        this.port.postMessage({ frame, sampleRate })
      }
    }
    // A silent observation branch; normal engine output is unchanged.
    return true
  }
}
registerProcessor('observe-clicks', ObserveClicks)
