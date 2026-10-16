'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceHistoryComparisons,compare}=require('./hlm-phase11-performance-history-comparisons');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,periods:3,gamesPerPeriod:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceHistoryComparisons(home,away,options);
assert.deepEqual(r,summarizePerformanceHistoryComparisons(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.periodCount,3);assert.equal(r.totalGames,21);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.players.length,20);assert.equal(r.playerPairs.length,190);
assert.equal(new Set(r.players.map(p=>p.team+':'+p.playerId)).size,20);
assert.equal(new Set(r.playerPairs.map(p=>p.left.team+':'+p.left.playerId+'|'+p.right.team+':'+p.right.playerId)).size,190);
assert(r.playerPairs.every(p=>p.descriptiveOnly&&p.notPredictive&&p.notScoutingGrade&&p.notDecisionAdvice));
assert.equal(r.teamPair.left.team,'home');assert.equal(r.teamPair.right.team,'away');
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side].insight,rows=r.players.filter(p=>p.team===side).map(p=>p.insight);
 assert.equal(sum(rows,'shots'),t.shots);assert.equal(sum(rows,'goals'),t.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.expectedGoals)<.00005);
}
assert.equal(r.teamPair.shotsDifference,r.teams.home.insight.shots-r.teams.away.insight.shots);
assert.equal(r.teamPair.goalsDifference,r.teams.home.insight.goals-r.teams.away.insight.goals);
const record=(team,shots,goals,expectedGoals,sampleEligible)=>({team,playerId:team,insight:{
 shots,goals,expectedGoals,sampleEligible,stabilityDelta:5,latestSignal:'no-material-observed-change',
 persistentDirectionalSignal:null}});
const a=record('home',20,3,2.5,true),b=record('away',10,1,1.5,true);
assert.equal(compare(a,b).shotsDifference,10);
assert.equal(compare(a,b).goalsDifference,2);
assert.equal(compare(a,b).expectedGoalsDifference,1);
assert.equal(compare(a,b).observedFinishingGapDifference,1);
assert.equal(compare(a,{...b,insight:{...b.insight,sampleEligible:false}}).evidenceTier,'insufficient-period-evidence');
assert.throws(()=>compare(null,b),TypeError);
assert.notDeepEqual(summarizePerformanceHistoryComparisons(home,away,{...options,seed:12}).teams,r.teams);
for(const periods of [0,1,13,1.5])assert.throws(()=>summarizePerformanceHistoryComparisons(home,away,{...options,periods}),RangeError);
for(const gamesPerPeriod of [0,31,1.5])assert.throws(()=>summarizePerformanceHistoryComparisons(home,away,{...options,gamesPerPeriod}),RangeError);
assert.throws(()=>summarizePerformanceHistoryComparisons([...home,home[0]],away,options),/Duplicate player ID/);
console.log('Mission 1146 player/team pairwise comparisons, conservation, replay, identity and sample safeguards passed');
