'use strict';
const assert=require('node:assert/strict');
const {simulateShotOutcomes}=require('./hlm-phase11-shot-outcomes');
const lineup=Array.from({length:10},(_,i)=>({id:'P'+i,position:i<6?'F':'D',ovr:80}));
const before=JSON.stringify(lineup);
const baseline=simulateShotOutcomes(lineup,{goalie:{id:'G',ovr:80},seed:11});
assert.deepEqual(simulateShotOutcomes(lineup,{goalie:{id:'G',ovr:80},seed:11}),baseline);
assert.equal(JSON.stringify(lineup),before);
assert.equal(baseline.goals+baseline.saves,baseline.shotsOnGoal);
assert(baseline.events.every(e=>['goal','save'].includes(e.outcome)&&e.goalProbability>=0.005&&e.goalProbability<=0.3&&Math.abs(e.goalProbability+e.saveProbability-1)<1e-9));
assert.equal(baseline.productionActivationEnabled,false);
assert.equal(baseline.automaticallyApplied,false);
assert.equal(baseline.requiresGMApproval,true);
let highGoals=0,lowGoals=0,highExpected=0,lowExpected=0,shotCount=0;
for(let seed=0;seed<600;seed++){
 const strong=simulateShotOutcomes(lineup,{goalie:{id:'G',ovr:115},seed});
 const weak=simulateShotOutcomes(lineup,{goalie:{id:'G',ovr:45},seed});
 assert.equal(strong.shotsOnGoal,weak.shotsOnGoal);
 highGoals+=strong.goals;lowGoals+=weak.goals;highExpected+=strong.expectedGoalsAgainst;lowExpected+=weak.expectedGoalsAgainst;shotCount+=strong.shotsOnGoal;
}
assert(shotCount>1000);
assert(highExpected<lowExpected,'higher-rated goalie should allow fewer expected goals');
assert(highGoals<lowGoals,'higher-rated goalie should allow fewer actual goals over many seeds');
const short=simulateShotOutcomes(lineup,{periodSeconds:60,shiftSeconds:15,seed:11});
assert(short.events.every(e=>e.second<60));
assert.throws(()=>simulateShotOutcomes(lineup,{seed:-1}),TypeError);
console.log('Mission 1126 seeded outcomes, goalie rating, bounded saves, conservation and isolation passed',{highGoals,lowGoals,shotCount});
