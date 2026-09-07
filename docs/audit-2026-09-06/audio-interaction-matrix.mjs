import assert from 'node:assert/strict'
import AudioEngine from '../../src/audio/AudioEngine.js'
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`)
let standardCases=0, barsChecked=0, polyCases=0
function instrument() {
 const e=new AudioEngine()
 e.soundBank={getBuffer:()=>1,getDownbeatBuffer:()=>1,getSubdivisionBuffer:()=>1}
 e._playSound=()=>{}
 e._notifyAtAudioTime=()=>{}
 return e
}
for(let numerator=1;numerator<=16;numerator++) for(const denominator of [4,8]) for(const pattern of ['silence','offbeat','second','fourth','triplet-second','triplet-third']) for(const startBpm of [20,300]) {
 const e=instrument()
 e.setMeter({numerator,denominator,groupOnly:denominator===8})
 e.setPumpTheJam(true)
 e.setGapTraining(true,1,2,pattern)
 e.setTempoTrainer(true,startBpm,startBpm+20,5,1)
 e.setSubdivisionTrainer(true,[{subdivision:1,bars:1},{subdivision:3,bars:1},{subdivision:13,bars:1}])
 for(let i=0;i<8;i++) {
  const start=e._nextNoteTime,bar=e._currentBar,bpm=e.bpm
  let ticks=0
  while(e._currentBar===bar) {e._scheduleNote(e._nextNoteTime);e._advanceBeat();assert.ok(++ticks<=208)}
  near(e._nextNoteTime-start,numerator*4/denominator*60/bpm)
  assert.equal(e.bpm,Math.min(startBpm+20,startBpm+(i+1)*5))
  assert.equal(e.subdivision,[1,3,13][(i+1)%3])
  barsChecked++
 }
 standardCases++
}
for(let r1=1;r1<=16;r1++)for(let r2=1;r2<=16;r2++) {
 const e=instrument(),events=[]
 e.setPumpTheJam(true);e.setBpm(800)
 e.polyRhythm1=r1;e.polyRhythm2=r2;e.ctx={currentTime:0}
 e._scheduleNotePoly=(time,rhythm,index)=>events.push({time,rhythm,index,bar:e._currentBar})
 const cycle=60/800*r1
 for(let now=0;now<cycle*3;now+=.025){e.ctx.currentTime=now;e._schedulerPoly()}
 for(let bar=1;bar<=2;bar++)for(const [rhythm,count]of [[1,r1],[2,r2]]) {
  const hits=events.filter(n=>n.bar===bar&&n.rhythm===rhythm)
  assert.equal(hits.length,count)
  hits.forEach((hit,i)=>near(hit.time,(bar-1)*cycle+i*cycle/count))
 }
 polyCases++
}
console.log(JSON.stringify({standardCases,barsChecked,polyCases,result:'all pass'}))
