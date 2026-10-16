'use strict';
const assert=require('node:assert/strict');
const {summarizeRegressionTrends,compare}=require('./hlm-phase11-regression-trends');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const original=JSON.stringify([home,away,options]);
const r=summarizeRegressionTrends(home,away,options);
assert.deepEqual(r,summarizeRegressionTrends(home,away,options));
assert.equal(JSON.stringify([home,away,options]),original);
assert.equal(r.games,7);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const team of ['home','away']){
 const t=r.teams[team],members=r.players.filter(p=>p.team===team);
 assert.equal(t.comparison.early.games,3);assert.equal(t.comparison.late.games,4);
 for(const p of members){
  const c=p.comparison;
  assert.equal(c.early.games,3);assert.equal(c.late.games,4);
  assert.equal(c.early.shots+c.late.shots,p.shots);
  assert.equal(c.early.goals+c.late.goals,p.goals);
  assert(Math.abs(c.early.expectedGoals+c.late.expectedGoals-p.expectedGoals)<0.000003);
  assert(['toward-expected','past-expected','away-from-expected','stable-baseline','insufficient-data'].includes(c.regressionIndicator));
  assert.equal(c.descriptiveOnly,true);
  assert.equal(c.shootingPercentageChange,c.early.shootingPercentage===null||c.late.shootingPercentage===null?null:Number((c.late.shootingPercentage-c.early.shootingPercentage).toFixed(6)));
 }
 for(const part of ['early','late']){
  const rows=members.map(p=>p.comparison[part]),segment=t.comparison[part];
  assert.equal(sum(rows,'shots'),segment.shots);assert.equal(sum(rows,'goals'),segment.goals);
  assert(Math.abs(sum(rows,'expectedGoals')-segment.expectedGoals)<0.00002);
 }
}
assert.equal(compare([{shots:1,goals:0,expectedGoals:.3}]).regressionIndicator,'insufficient-data');
assert.equal(compare([{shots:2,goals:2,expectedGoals:.4},{shots:2,goals:1,expectedGoals:.6}]).regressionIndicator,'toward-expected');
assert.equal(compare([{shots:2,goals:0,expectedGoals:.4},{shots:2,goals:2,expectedGoals:.6}]).regressionIndicator,'past-expected');
assert.equal(compare([{shots:2,goals:1,expectedGoals:.4},{shots:2,goals:2,expectedGoals:.6}]).regressionIndicator,'away-from-expected');
assert.equal(summarizeRegressionTrends(home,away,{...options,games:1}).teams.home.comparison.early.games,0);
assert.throws(()=>summarizeRegressionTrends(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeRegressionTrends(home,away,{games:31}),RangeError);
assert.throws(()=>summarizeRegressionTrends([...home,home[0]],away,options),/Duplicate player ID/);
assert.notDeepEqual(summarizeRegressionTrends(home,away,{...options,seed:12}).teams,r.teams);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizeRegressionTrends(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeRegressionTrends(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.expectedGoals;weak+=b.teams.away.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1138 early/late, regression indicators, conservation and seeded statistics passed');
