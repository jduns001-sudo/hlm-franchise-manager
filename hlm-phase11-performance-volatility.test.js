'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceVolatility,volatility,rollingVolatility}=require('./hlm-phase11-performance-volatility');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceVolatility(home,away,options);
assert.deepEqual(r,summarizePerformanceVolatility(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.games,7);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side);
 assert.equal(t.rolling3Volatility.length,5);assert.equal(t.rolling5Volatility.length,3);
 for(const key of ['volatility']){
  const a=members.map(p=>p[key]);
  assert.equal(sum(a,'shots'),t[key].shots);assert.equal(sum(a,'goals'),t[key].goals);
  assert(Math.abs(sum(a,'expectedGoals')-t[key].expectedGoals)<0.00002);
 }
 for(const size of [3,5]){
  const key='rolling'+size+'Volatility';
  for(const w of t[key]){
   const a=members.map(p=>p[key].find(x=>x.endingGame===w.endingGame));
   assert.equal(sum(a,'shots'),w.shots);assert.equal(sum(a,'goals'),w.goals);
   assert(Math.abs(sum(a,'expectedGoals')-w.expectedGoals)<0.00002);
  }
 }
 for(const p of members){
  assert.equal(p.volatility.shots,p.shots);assert.equal(p.volatility.goals,p.goals);
  assert.equal(p.volatility.notPredictive,true);
  assert.equal(p.rolling3Volatility.length,5);assert.equal(p.rolling5Volatility.length,3);
 }
}
assert.deepEqual(volatility([]),{games:0,shots:0,goals:0,expectedGoals:0,shootingGames:0,shootingPercentageVariance:null,shootingPercentageStdDev:null,expectedGoalsPerGameVariance:null,expectedGoalsPerGameStdDev:null,stabilityIndicator:'insufficient-shot-games',descriptiveOnly:true,notPredictive:true});
assert.equal(volatility([{shots:0,goals:0,expectedGoals:.2},{shots:2,goals:1,expectedGoals:.4}]).shootingGames,1);
assert.equal(volatility([{shots:2,goals:1,expectedGoals:.2},{shots:2,goals:1,expectedGoals:.2},{shots:2,goals:1,expectedGoals:.2}]).stabilityIndicator,'stable');
assert.equal(volatility([{shots:2,goals:0,expectedGoals:.2},{shots:2,goals:1,expectedGoals:.2},{shots:2,goals:2,expectedGoals:.2}]).stabilityIndicator,'highly-variable');
assert.equal(rollingVolatility([{shots:1,goals:0,expectedGoals:.1},{shots:1,goals:0,expectedGoals:.1}],3).length,0);
assert.notDeepEqual(summarizePerformanceVolatility(home,away,{...options,seed:12}).teams,r.teams);
assert.throws(()=>summarizePerformanceVolatility(home,away,{games:0}),RangeError);
assert.throws(()=>summarizePerformanceVolatility([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizePerformanceVolatility(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePerformanceVolatility(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.volatility.expectedGoals;weak+=b.teams.away.volatility.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1140 volatility, rolling windows, conservation, replay and goalie sensitivity passed');
