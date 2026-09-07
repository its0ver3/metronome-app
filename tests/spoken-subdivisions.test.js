import test from 'node:test'
import assert from 'node:assert/strict'
import AudioEngine from '../src/audio/AudioEngine.js'
import SoundBank from '../src/audio/SoundBank.js'
import { getSoundIndexById } from '../src/audio/constants.js'

async function instrument(voice, subdivision, meter = {numerator:4,denominator:4}) {
  const engine = new AudioEngine()
  engine.setMeter(meter);engine.setBpm(100);engine.setSubdivision(subdivision)
  engine.soundIndex=getSoundIndexById(voice)
  const bank=new SoundBank({sampleRate:48000,createBuffer:(_channels,length)=>({getChannelData:()=>new Float32Array(length)})})
  await bank.init()
  const entry=bank.entries[engine.soundIndex]
  for(const prefix of ['','fast-','faster-','rapid-','max-']) {
    for(let n=1;n<=16;n++)entry.voiceBuffers.set(`${prefix}${n}`,{word:n,prefix})
    entry.voiceBuffers.set(`${prefix}and`,{word:'and',prefix})
  }
  entry.subdivision={word:'click'}
  engine.soundBank=bank
  engine._notifyAtAudioTime=(_,callback)=>callback()
  const notes=[];engine._playSound=(buffer,time,volume)=>notes.push({...buffer,time,volume})
  function bar() {
    const current=engine._currentBar
    do { engine._scheduleNote(engine._nextNoteTime);engine._advanceBeat() } while(engine._currentBar===current)
    return notes
  }
  return {engine,notes,bar}
}

for(const voice of ['male-count','female-count']) {
  test(`${voice}: eighths speak 1 and 2 and, sixteenths keep clicks in between`,async()=>{
    for(const subdivision of [2,4,6,8,10,12]) {
      const {bar}=await instrument(voice,subdivision)
      const notes=bar()
      for(let beat=0;beat<4;beat++)for(let sub=0;sub<subdivision;sub++) {
        const note=notes[beat*subdivision+sub]
        assert.equal(note.word,sub===0?beat+1:sub===subdivision/2?'and':'click')
        assert.ok(Math.abs(note.time-(beat+sub/subdivision)*.6)<1e-8)
        assert.equal(note.volume,sub===0?1:.25)
      }
      // Existing short number variants make room for and; and has its own half-beat-length tiers.
      assert.equal(notes[0].prefix,'rapid-')
      assert.equal(notes[subdivision/2].prefix,'')
    }
  })
  test(`${voice}: quarters and odd tuplets keep the existing numbered samples and clicks`,async()=>{
    for(const subdivision of [1,3,5,7,9,11,13]) {
      const {bar}=await instrument(voice,subdivision);const notes=bar()
      assert.ok(!notes.some(n=>n.word==='and'))
      assert.equal(notes[0].prefix,'')
    }
  })
}

test('and follows each meter group midpoint; compound groups without a midpoint keep their clicks',async()=>{
  const {bar}=await instrument('male-count',1,{numerator:7,denominator:8,groups:[2,2,3]})
  assert.deepEqual(bar().map(n=>n.word),[1,'and',2,'and',3,'click','click'])
  const compound=await instrument('female-count',1,{numerator:6,denominator:8})
  assert.deepEqual(compound.bar().map(n=>n.word),[1,'click','click',2,'click','click'])
  const groupOnly=await instrument('female-count',4,{numerator:7,denominator:8,groups:[2,2,3],groupOnly:true})
  assert.deepEqual(groupOnly.bar().map(n=>n.word),[1,2,3])
})

test('muted and remains silent, explicit accent keeps its volume, and a muted group stays muted',async()=>{
  const {engine,bar}=await instrument('male-count',4)
  engine.subdivisionAccents[2]='OFF'
  engine.subdivisionAccents[6]='ACCENT'
  engine.cycleBeatAccent(2) // Accent -> Off for the entire third beat.
  const notes=bar()
  assert.ok(!notes.some(n=>Math.abs(n.time-.3)<1e-8))
  assert.equal(notes.find(n=>Math.abs(n.time-.9)<1e-8).volume,1)
  assert.ok(!notes.some(n=>n.time>=1.2-1e-8 && n.time<1.8-1e-8))
})

test('gap overrides keep their existing numbered hits instead of adding spoken subdivisions',async()=>{
  const {engine,bar}=await instrument('female-count',4)
  engine.setGapTraining(true,1,1,'offbeat')
  bar()
  const start=engine._nextNoteTime
  const gap=bar().filter(n=>n.time>=start-1e-8)
  assert.equal(gap.length,4)
  assert.ok(gap.every(n=>typeof n.word==='number'))
})
