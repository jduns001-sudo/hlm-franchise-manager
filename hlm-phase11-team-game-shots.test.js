'use strict';
const assert=require('node:assert/strict');
const {summarizeTeamGame}=require('./hlm-phase11-team-game-shots');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const options={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11};
const report=summarizeTeamGame(home,away,options);
assert.deepEqual(summarizeTeamGame(home,away,options),report);
assert.equal(JSON.stringify([home,away]),before);
assert.equal(report.periodReports.length,3);
assert.equal(report.home.shotsFor,report.away.shotsAgainst);
assert.equal(report.away.shotsFor,report.home.shotsAgainst);
assert.equal(report.home.goalsFor,report.away.goalsAgainst);
assert.equal(report.away.goalsFor,report.home.goalsAgainst);
for(const [side,opponent] of [[report.home,report.away],[report.away,report.home]]){
 assert.equal(side.shotsFor,side.goalsFor+opponent.saves);
 assert.equal(side.shotsAgainst,side.goalsAgainst+side.saves);
 assert.equal(side.shootingPercentage,side.shotsFor?Number((side.goalsFor/side.shotsFor).toFixed(6)):null);
 assert.equal(side.savePercentage,side.shotsAgainst?Number((side.saves/side.shotsAgainst).toFixed(6)):null);
}
for(const side of ['home','away']){
 for(const field of ['shotsFor','shotsAgainst','goalsFor','goalsAgainst','expectedGoalsFor','expectedGoalsAgainst']){
  const expected=report.periodReports.reduce((n,p)=>n+p[side][field],0);
  assert(Math.abs(report[side][field]-expected)<1e-4,side+' '+field);
 }
}
assert.equal(report.productionActivationEnabled,false);
assert.equal(report.automaticallyApplied,false);
assert.equal(report.requiresGMApproval,true);
let strongGA=0,weakGA=0,strongXGA=0,weakXGA=0;
for(let seed=0;seed<250;seed++){
 const strong=summarizeTeamGame(home,away,{...options,homeGoalie:{id:'HG',ovr:115},seed});
 const weak=summarizeTeamGame(home,away,{...options,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(strong.home.shotsAgainst,weak.home.shotsAgainst);
 strongGA+=strong.home.goalsAgainst;weakGA+=weak.home.goalsAgainst;
 strongXGA+=strong.home.expectedGoalsAgainst;weakXGA+=weak.home.expectedGoalsAgainst;
}
assert(strongXGA<weakXGA);assert(strongGA<weakGA);
assert.throws(()=>summarizeTeamGame(home,away,{seed:-1}),TypeError);
assert.throws(()=>summarizeTeamGame(home,away,{periods:0}),RangeError);
console.log('Mission 1129 team shot conservation, scoring, reproducibility, goalie sensitivity and isolation passed');
