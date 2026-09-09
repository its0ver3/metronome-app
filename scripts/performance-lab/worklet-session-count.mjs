import AudioEngine from '../../src/audio/AudioEngine.js'
import AudioRenderTimeline from '../../src/audio/AudioRenderTimeline.js'

// Accelerated call-count probe, not an audio timing or CPU benchmark.
const sampleRate = 48000, seconds = 10
const pcm = { channels: [new Float32Array([1, 0])], length: 2, sampleRate }
const bank = Array.from({ length: 9 }, (_, i) => ({ id: `probe-${i}`, kind: 'synth',
  soft: [pcm], main: [pcm], accent: [pcm] }))
const source = new AudioEngine()
const engine = new AudioRenderTimeline(sampleRate)
let publications = 0, notifications = 0
engine.begin(source.getState(), bank, .05)
const publish = engine._publishSession
engine._publishSession = function() { publications++; return publish.call(this) }
engine.onSessionChange(() => notifications++)
const output = [new Float32Array(128), new Float32Array(128)]
for (let frame = 0; frame < seconds * sampleRate; frame += 128) {
  output.forEach(channel => channel.fill(0))
  engine.render(frame, output)
}
console.log(JSON.stringify({ seconds, sampleRate, quantumFrames: 128,
  timerMode: source.sessionSettings.mode, sessionSnapshots: publications,
  changedSessionNotifications: notifications }, null, 2))
