'use strict';
const assert=require('node:assert/strict');
const {summarizeRollingStreaks,rolling,streak}=require('./hlm-phase11-rolling-streaks');
const home=Array.from({length:10},(_,i)=>({id:'H'+i,position:i<6?'F':'D',ovr:85}));
const away=Array.from({length:10},(_,i)=>({id:'A'+i,position:i<6?'F':'D',ovr:75}));
const before=JSON.stringify([home,away]);
const opts={homeGoalie:{id:'HG',ovr:88},awayGoalie:{id:'AG',ovr:78},seed:11,games:7};
const r=summarizeRollingStreaks(home,away,opts);
assert.deepEqual(r,summarizeRollingStreaks(home,away,opts));
assert.equal(JSON.stringify([home,away]),before);
const sum=(xs,k)=>xs.reduce((n,x)=>n+x[k],0);
assert.equal(r.games,7);
for(const team of ['home','away']){
 const members=r.players.filter(p=>p.team===team),t=r.teams[team];
 assert.equal(t.rolling3.length,5);assert.equal(t.rolling5.length,3);
 for(const p of members){
  assert.equal(p.rolling3.length,5);assert.equal(p.rolling5.length,3);
  assert(['hot','cold','neutral'].includes(p.streak.status));
  assert(!(p.streak.hotGames&&p.streak.coldGames));
  for(const size of [3,5])for(const w of p['rolling'+size]){
   const games=p.gameTrends.slice(w.endingGame-size,w.endingGame);
   assert.equal(sum(games,'shots'),w.shots);assert.equal(sum(games,'goals'),w.goals);
   assert(Math.abs(sum(games,'expectedGoals')-w.expectedGoals)<0.000005);
   assert.equal(w.shootingPercentage,w.shots?Number((w.goals/w.shots).toFixed(6)):null);
  }
 }
 for(const size of [3,5])for(const w of t['rolling'+size]){
  const rows=members.map(p=>p['rolling'+size].find(x=>x.endingGame===w.endingGame));
  assert.equal(sum(rows,'shots'),w.shots);assert.equal(sum(rows,'goals'),w.goals);
  assert(Math.abs(sum(rows,'expectedGoals')-w.expectedGoals)<0.00002);
 }
}
assert.deepEqual(rolling([{shots:2,goals:1,expectedGoals:.5},{shots:1,goals:0,expectedGoals:.3}],3),[]);
assert.equal(streak([{goals:1,expectedGoals:.3},{goals:2,expectedGoals:.6}]).status,'hot');
assert.equal(streak([{goals:0,expectedGoals:.3},{goals:0,expectedGoals:.6}]).status,'cold');
assert.equal(streak([{goals:0,expectedGoals:.3},{goals:1,expectedGoals:.6}]).status,'neutral');
assert.equal(summarizeRollingStreaks(home,away,{...opts,games:2}).teams.home.rolling3.length,0);
assert.equal(summarizeRollingStreaks(home,away,{...opts,games:3}).teams.home.rolling5.length,0);
assert.throws(()=>summarizeRollingStreaks(home,away,{games:0}),RangeError);
assert.throws(()=>summarizeRollingStreaks(home,away,{games:31}),RangeError);
assert.throws(()=>summarizeRollingStreaks([...home,home[0]],away,opts),/Duplicate player ID/);
assert.throws(()=>summarizeRollingStreaks([{...home[0],id:null},...home.slice(1)],away,opts),/Player ID/);
assert.notDeepEqual(summarizeRollingStreaks(home,away,{...opts,seed:12}).teams,r.teams);
assert.equal(r.productionActivationEnabled,false);assert.equal(r.automaticallyApplied,false);assert.equal(r.requiresGMApproval,true);
let strong=0,weak=0;
for(let seed=0;seed<20;seed++){
 const a=summarizeRollingStreaks(home,away,{...opts,games:5,homeGoalie:{id:'HG',ovr:115},seed});
 const b=summarizeRollingStreaks(home,away,{...opts,games:5,homeGoalie:{id:'HG',ovr:45},seed});
 assert.equal(a.teams.away.shots,b.teams.away.shots);
 strong+=a.teams.away.gameTrends.reduce((n,g)=>n+g.expectedGoals,0);
 weak+=b.teams.away.gameTrends.reduce((n,g)=>n+g.expectedGoals,0);
}
assert(strong<weak);
console.log('Mission 1137 rolling windows, streaks, conservation and reproducibility passed');
