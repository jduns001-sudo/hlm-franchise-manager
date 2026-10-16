'use strict';
const assert=require('node:assert/strict');
const {summarizePlayerShots}=require('./hlm-phase11-player-shots');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const r=summarizePlayerShots(home,away,opts);
assert.deepEqual(r,summarizePlayerShots(home,away,opts));
assert.equal(JSON.stringify([home,away]),before);
assert.equal(r.periodSummaries.length,3);
for(const side of ['home','away']){
 const ps=r.players.filter(p=>p.team===side);
 assert.equal(ps.reduce((n,p)=>n+p.shots,0),r[side+'Shots']);
 assert.equal(ps.reduce((n,p)=>n+p.goals,0),r[side+'Score']);
 assert.equal(r.periodSummaries.reduce((n,p)=>n+p[side+'Shots'],0),r[side+'Shots']);
 for(const p of ps){
  assert.equal(p.shots,p.periodShots.reduce((n,x)=>n+x,0));
  assert.equal(p.goals,p.periodGoals.reduce((n,x)=>n+x,0));
  assert(p.goals<=p.shots);
  assert.equal(p.shootingPercentage,p.shots?Number((p.goals/p.shots).toFixed(6)):null);
  assert((side==='home'?home:away).some(x=>x.id===p.playerId));
 }
 for(const period of r.periodSummaries){
  assert.equal(ps.reduce((n,p)=>n+p.periodShots[period.period-1],0),period[side+'Shots']);
  assert.equal(ps.reduce((n,p)=>n+p.periodGoals[period.period-1],0),period[side+'Goals']);
 }
}
assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);
assert.equal(r.requiresGMApproval,true);
let high=0,low=0;
for(let seed=0;seed<160;seed++){
 const a=summarizePlayerShots(home,away,{...opts,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePlayerShots(home,away,{...opts,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.awayShots,b.awayShots);
 high+=a.awayScore;low+=b.awayScore;
}
assert(high<low);
assert.throws(()=>summarizePlayerShots([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizePlayerShots([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
assert.throws(()=>summarizePlayerShots(home,away,{periods:0}),RangeError);
console.log('Mission 1132 player shots, efficiency, identity, seeded conservation and goalie sensitivity passed');
