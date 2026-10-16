'use strict';
const assert=require('node:assert/strict');
const {summarizePlayerXG}=require('./hlm-phase11-player-xg');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const r=summarizePlayerXG(home,away,opts);
assert.deepEqual(r,summarizePlayerXG(home,away,opts));
assert.equal(JSON.stringify([home,away]),before);
assert.equal(r.periodSummaries.length,3);
for(const side of ['home','away']){
 const ps=r.players.filter(p=>p.team===side);
 assert.equal(ps.reduce((n,p)=>n+p.shots,0),r[side+'Shots']);
 assert.equal(ps.reduce((n,p)=>n+p.goals,0),r[side+'Score']);
 assert(Math.abs(ps.reduce((n,p)=>n+p.expectedGoals,0)-r[side+'ExpectedGoals'])<0.00002);
 assert(Math.abs(r.periodSummaries.reduce((n,p)=>n+p[side+'ExpectedGoals'],0)-r[side+'ExpectedGoals'])<0.00001);
 for(const p of ps){
  assert.equal(p.periodExpectedGoals.length,3);
  assert(Math.abs(p.periodExpectedGoals.reduce((n,x)=>n+x,0)-p.expectedGoals)<0.00001);
  assert(Math.abs(p.goalsAboveExpected-(p.goals-p.expectedGoals))<0.000001);
  assert(p.expectedGoals>=0&&p.expectedGoals<=p.shots);
  assert.equal(p.expectedGoalsPerShot,p.shots?Number((p.expectedGoals/p.shots).toFixed(6)):null);
  assert((side==='home'?home:away).some(x=>x.id===p.playerId));
 }
 for(const period of r.periodSummaries){
  assert(Math.abs(ps.reduce((n,p)=>n+p.periodExpectedGoals[period.period-1],0)-period[side+'ExpectedGoals'])<0.00002);
 }
}
assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);
assert.equal(r.requiresGMApproval,true);
let high=0,low=0;
for(let seed=0;seed<120;seed++){
 const a=summarizePlayerXG(home,away,{...opts,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePlayerXG(home,away,{...opts,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.awayShots,b.awayShots);
 high+=a.awayExpectedGoals;low+=b.awayExpectedGoals;
}
assert(high<low);
assert.throws(()=>summarizePlayerXG([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizePlayerXG([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
assert.throws(()=>summarizePlayerXG(home,away,{periods:0}),RangeError);
console.log('Mission 1133 xG, shot quality, per-period and team conservation, seed and goalie sensitivity passed');
