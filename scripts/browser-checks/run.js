import BrowserAudioEngine from '../../src/audio/BrowserAudioEngine.js'
import { SOUND_OPTIONS } from '../../src/audio/constants.js'
import observerUrl from '../timing-lab/observe-worklet.js?worker&url'

const engine = new BrowserAudioEngine()
engine.setVolume(.08)
const status = document.querySelector('#status'), run = document.querySelector('#run')
const recover = document.querySelector('#recover'), result = document.querySelector('#result')
const label = new URLSearchParams(location.search).get('label') || 'browser'
const report = { label, userAgent: navigator.userAgent, checks: [], errors: [], completed: false }
let probe, probeContext, frames = [], retiredContext
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const assert = (value, message) => { if (!value) throw new Error(message) }
window.addEventListener('error', event => report.errors.push(event.message))
window.addEventListener('unhandledrejection', event => report.errors.push(String(event.reason)))

async function observe() {
  if (probeContext === engine.ctx) return
  probe?.disconnect()
  probeContext = engine.ctx
  await probeContext.audioWorklet.addModule(observerUrl)
  probe = new AudioWorkletNode(probeContext, 'observe-clicks')
  probe.port.onmessage = ({ data }) => frames.push(data.frame)
  engine._gainNode.connect(probe)
  probe.connect(probeContext.destination)
  frames = []
}

async function check(name, action) {
  status.textContent = `Running: ${name}`
  const item = document.createElement('li')
  document.querySelector('#checks').append(item)
  try {
    const details = await action()
    report.checks.push({ name, passed: true, details })
    item.textContent = `PASS: ${name}`
  } catch (error) {
    item.textContent = `FAIL: ${name}: ${error.message}`
    report.checks.push({ name, passed: false, error: error.message })
    throw error
  }
}

async function hasAudio(milliseconds = 400) {
  const before = engine.ctx.currentTime, count = frames.length
  await wait(milliseconds)
  assert(engine.isPlaying && engine.ctx.state === 'running', 'Playback stopped unexpectedly')
  assert(engine.ctx.currentTime > before, 'The audio clock did not advance')
  assert(frames.length > count, 'No rendered audio detected')
}

async function save() {
  result.textContent = JSON.stringify(report, null, 2)
  const response = await fetch('/__results', { method: 'POST', body: JSON.stringify(report) })
  if (!response.ok) throw new Error(`Saving results failed: ${response.status}`)
}

