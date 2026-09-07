import assert from 'node:assert/strict'
import AudioEngine from '../../src/audio/AudioEngine.js'

function engineProbe() {
  const engine = new AudioEngine()
  const sounds = [], events = []
  engine.ctx = { currentTime: 0, state: 'running' }
  engine.soundBank = Object.fromEntries(['getBuffer', 'getDownbeatBuffer', 'getSubdivisionBuffer'].map(kind => [kind, (index, options) => ({ kind, index, ...options })]))
  engine._playSound = (buffer, time, volume) => sounds.push({buffer, time, volume})
  engine._notifyAtAudioTime = (_, callback) => callback()
  engine.onBeat(event => events.push(event))
  engine.isPlaying = true
  return { engine, sounds, events }
}

{
  const { engine, sounds } = engineProbe()
  engine.polyrhythmMode = true
  // Normal 3:4 at 120 BPM. First cycle is anchored at audio time 0.
  for (let now = 0; now <= .60; now += .025) { engine.ctx.currentTime = now; engine._schedulerPoly() }
  const before = sounds.length
  engine.ctx.currentTime = .60
  engine.setBpm(300)
  engine._schedulerPoly()
  const late = sounds.slice(before).filter(n => n.time < engine.ctx.currentTime - 1e-8)
  assert.ok(late.length > 0)
  console.log(JSON.stringify({finding:'poly-live-tempo-rewinds-time', audioTime:.6, lateScheduledNotes:late.map(n=>n.time), newScheduledNotes:sounds.slice(before).map(n=>n.time)}))
}
{
  const { engine, sounds } = engineProbe()
  engine.setSubdivision(4)
  engine._schedulerStandard()
  sounds.length = 0
  engine.ctx.currentTime = 2 // A delayed scheduler callback after a main-thread stall.
  engine._schedulerStandard()
  const late = sounds.filter(n => n.time < engine.ctx.currentTime - 1e-8)
  assert.equal(late.length, 15)
  console.log(JSON.stringify({finding:'scheduler-replays-backlog', stallSeconds:2, pastDueNotes:late.length, firstPastDueTime:late[0].time,lastPastDueTime:late.at(-1).time}))
}
{
  const { engine, sounds } = engineProbe()
  engine.isPlaying = false
  engine._ensureContext = () => true
  engine._unlockAudio = async () => true
  engine.init = async () => true
  let finishLoad
  engine.soundBank.prepareSound = () => new Promise(resolve=>{finishLoad=resolve})
  const start = engine.start()
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
  engine.setPolyrhythmMode(true)
  finishLoad()
  await start
  clearInterval(engine._timerId)
  assert.equal(engine.isPlaying,true)
  console.log(JSON.stringify({finding:'mode-change-during-pending-start-does-not-cancel', polyrhythmMode:engine.polyrhythmMode,isPlaying:engine.isPlaying}))
  engine.stop()
}
{
  const engine = new AudioEngine()
  engine.ctx={currentTime:0,state:'interrupted',resume:async()=>{engine.ctx.state='running'}}
  engine._ensureContext=()=>true
  const result = await engine._unlockAudio()
  assert.equal(result,false)
  assert.equal(engine.ctx.state,'interrupted')
  console.log(JSON.stringify({finding:'interrupted-context-cannot-restart',unlockResult:result,contextState:engine.ctx.state}))
}
{
  const { default: SoundBank } = await import('../../src/audio/SoundBank.js')
  const originalFetch = globalThis.fetch
  const fetches=[]
  globalThis.fetch=async url=>{fetches.push(url);return {ok:!url.endsWith('/max-16.wav'),arrayBuffer:async()=>new ArrayBuffer(1)}}
  try {
    const engine = new AudioEngine()
    engine.ctx={currentTime:0,state:'running',sampleRate:48000,
      createBuffer:(_,length)=>({getChannelData:()=>new Float32Array(length)}), decodeAudioData:async()=>({})}
    engine._ensureContext=()=>true
    engine.soundBank=new SoundBank(engine.ctx)
    engine.setSessionSettings({countInBars:1})
    const states=[]
    engine.onStateChange(value=>states.push(value))
    engine.toggle()
    await new Promise(resolve=>setImmediate(resolve))
    assert.equal(engine.isPlaying,false)
    assert.deepEqual(states,[])
    assert.equal(fetches.length,86)
    console.log(JSON.stringify({finding:'single-unused-voice-asset-error-silently-blocks-start',failedAsset:'voice-female/max-16.wav',countInBars:1,meter:'4/4',bpm:120,fetchCount:fetches.length,isPlaying:engine.isPlaying,transportNotifications:states}))
  } finally {globalThis.fetch=originalFetch}
}
