'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceTrendHistory}=require('./hlm-phase11-performance-trend-history');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,periods:3,gamesPerPeriod:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceTrendHistory(home,away,options);
assert.deepEqual(r,summarizePerformanceTrendHistory(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.periodCount,3);assert.equal(r.totalGames,21);
assert.deepEqual(r.snapshots.map(s=>s.seed),[11,9984,19957]);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.players.length,20);
assert.equal(new Set(r.players.map(p=>p.team+':'+p.playerId)).size,r.players.length);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side);
 assert.equal(t.periods.length,3);
 assert.equal(sum(members.map(p=>p.totals),'shots'),t.totals.shots);
 assert.equal(sum(members.map(p=>p.totals),'goals'),t.totals.goals);
 assert(Math.abs(sum(members.map(p=>p.totals),'expectedGoals')-t.totals.expectedGoals)<.00005);
 for(const snapshot of r.snapshots){
  const rows=snapshot.players.filter(p=>p.team===side).map(p=>p.dashboard),team=snapshot.teams[side].dashboard;
  assert.equal(sum(rows,'shots'),team.shots);assert.equal(sum(rows,'goals'),team.goals);
  assert(Math.abs(sum(rows,'expectedGoals')-team.expectedGoals)<.00002);
 }
 for(const p of members){
  assert.equal(p.periods.length,3);
  assert.equal(sum(p.periods,'shots'),p.totals.shots);
  assert.equal(sum(p.periods,'goals'),p.totals.goals);
  assert.equal(p.descriptiveOnly,true);assert.equal(p.notPredictive,true);
  assert(p.periods.every(x=>['insufficient-evidence','improving-observed','declining-observed','no-material-observed-change'].includes(x.trendSignal)));
 }
}
assert.notDeepEqual(summarizePerformanceTrendHistory(home,away,{...options,seed:12}).teams,r.teams);
for(const periods of [0,1,13,1.5])assert.throws(()=>summarizePerformanceTrendHistory(home,away,{...options,periods}),RangeError);
for(const gamesPerPeriod of [0,31,1.5])assert.throws(()=>summarizePerformanceTrendHistory(home,away,{...options,gamesPerPeriod}),RangeError);
assert.throws(()=>summarizePerformanceTrendHistory([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<12;seed++){
 const a=summarizePerformanceTrendHistory(home,away,{...options,periods:2,gamesPerPeriod:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePerformanceTrendHistory(home,away,{...options,periods:2,gamesPerPeriod:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.totals.shots,b.teams.away.totals.shots);
 strong+=a.teams.away.totals.expectedGoals;weak+=b.teams.away.totals.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1144 historical periods, replay, identity, conservation, sample safeguards and goalie sensitivity passed');
