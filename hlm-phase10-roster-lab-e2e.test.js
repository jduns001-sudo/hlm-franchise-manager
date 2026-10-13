'use strict';
const assert=require('node:assert/strict');
const {createRosterLabFranchise}=require('./hlm-phase10-roster-lab-entry');
const {createRosterLabSeasonStore}=require('./hlm-phase10-roster-lab-season-store');
const memory=new Map([['hlm-phase10-demo-v1','DO_NOT_TOUCH']]);
const storage={getItem:key=>memory.get(key)??null,setItem:(key,v)=>memory.set(key,v)};
const store=createRosterLabSeasonStore(storage);
store.save(createRosterLabFranchise());
let days=0;
while(store.load().activity.games.some(g=>g.status==='scheduled')&&days<40){
 const s=store.load();
 const result=store.advanceAndSave(20261014+days);
 assert(result.advanced);assert(result.saved);days++;
}
assert.equal(days,28);
const finished=store.load();
assert.equal(finished.activity.games.filter(g=>g.status==='final').length,56);
const goals=finished.activity.games.reduce((n,g)=>n+g.homeGoals+g.awayGoals,0);
assert.equal(finished.extensions.phase10ExperimentalGoalEvents.length,goals);
assert.equal(finished.extensions.phase10ExperimentalGoalLeaders.reduce((n,p)=>n+p.goals,0),goals);
store.startPlayoffsAndSave();
assert.equal(store.load().extensions.phase10Playoffs.status,'active');
let count=0;
while(store.load().extensions.phase10Playoffs.status==='active'&&count<30){
 const result=store.playoffGameAndSave(100+count);
 assert(result.advanced);count++;
}
assert(count>=8&&count<=21);
assert.equal(store.load().extensions.phase10Playoffs.status,'complete');
assert([1,2,3,4].includes(store.load().extensions.phase10Playoffs.championTeamId));
assert.equal(memory.get('hlm-phase10-demo-v1'),'DO_NOT_TOUCH');
assert.throws(()=>store.startPlayoffsAndSave(),/already started/);
console.log('Mission 751 complete roster season to championship test passed: '+days+' days, '+count+' playoff games.');
