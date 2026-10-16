'use strict';
const assert=require('node:assert/strict');
const {summarizeConsistencyRankings,score,rank}=require('./hlm-phase11-consistency-rankings');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const input=JSON.stringify([home,away,options]);
const r=summarizeConsistencyRankings(home,away,options);
assert.deepEqual(r,summarizeConsistencyRankings(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.games,7);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.rankings.length,r.players.length);
assert.deepEqual(r.rankings.map(p=>p.rank),Array.from({length:r.players.length},(_,i)=>i+1));
assert.equal(new Set(r.rankings.map(p=>p.team+':'+p.id)).size,r.players.length);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side),rows=members.map(p=>p.consistencyScore);
 assert.equal(sum(rows,'shots'),t.consistencyScore.shots);
 assert.equal(sum(rows,'goals'),t.consistencyScore.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.consistencyScore.expectedGoals)<0.00002);
 for(const p of members){
  assert.equal(p.consistencyScore.shots,p.shots);assert.equal(p.consistencyScore.goals,p.goals);
  assert.equal(p.consistencyScore.notPredictive,true);
  assert.equal(p.consistencyScore.stabilityScore===null||p.consistencyScore.stabilityScore>=0&&p.consistencyScore.stabilityScore<=100,true);
 }
}
const record=(shots,shotGames,shootingStdDev=.05,xgStdDev=.05)=>({
 volatility:{games:7,shots,goals:0,expectedGoals:0,shootingGames:shotGames,shootingPercentageStdDev:shootingStdDev,expectedGoalsPerGameStdDev:xgStdDev},
 finishingConfidence:{sampleSizeTier:'small'}});
assert.equal(score(record(0,0)).stabilityScore,null);
assert.equal(score(record(0,0)).eligibility,'insufficient-sample');
assert.equal(score(record(9,2)).eligibility,'insufficient-sample');
assert.equal(score(record(20,4)).eligibility,'provisional');
assert.equal(score(record(30,5)).eligibility,'comparable');
assert(score(record(30,5)).stabilityScore>score(record(10,3)).stabilityScore);
assert(score(record(30,5,.05,.05)).stabilityScore>score(record(30,5,.3,.3)).stabilityScore);
const entries=[{id:'b',team:'home',consistencyScore:score(record(30,5))},{id:'a',team:'home',consistencyScore:score(record(30,5))},{id:'c',team:'away',consistencyScore:score(record(10,3))}];
assert.deepEqual(rank(entries).map(x=>x.id),['a','b','c']);
assert.notDeepEqual(summarizeConsistencyRankings(home,away,{...options,seed:12}).teams,r.teams);
assert.throws(()=>summarizeConsistencyRankings(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeConsistencyRankings([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizeConsistencyRankings(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeConsistencyRankings(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.consistencyScore.expectedGoals;weak+=b.teams.away.consistencyScore.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1141 ranking tie-breaks, sample weighting, conservation and seeded regressions passed');
