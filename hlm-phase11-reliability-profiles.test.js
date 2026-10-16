'use strict';
const assert=require('node:assert/strict');
const {summarizeReliabilityProfiles,profile}=require('./hlm-phase11-reliability-profiles');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const input=JSON.stringify([home,away,options]);
const r=summarizeReliabilityProfiles(home,away,options);
assert.deepEqual(r,summarizeReliabilityProfiles(home,away,options));
assert.equal(JSON.stringify([home,away,options]),input);
assert.equal(r.games,7);assert.equal(r.productionActivationEnabled,false);
assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
assert.equal(r.comparisons.length,r.players.length);
assert.deepEqual(r.comparisons.map(p=>p.rank),Array.from({length:r.players.length},(_,i)=>i+1));
assert.equal(new Set(r.comparisons.map(p=>p.team+':'+p.playerId)).size,r.players.length);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
for(const side of ['home','away']){
 const t=r.teams[side],members=r.players.filter(p=>p.team===side),rows=members.map(p=>p.reliabilityProfile);
 assert.equal(sum(rows,'shots'),t.reliabilityProfile.shots);
 assert.equal(sum(rows,'goals'),t.reliabilityProfile.goals);
 assert(Math.abs(sum(rows,'expectedGoals')-t.reliabilityProfile.expectedGoals)<0.00002);
 for(const p of members){
  assert.equal(p.reliabilityProfile.shots,p.shots);assert.equal(p.reliabilityProfile.goals,p.goals);
  assert.equal(p.reliabilityProfile.notPredictive,true);assert.equal(p.reliabilityProfile.notScoutingGrade,true);
  assert(['insufficient-data','emerging-evidence','more-consistent-observed','mixed-observed','less-consistent-observed'].includes(p.reliabilityProfile.reliabilityTier));
 }
}
const sample=(eligibility,stabilityScore,shots=30,shotGames=5,gap=0)=>({
 consistencyScore:{games:7,shots,goals:2,expectedGoals:1.5,shotGames,eligibility,stabilityScore},
 finishingConfidence:{sampleSizeTier:'small',finishingGap:gap,observedShootingPercentage:.1,expectedShootingPercentage:.08},
 volatility:{shootingPercentageStdDev:.1,expectedGoalsPerGameStdDev:.1},
 rolling3Volatility:[],rolling5Volatility:[]});
assert.equal(profile(sample('insufficient-sample',90)).reliabilityTier,'insufficient-data');
assert.equal(profile(sample('provisional',90)).reliabilityTier,'emerging-evidence');
assert.equal(profile(sample('comparable',80)).reliabilityTier,'more-consistent-observed');
assert.equal(profile(sample('comparable',55)).reliabilityTier,'mixed-observed');
assert.equal(profile(sample('comparable',25)).reliabilityTier,'less-consistent-observed');
assert.equal(profile(sample('comparable',80,30,5,.08)).gapDescription,'above-expected-observed');
assert.equal(profile(sample('comparable',80,30,5,-.08)).gapDescription,'below-expected-observed');
assert.equal(profile(sample('comparable',80,30,5,0)).gapDescription,'near-expected-observed');
assert.equal(profile(sample('insufficient-sample',null,0,0,null)).gapDescription,'no-shots');
assert.notDeepEqual(summarizeReliabilityProfiles(home,away,{...options,seed:12}).teams,r.teams);
assert.throws(()=>summarizeReliabilityProfiles(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeReliabilityProfiles([...home,home[0]],away,options),/Duplicate player ID/);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizeReliabilityProfiles(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeReliabilityProfiles(home,away,{...options,games:6,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.reliabilityProfile.expectedGoals;weak+=b.teams.away.reliabilityProfile.expectedGoals;
}
assert(strong<weak);
console.log('Mission 1142 reliability tiers, comparison identities, conservation, replay and goalie sensitivity passed');