run.onclick = async () => {
  run.disabled = true
  try {
    await engine._unlockAudio()
    await engine.init()
    await observe()
    report.capabilities = { secureContext: isSecureContext, sampleRate: engine.ctx.sampleRate,
      audioWorklet: Boolean(engine.ctx.audioWorklet), outputTimestamp: typeof engine.ctx.getOutputTimestamp,
      audioSession: 'audioSession' in navigator, inert: 'inert' in HTMLElement.prototype,
      colorMix: CSS.supports('color', 'color-mix(in srgb, red, blue)'), containerUnits: CSS.supports('width', '1cqw') }
    await check('30-second worklet timing with 200 ms UI stalls', async () => {
      engine.setBpm(137)
      await engine.start()
      assert(engine.timingBackend === 'audio-worklet', 'Expected the production audio worklet')
      frames.length = 0
      const stall = setInterval(() => { const start = performance.now(); while (performance.now() - start < 200) {} }, 2000)
      try { await wait(30200) } finally { clearInterval(stall) }
      assert(engine.isPlaying, 'Health monitor stopped a healthy worklet')
      engine.stop()
      const first = frames[0], rate = engine.ctx.sampleRate
      const valid = frames.filter(frame => (frame - first) / rate < 30 - 1e-7)
      const maxErrorMs = Math.max(...valid.map((frame, i) => Math.abs((frame - first) / rate - i * 60 / 137) * 1000))
      assert(valid.length === 69, `Expected 69 clicks, received ${valid.length}`)
      assert(maxErrorMs <= 1000 / rate + .001, `Timing error exceeds one sample: ${maxErrorMs} ms`)
      return { clicks: valid.length, expected: 69, maxErrorMs, sampleRate: rate }
    })
    await check('All meter presets restart with rendered audio', async () => {
      for (const numerator of [4, 3, 2, 5, 6, 7, 9, 12]) {
        engine.setMeter({ numerator, denominator: numerator > 4 ? 8 : 4 })
        assert(!engine.isPlaying, 'Meter edit did not stop playback')
        await engine.start()
        await hasAudio()
      }
    })
    await check('All nine sounds load, decode and render', async () => {
      for (let i = 0; i < SOUND_OPTIONS.length; i++) {
        engine.stop(); engine.setSound(i)
        await engine.start()
        await hasAudio(650)
      }
      return SOUND_OPTIONS.map(sound => sound.id)
    })
    await check('Live subdivisions and trainers keep playing', async () => {
      engine.stop(); engine.setSound(0); engine.setMeter({ numerator: 4, denominator: 4 })
      engine.setBpm(240)
      await engine.start()
      engine.setSubdivision(4)
      engine.setTempoTrainer(true, 240, 260, 10, 1)
      engine.setSubdivisionTrainer(true, [{ subdivision: 3, bars: 1 }, { subdivision: 4, bars: 1 }])
      engine.setGapTraining(true, 1, 1, 'offbeat')
      await hasAudio(2500)
      assert(engine.bpm > 240, 'Tempo trainer failed to progress')
      engine.stop(); engine.setTempoTrainer(false); engine.setSubdivisionTrainer(false); engine.setGapTraining(false)
    })
    await check('Polyrhythm renders after mode and tempo edits', async () => {
      engine.setPolyrhythmMode(true); await engine.start()
      engine.setBpm(173); await hasAudio(1000)
      engine.setPolyrhythmMode(false)
    })
    await check('A one-bar session stops and releases playback', async () => {
      engine.setSubdivision(1); engine.setBpm(240)
      engine.setSessionSettings({ mode: 'bars', bars: 1 })
      await engine.start(); await wait(1600)
      assert(!engine.isPlaying && engine.getSessionState().phase === 'complete', 'Session did not complete')
      assert(engine._workletNode === null && engine._audioHealthTimer === null, 'Completed session retained playback resources')
      engine.setSessionSettings({ mode: 'off', countInBars: 1 })
    })
    await check('Spoken count-in transitions into click playback', async () => {
      await engine.start(); await hasAudio(1700)
      assert(engine.getSessionState().phase === 'playing', 'Count-in did not finish')
      engine.stop(); engine.setSessionSettings({ mode: 'off', countInBars: 0 })
    })
    await check('Suspending real browser audio stops the transport; Start resumes', async () => {
      await engine.start(); await engine.ctx.suspend(); await wait(100)
      assert(!engine.isPlaying, 'Transport remained playing while suspended')
      await engine.start(); await hasAudio(600)
    })
    await check('Rejected worklet module uses audible BufferSource fallback', async () => {
      engine.stop()
      const load = engine._loadWorkletModule
      engine._workletModule = null
      engine._loadWorkletModule = async () => { throw new Error('Intentional module-load failure') }
      try {
        await engine.start()
        assert(engine.timingBackend === 'buffer-source', 'Did not select fallback')
        await hasAudio(1200)
      } finally { engine.stop(); engine._loadWorkletModule = load; engine._workletModule = null }
    })
    retiredContext = engine.ctx
    await retiredContext.close()
    status.textContent = 'Initial checks passed. Click Restart after closed audio context to test recovery with a new user gesture.'
    recover.disabled = false
    await save()
  } catch (error) {
    engine.stop(); status.textContent = `Stopped: ${error.message}`
    await save()
  }
}

recover.onclick = async () => {
  recover.disabled = true
  try {
    // start() must run directly from the click so browser autoplay rules apply.
    const starting = engine.start()
    await check('Play rebuilds a closed context and re-registers its worklet', async () => {
      await starting; await observe(); await hasAudio(700)
      assert(engine.ctx !== retiredContext, 'Reused a closed context')
      assert(engine.timingBackend === 'audio-worklet', 'Replacement worklet did not load')
      assert(engine.soundBank.ctx === engine.ctx, 'Sound bank still belongs to retired context')
    })
    report.completed = true
    status.textContent = 'Complete: all browser checks passed'
  } catch (error) { status.textContent = `Stopped: ${error.message}` }
  finally { engine.stop(); await save() }
}
