'use strict';
const assert=require('node:assert/strict');
const {summarizeMultiGameConsistency}=require('./hlm-phase11-multigame-consistency');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:6};
const r=summarizeMultiGameConsistency(home,away,opts);
assert.deepEqual(r,summarizeMultiGameConsistency(home,away,opts));
assert.equal(JSON.stringify([home,away]),before);
assert.equal(r.games,6);
const tiers=['low','medium','high'],sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const team of ['home','away']){
 const members=r.players.filter(p=>p.team===team),t=r.teams[team];
 assert.equal(sum(members,'shots'),t.shots);assert.equal(sum(members,'goals'),t.goals);
 assert(Math.abs(sum(members,'expectedGoals')-t.expectedGoals)<0.00002);
 assert.equal(t.gameTrends.length,6);
 assert.equal(sum(t.gameTrends,'shots'),t.shots);
 assert.equal(sum(t.gameTrends,'goals'),t.goals);
 assert(t.shotVolumeVariance>=0&&t.xGVariance>=0&&t.finishingVariance>=0);
 assert(t.shotVolumeConsistency>0&&t.shotVolumeConsistency<=1);
 for(const tier of tiers){
  assert.equal(sum(members.map(p=>p.dangerEfficiency[tier]),'shots'),t.dangerEfficiency[tier].shots);
  assert.equal(sum(members.map(p=>p.dangerEfficiency[tier]),'goals'),t.dangerEfficiency[tier].goals);
 }
 for(const p of members){
  assert.equal(p.gameTrends.length,6);
  assert.equal(sum(p.gameTrends,'shots'),p.shots);
  assert.equal(sum(p.gameTrends,'goals'),p.goals);
  assert(Math.abs(sum(p.gameTrends,'expectedGoals')-p.expectedGoals)<0.00001);
  assert.equal(p.shootingPercentage,p.shots?Number((p.goals/p.shots).toFixed(6)):null);
  assert.equal(p.goalsAboveExpected,Number((p.goals-p.expectedGoals).toFixed(6)));
  assert(p.shotVolumeVariance>=0&&p.xGVariance>=0&&p.finishingVariance>=0);
  assert((team==='home'?home:away).some(x=>x.id===p.playerId));
  for(let i=0;i<6;i++)assert.equal(p.gameTrends[i].seed,11+i*7919);
 }
 for(let i=0;i<6;i++){
  assert.equal(sum(members.map(p=>p.gameTrends[i]),'shots'),t.gameTrends[i].shots);
  assert.equal(sum(members.map(p=>p.gameTrends[i]),'goals'),t.gameTrends[i].goals);
 }
}
assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);
assert.equal(r.requiresGMApproval,true);
assert.throws(()=>summarizeMultiGameConsistency(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeMultiGameConsistency(home,away,{games:31}),RangeError);
assert.throws(()=>summarizeMultiGameConsistency(home,away,{games:2.5}),RangeError);
assert.throws(()=>summarizeMultiGameConsistency([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizeMultiGameConsistency([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
const single=summarizeMultiGameConsistency(home,away,{...opts,games:1});
assert.equal(single.teams.home.shotVolumeVariance,0);
assert.equal(single.teams.home.xGVariance,0);
assert.notDeepEqual(summarizeMultiGameConsistency(home,away,{...opts,seed:12}).teams,r.teams);
let strong=0,weak=0;
for(let seed=0;seed<24;seed++){
 const a=summarizeMultiGameConsistency(home,away,{...opts,games:3,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeMultiGameConsistency(home,away,{...opts,games:3,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.expectedGoals;weak+=b.teams.away.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1136 multi-game conservation, variance, seed, identity and safety passed');
