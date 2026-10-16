'use strict';
const assert=require('node:assert/strict');
const {summarizeGoalTimeline}=require('./hlm-phase11-goal-timeline');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const report=summarizeGoalTimeline(home,away,options);
assert.deepEqual(summarizeGoalTimeline(home,away,options),report);
assert.equal(JSON.stringify([home,away]),before);
assert.equal(report.timeline.length,report.homeScore+report.awayScore);
assert.equal(report.homeScore,report.home.goalsFor);
assert.equal(report.awayScore,report.away.goalsFor);
assert.equal(report.periodSummaries.length,3);
assert.equal(report.periodSummaries.reduce((n,p)=>n+p.goalEvents,0),report.timeline.length);
assert.equal(report.periodSummaries.reduce((n,p)=>n+p.homeGoals,0),report.homeScore);
assert.equal(report.periodSummaries.reduce((n,p)=>n+p.awayGoals,0),report.awayScore);
let h=0,a=0,last=-1;
for(const event of report.timeline){
 assert(event.gameSecond>=last);last=event.gameSecond;
 assert(event.second>=0&&event.second<1200);
 assert(event.gameClock.match(/^\d{2}:\d{2}$/));
 assert.equal(event.period,Math.floor(event.gameSecond/1200)+1);
 assert(event.scorerId);
 if(event.scoringTeam==='home')h++;else a++;
 assert.equal(event.homeScore,h);assert.equal(event.awayScore,a);
}
assert.equal(report.productionActivationEnabled,false);
assert.equal(report.automaticallyApplied,false);
assert.equal(report.requiresGMApproval,true);
let strongGoals=0,weakGoals=0;
for(let seed=0;seed<180;seed++){
 const strong=summarizeGoalTimeline(home,away,{...options,homeGoalie:{id:'HG',ovr:115},seed});
 const weak=summarizeGoalTimeline(home,away,{...options,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(strong.away.shotsFor,weak.away.shotsFor);
 strongGoals+=strong.awayScore;weakGoals+=weak.awayScore;
}
assert(strongGoals<weakGoals);
assert.throws(()=>summarizeGoalTimeline(home,away,{periods:0}),RangeError);
assert.throws(()=>summarizeGoalTimeline(home,away,{seed:-1}),TypeError);
console.log('Mission 1130 goal timeline, clock, score conservation, seeded replay and goalie sensitivity passed');
