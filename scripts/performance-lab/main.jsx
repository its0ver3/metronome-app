import React, { Profiler } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../../src/App'
import '../../src/index.css'
import BrowserAudioEngine from '../../src/audio/BrowserAudioEngine'
import VisualTimeline from '../../src/audio/VisualTimeline'
import { saveSettings } from '../../src/storage/settingsStorage'

// Dedicated loopback origin only: never run this page at the real app origin.
const params = new URLSearchParams(location.search)
const bpm = Number(params.get('bpm') || 120)
const subdivision = Number(params.get('subdivision') || 1)
saveSettings({ bpm, subdivision, soundIndex: Number(params.get('sound') || 0), volume: 0,
  pumpTheJam: bpm > 300, gapEnabled: false, tempoEnabled: false,
  subdivTrainerEnabled: false, flashOnOne: false })

let recording = false, counts = {}, commits = [], batches = [], frames = [], longTasks = [], startup = []
let engine, previousFrame
const summary = values => {
  const sorted = [...values].sort((a, b) => a - b)
  return { count: values.length, total: +values.reduce((a,b) => a+b, 0).toFixed(2),
    p50: sorted[Math.floor(sorted.length * .5)] ?? null,
    p95: sorted[Math.floor(sorted.length * .95)] ?? null, max: sorted.at(-1) ?? null }
}
globalThis.__auditCount = name => { if (recording) counts[name] = (counts[name] || 0) + 1 }
const listen = VisualTimeline.prototype.listen
VisualTimeline.prototype.listen = function(callback, batch) {
  return listen.call(this, callback, run => {
    const started = performance.now()
    batch(run)
    if (recording) batches.push(performance.now() - started)
  })
}
const start = BrowserAudioEngine.prototype.start
BrowserAudioEngine.prototype.start = async function(...args) {
  engine = this
  const t = performance.now()
  try { return await start.apply(this, args) }
  finally { startup.push({ ms: performance.now() - t, backend: this.timingBackend, playing: this.isPlaying }) }
}
try { new PerformanceObserver(list => {
  if (recording) longTasks.push(...list.getEntries().map(e => e.duration))
}).observe({ type: 'longtask', buffered: false }) } catch { /* unsupported browser */ }
function frame(t) {
  if (!recording) return
  if (previousFrame !== undefined) frames.push(t - previousFrame)
  previousFrame = t
  requestAnimationFrame(frame)
}
document.querySelector('#capture').onclick = () => {
  if (recording) return
  counts = {}; commits = []; batches = []; frames = []; longTasks = []; previousFrame = undefined
  recording = true
  document.querySelector('#result').textContent = 'Recording…'
  const startTime = performance.now()
  requestAnimationFrame(frame)
  setTimeout(() => {
    recording = false
    const result = {
      userAgent: navigator.userAgent, visibility: document.visibilityState,
      viewport: [innerWidth, innerHeight], label: `${params.get('label') || 'audit'}-${document.querySelector('.pulse-training-screen') ? 'training' : document.querySelector('.pulse-settings-screen') ? 'settings' : 'metronome'}`, bpm, subdivision,
      elapsedMs: performance.now() - startTime, backend: engine?.timingBackend,
      playing: engine?.isPlaying, counts, commitMs: summary(commits), visualBatchMs: summary(batches),
      frameIntervalMs: summary(frames), framesOver25ms: frames.filter(t => t > 25).length,
      longTaskMs: summary(longTasks), startup, domElements: document.querySelectorAll('*').length,
      resources: performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration,
        bytes: e.encodedBodySize, transfer: e.transferSize })),
    }
    document.querySelector('#result').textContent = JSON.stringify(result, null, 2)
    fetch('/audit-result', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result) }).catch(() => {})
  }, 10000)
}
createRoot(document.getElementById('root')).render(
  <Profiler id="app" onRender={(_id, _phase, duration) => { if (recording) commits.push(duration) }}><App /></Profiler>,
)
