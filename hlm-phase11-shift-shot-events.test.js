'use strict';
const assert=require('node:assert/strict');
const {simulateShiftShotEvents}=require('./hlm-phase11-shift-shot-events');
const {buildShiftRotation}=require('./hlm-phase11-shift-rotation');
const lineup=Array.from({length:10},(_,i)=>({id:'P'+i,position:i<6?'F':'D',ovr:80}));
const before=JSON.stringify(lineup),report=simulateShiftShotEvents(lineup,{seed:11});
const shifts=buildShiftRotation(lineup).shifts;
assert(report.events.every(e=>e.type==='shot'&&e.second>=0&&e.second<1200&&shifts[e.shiftIndex].skaterIds.includes(e.shooterId)));
assert(report.events.every((e,i)=>i===0||e.second>=report.events[i-1].second));
assert.equal(report.events.length,report.playerShots.reduce((s,p)=>s+p.shots,0));
assert.equal(report.playerIceTime.reduce((s,p)=>s+p.iceTimeSeconds,0),6000);
assert.equal(report.productionActivationEnabled,false);
assert.equal(report.automaticallyApplied,false);
assert.equal(report.requiresGMApproval,true);
assert.equal(JSON.stringify(lineup),before);
assert.deepEqual(simulateShiftShotEvents(JSON.parse(before),{seed:11}),report);
assert.throws(()=>simulateShiftShotEvents(lineup,{seed:-1}),TypeError);
let total=0,forward=0,defense=0,empty=0;
for(let seed=0;seed<500;seed++){
 const r=simulateShiftShotEvents(lineup,{seed});
 total+=r.events.length;
 if(!r.events.length)empty++;
 for(const e of r.events){if(Number(e.shooterId.slice(1))<6)forward++;else defense++}
}
const per60=total/500*3;
assert(per60>19&&per60<43,'Shot volume should be plausible: '+per60);
assert(forward>defense*1.3,'Forwards should take more shots than defensemen');
assert(empty>0,'Model must permit a zero-shot period');
console.log('Position-aware deterministic shots, volume, and isolation passed', {per60,forward,defense,empty});
