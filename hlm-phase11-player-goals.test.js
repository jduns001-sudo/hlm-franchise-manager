'use strict';
const assert=require('node:assert/strict');
const {summarizePlayerGoals}=require('./hlm-phase11-player-goals');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const report=summarizePlayerGoals(home,away,options);
assert.deepEqual(summarizePlayerGoals(home,away,options),report);
assert.equal(JSON.stringify([home,away]),before);
assert.equal(report.periodSummaries.length,3);
assert.equal(report.goals.length,report.homeScore+report.awayScore);
assert.equal(report.players.reduce((n,p)=>n+p.goals,0),report.goals.length);
assert.equal(report.players.filter(p=>p.team==='home').reduce((n,p)=>n+p.goals,0),report.homeScore);
assert.equal(report.players.filter(p=>p.team==='away').reduce((n,p)=>n+p.goals,0),report.awayScore);
for(const p of report.players){
 assert.equal(p.goals,p.periodGoals.reduce((a,b)=>a+b,0));
 assert.equal(p.periodGoals.length,3);
 assert((p.team==='home'?home:away).some(x=>x.id===p.playerId));
}
for(const p of report.periodSummaries){
 assert.equal(report.players.filter(x=>x.team==='home').reduce((n,x)=>n+x.periodGoals[p.period-1],0),p.homeGoals);
 assert.equal(report.players.filter(x=>x.team==='away').reduce((n,x)=>n+x.periodGoals[p.period-1],0),p.awayGoals);
}
assert.equal(report.productionActivationEnabled,false);
assert.equal(report.automaticallyApplied,false);
assert.equal(report.requiresGMApproval,true);
let strong=0,weak=0;
for(let seed=0;seed<180;seed++){
 const a=summarizePlayerGoals(home,away,{...options,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePlayerGoals(home,away,{...options,homeGoalie:{id:'HG',ovr:45},seed});
 strong+=a.awayScore;weak+=b.awayScore;
}
assert(strong<weak);
assert.throws(()=>summarizePlayerGoals([...home,home[0]],away,options),/Duplicate player ID/);
assert.throws(()=>summarizePlayerGoals([{...home[0],id:null},...home.slice(1)],away,options),/Player ID/);
assert.throws(()=>summarizePlayerGoals(home,away,{periods:0}),RangeError);
console.log('Mission 1131 player identity, per-period attribution, conservation, seed and goalie sensitivity passed');
