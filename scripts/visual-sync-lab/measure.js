import BrowserAudioEngine from '../../src/audio/BrowserAudioEngine.js'
import { saveSettings } from '../../src/storage/settingsStorage.js'

// Runs on a dedicated test origin. Production files are imported unchanged.
saveSettings({ bpm: 137, volume: .1, soundIndex: 0, subdivision: 1,
  flashOnOne: true, flashSubdivisions: !new URLSearchParams(location.search).has('downbeat-only') })
const query = new URLSearchParams(location.search)
const label = query.get('label') || 'visual-sync'
const stress = query.has('stress'), duration = 30
const beats = [], flashes = [], frames = [], stalls = [], visibility = [], errors = []
let engine, started, completed = false, finishing = false, raf, timer, stressTimer, probe, latest
const status = document.querySelector('#lab-status')
window.addEventListener('error', e => errors.push(String(e.message)))
window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)))
document.addEventListener('visibilitychange', () => visibility.push({time:performance.now(),state:document.visibilityState}))
function outputTime(time) {
  const stamp = engine.ctx.getOutputTimestamp?.()
  if (!stamp || !(stamp.contextTime > 0) || !(stamp.performanceTime > 0)) return null
  return stamp.performanceTime + (time - stamp.contextTime) * 1000
}
const onBeat = BrowserAudioEngine.prototype.onBeat
BrowserAudioEngine.prototype.onBeat = function(callback, batch) {
  engine = this
  return onBeat.call(this, event => {
    latest = { ...event, received: performance.now(), receivedContextTime: this.ctx.currentTime,
      estimatedOutputAtReceipt: outputTime(event.time) }
    beats.push(latest)
    callback(event)
  }, run => {
    if (batch) batch(run)
    else run()
    // New visual scheduling commits React inside an animation-frame callback.
    // Observe that same frame after the real batching function returns, rather
    // than artificially adding another frame through the continuous sampler.
    inspectFrame(false)
  })
}
const prepare = BrowserAudioEngine.prototype._preparePlayback
BrowserAudioEngine.prototype._preparePlayback = async function(generation) {
  if (!probe) {
    await this.ctx.audioWorklet.addModule(new URL('../timing-lab/observe-worklet.js', import.meta.url))
    probe = new AudioWorkletNode(this.ctx, 'observe-clicks')
    probe.port.onmessage = ({data}) => frames.push(data.frame)
    this._gainNode.connect(probe); probe.connect(this.ctx.destination)
  }
  await prepare.call(this, generation)
}
const animate = Element.prototype.animate
Element.prototype.animate = function(...args) {
  const animation = animate.apply(this, args)
  if (this.classList.contains('pulse-downbeat-flash') && latest) {
    flashes.push({time:latest.time, initiated:performance.now(), beat:latest.beat})
  }
  return animation
}
function inspectFrame(reschedule = true) {
  if (finishing) return
  const now = performance.now()
  const surface = document.querySelector('.pulse-orbit-segment-surface.is-active')
  if (latest && surface && Number(surface.closest('[data-beat]')?.dataset.beat) === latest.beat) {
    const opacity = Number(getComputedStyle(surface).opacity)
    if (latest.firstFrame === undefined) {
      latest.firstFrame = now
      latest.estimatedOutputAtFrame = outputTime(latest.time)
      latest.firstFrameOpacity = opacity
      latest.transition = getComputedStyle(surface).transition
    }
    if (opacity >= .999 && latest.fullOpacityFrame === undefined) latest.fullOpacityFrame = now
  }
  const flash = flashes.at(-1), overlay = document.querySelector('.pulse-downbeat-flash')
  if (flash && flash.firstFrame === undefined && overlay && Number(getComputedStyle(overlay).opacity) > 0) {
    flash.firstFrame = now
    flash.estimatedOutputAtFrame = outputTime(flash.time)
  }
  if (reschedule !== false) raf = requestAnimationFrame(inspectFrame)
}
const stats = values => {
  const sorted = values.filter(Number.isFinite).sort((a,b)=>a-b)
  return sorted.length ? {count:sorted.length,min:sorted[0],median:sorted[Math.floor(sorted.length/2)],
    p95:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)],max:sorted.at(-1)} : null
}
function summarize() {
  const measured = beats.slice(2) // allow output timestamps to settle after startup
  const phase = frames.map((f,i) => ((f-frames[0])/engine.ctx.sampleRate - i*60/137)*1000)
  return {label, userAgent:navigator.userAgent, durationSeconds:duration, completed,
    backend:engine.timingBackend, sampleRate:engine.ctx.sampleRate,
    baseLatency:engine.ctx.baseLatency, outputLatency:engine.ctx.outputLatency,
    receivedBeats:beats.length, renderedClicks:frames.length,
    expectedClicks:Math.ceil(duration*137/60), maxAudioPhaseErrorMs:Math.max(...phase.map(Math.abs)),
    missedOrbitFrames:measured.filter(b=>b.firstFrame===undefined).length,
    skippedLateVisuals:measured.filter(b=>b.visualLate).length,
    flashAnimations:flashes.length,
    flashBeats:flashes.map(b=>b.beat),
    orbitFrameMinusCallbackMs:stats(measured.map(b=>b.firstFrame-b.received)),
    callbackMinusEstimatedOutputMs:stats(measured.filter(b=>b.estimatedOutputAtReceipt!==null).map(b=>b.received-b.estimatedOutputAtReceipt)),
    orbitFrameMinusEstimatedOutputMs:stats(measured.filter(b=>b.estimatedOutputAtFrame!=null).map(b=>b.firstFrame-b.estimatedOutputAtFrame)),
    orbitFullOpacityMinusFirstFrameMs:stats(measured.map(b=>b.fullOpacityFrame-b.firstFrame)),
    flashFrameMinusEstimatedOutputMs:stats(flashes.slice(2).filter(b=>b.estimatedOutputAtFrame!=null).map(b=>b.firstFrame-b.estimatedOutputAtFrame)),
    cssTransition:beats.find(b=>b.transition)?.transition, stalls:stalls.length,visibility,errors,
    caveat:'Frame callback observes DOM/style before paint; output timestamp is a browser estimate. Not a measurement of display photons or physical audio.'}
}
async function finish(natural) {
  if (finishing) return
  finishing = true; completed = natural
  clearInterval(timer); clearInterval(stressTimer); cancelAnimationFrame(raf)
  // Give observer messages already in transit a chance to arrive; no new audio
  // starts during this bounded flush because stop disconnects the renderer.
  engine.stop()
  await new Promise(resolve => setTimeout(resolve, 100))
  const result = {summary:summarize(),beats,flashes,renderedFrames:frames,stalls}
  document.querySelector('#lab-results').textContent = JSON.stringify(result.summary,null,2)
  const response = await fetch('/__results', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)})
  status.textContent = `${completed?'Complete':'Cancelled'}; evidence ${response.ok?'saved':'NOT saved'}`
}
const onStateChange = BrowserAudioEngine.prototype.onStateChange
BrowserAudioEngine.prototype.onStateChange = function(callback) {
  return onStateChange.call(this, playing => {
    callback(playing)
    if (playing && !started) {
      started = performance.now(); raf = requestAnimationFrame(inspectFrame)
      timer = setInterval(() => {
        // A newly opened output device can take time to start advancing the
        // audio clock. Count the measured window from the first audio beat,
        // not from the Play callback on the main thread.
        const elapsed = beats.length ? this.ctx.currentTime - beats[0].time : 0
        status.textContent = `Running ${elapsed.toFixed(1)}/${duration}s; ${beats.length} beat events`
        if(elapsed >= duration) finish(true)
      }, 50)
      if(stress) stressTimer = setInterval(() => {
        const begin=performance.now(); while(performance.now()-begin<200){}
        stalls.push({start:begin,duration:performance.now()-begin})
      }, 2000)
    } else if (!playing && started && !finishing) finish(false)
  })
}
import('../../src/main.jsx')
