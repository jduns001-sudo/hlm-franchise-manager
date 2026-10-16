'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceDashboard,dashboardRow}=require('./hlm-phase11-performance-dashboard');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceDashboard(home,away,options);
assert.deepEqual(r,summarizePerformanceDashboard(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.games,7);assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.comparisons.length,r.players.length);
assert.deepEqual(r.comparisons.map(p=>p.rank),Array.from({length:r.players.length},(_,i)=>i+1));
assert.equal(new Set(r.comparisons.map(p=>p.team+':'+p.playerId)).size,r.players.length);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side),rows=members.map(p=>p.dashboard);
 assert.equal(sum(rows,'shots'),t.dashboard.shots);
 assert.equal(sum(rows,'goals'),t.dashboard.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.dashboard.expectedGoals)<0.00002);
 for(const p of members){
  assert.equal(p.dashboard.shots,p.shots);assert.equal(p.dashboard.goals,p.goals);
  assert.equal(p.dashboard.notPredictive,true);assert.equal(p.dashboard.notScoutingGrade,true);
  assert(['insufficient-evidence','improving-observed','declining-observed','no-material-observed-change'].includes(p.dashboard.trendSignal));
 }
}
assert.equal(sum(Object.values(r.signalCounts).map(x=>({count:x})),'count'),r.players.length);
const fixture=(eligibility,gaps)=>({
 reliabilityProfile:{games:gaps.length,shots:30,goals:5,expectedGoals:3,shotGames:5,eligibility,reliabilityTier:'mixed-observed',stabilityScore:55,sampleSizeTier:'small'},
 gameTrends:gaps.map((delta,i)=>({game:i+1,shots:5,goals:delta+1,expectedGoals:1}))});
assert.equal(dashboardRow(fixture('comparable',[0,0,0,1,1,1])).trendSignal,'improving-observed');
assert.equal(dashboardRow(fixture('comparable',[1,1,1,0,0,0])).trendSignal,'declining-observed');
assert.equal(dashboardRow(fixture('comparable',[0,0,0,0,0,0])).trendSignal,'no-material-observed-change');
assert.equal(dashboardRow(fixture('insufficient-sample',[0,0,0,1,1,1])).trendSignal,'insufficient-evidence');
assert.equal(dashboardRow(fixture('comparable',[1,1,1])).trendSignal,'insufficient-evidence');
assert.notDeepEqual(summarizePerformanceDashboard(home,away,{...options,seed:12}).teams,r.teams);
assert.throws(()=>summarizePerformanceDashboard(home,away,{games:0}),RangeError);
assert.throws(()=>summarizePerformanceDashboard([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizePerformanceDashboard(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizePerformanceDashboard(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.dashboard.expectedGoals;weak+=b.teams.away.dashboard.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1143 trend signals, team conservation, identity, seeded replay and goalie sensitivity passed');
