'use strict';
const assert=require('node:assert/strict');
const {summarizePerformanceComparisonInsights,interpretPair}=require('./hlm-phase11-performance-comparison-insights');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,periods:3,gamesPerPeriod:7};
const input=JSON.stringify([home,away,options]);
const r=summarizePerformanceComparisonInsights(home,away,options);
assert.deepEqual(r,summarizePerformanceComparisonInsights(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.periodCount,3);assert.equal(r.totalGames,21);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.players.length,20);assert.equal(r.playerPairInsights.length,190);
assert.equal(r.evidenceCounts.comparable+r.evidenceCounts.insufficient,190);
assert.equal(new Set(r.players.map(p=>p.team+':'+p.playerId)).size,20);
assert(r.playerPairInsights.every(p=>p.descriptiveOnly&&p.notPredictive&&p.notScoutingGrade&&p.notDecisionAdvice));
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side].insight,rows=r.players.filter(p=>p.team===side).map(p=>p.insight);
 assert.equal(sum(rows,'shots'),t.shots);assert.equal(sum(rows,'goals'),t.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.expectedGoals)<.00005);
}
assert.equal(r.teamPairInsight.shotsDifference,r.teams.home.insight.shots-r.teams.away.insight.shots);
assert.equal(r.teamPairInsight.goalsDifference,r.teams.home.insight.goals-r.teams.away.insight.goals);
const pair={left:{team:'home',playerId:'H1'},right:{team:'away',playerId:'A1'},
 sampleEligible:true,shotsDifference:10,goalsDifference:-2,expectedGoalsDifference:0,
 observedFinishingGapDifference:1,stabilityChangeDifference:null,
 leftPersistentSignal:'improving-observed',rightPersistentSignal:null};
const interpreted=interpretPair(pair);
assert.equal(interpreted.observedShotsDirection,'left-higher-observed');
assert.equal(interpreted.observedGoalsDirection,'right-higher-observed');
assert.equal(interpreted.observedExpectedGoalsDirection,'equal-observed');
assert.equal(interpreted.trendContext,'different-persistent-observed-trends');
assert.equal(interpreted.stabilityChangeDirection,'not-comparable');
const insufficient=interpretPair({...pair,sampleEligible:false});
assert.equal(insufficient.observedShotsDirection,'not-comparable');
assert.equal(insufficient.trendContext,'insufficient-period-evidence');
assert.equal(insufficient.evidenceTier,'insufficient-period-evidence');
assert.throws(()=>interpretPair(null),TypeError);
assert.notDeepEqual(summarizePerformanceComparisonInsights(home,away,{...options,seed:12}).teams,r.teams);
for(const periods of [0,1,13,1.5])assert.throws(()=>summarizePerformanceComparisonInsights(home,away,{...options,periods}),RangeError);
for(const gamesPerPeriod of [0,31,1.5])assert.throws(()=>summarizePerformanceComparisonInsights(home,away,{...options,gamesPerPeriod}),RangeError);
assert.throws(()=>summarizePerformanceComparisonInsights([...home,home[0]],away,options),/Duplicate player ID/);
console.log('Mission 1147 comparison interpretations, evidence, conservation, replay and safety passed');
