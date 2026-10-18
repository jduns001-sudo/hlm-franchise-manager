'use strict';
const assert=require('node:assert/strict');
const {createSession}=require('./hlm-phase11-playable-session');
const {createBridge,KEY}=require('./hlm-phase11-gameplay-bridge');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
function fixture(){
 const teams=[{id:1,name:'Portland'},{id:2,name:'Seattle'},{id:3,name:'Victoria'}];
 const games=[{id:'g1',date:'2026-10-18',homeTeamId:1,awayTeamId:2,status:'scheduled'},{id:'g2',date:'2026-10-19',homeTeamId:3,awayTeamId:1,status:'scheduled'},{id:'g3',date:'2026-10-20',homeTeamId:1,awayTeamId:3,status:'scheduled'}];
 let stored=JSON.stringify({meta:{controlledTeamId:1,currentDate:'2026-10-17'},universe:{teams,players:[{id:99,teamId:1,position:'C'}]},activity:{games},privateNotes:'secret private GM notes'}),writes=0;
 const storage={getItem:k=>k===KEY?stored:null,setItem(k,v){assert.equal(k,KEY);stored=v;writes++;}};
 const engine={createBrowserFranchiseSaveStore:()=>({load:()=>JSON.parse(stored),advanceAndSave(seed){const state=JSON.parse(stored),day=state.activity.games.find(g=>g.status==='scheduled');assert.ok(day);const result=simulateGameScore({gameId:day.id,homeTeamId:day.homeTeamId,awayTeamId:day.awayTeamId,seed});day.status='final';day.homeGoals=result.homeGoals;day.awayGoals=result.awayGoals;day.winnerTeamId=result.winnerTeamId;const fromDate=state.meta.currentDate;state.meta.currentDate=day.date;stored=JSON.stringify(state);writes++;return {fromDate,toDate:day.date,results:[{...day}]}}}),calculateStandings:(teams,games)=>teams.map(t=>({teamId:t.id,played:games.filter(g=>g.status==='final'&&(g.homeTeamId===t.id||g.awayTeamId===t.id)).length}))};
 return {storage,bridge:createBridge(engine,storage),writes:()=>writes,raw:()=>stored};
}
function run(seed){const f=fixture(),session=createSession(f.bridge);assert.equal(session.inspect().snapshot.rosterAvailability,'present-unverified');assert.equal(session.inspect().snapshot.nextGame.opponent,'Seattle');assert.equal(session.inspect().snapshot.scheduledGames,3);assert.equal(session.inspect().snapshot.standings[0].played,0);assert.throws(()=>session.approveOneDay(false,seed),/approval/);assert.equal(f.writes(),0);
 const first=session.approveOneDay(true,seed);assert.equal(first.completedApprovedDays,1);assert.equal(first.snapshot.completedControlledGames,1);assert.equal(first.snapshot.scheduledGames,2);assert.equal(first.snapshot.nextGame.opponent,'Victoria');assert.equal(first.snapshot.standings[0].played,1);
 const reloaded=createBridge({createBrowserFranchiseSaveStore:()=>({load:()=>JSON.parse(f.raw())}),calculateStandings:(teams,games)=>teams.map(t=>({teamId:t.id,played:games.filter(g=>g.status==='final'&&(g.homeTeamId===t.id||g.awayTeamId===t.id)).length}))},f.storage);
 assert.equal(reloaded.playableFranchiseSnapshot().completedControlledGames,1);assert.equal(reloaded.playableFranchiseSnapshot().asOfDate,'2026-10-18');
 const second=session.approveOneDay(true,seed+1);assert.equal(second.snapshot.completedControlledGames,2);assert.equal(second.snapshot.standings[0].played,2);assert.equal(second.snapshot.nextGame.date,'2026-10-20');assert.equal(f.writes(),2);
 const cancel=session.cancel();assert.equal(cancel.cancelled,true);assert.throws(()=>session.approveOneDay(true,seed+2),/cancelled/);assert.equal(f.writes(),2);
 const resumed=session.reset();assert.equal(resumed.cancelled,false);const third=session.approveOneDay(true,seed+2);assert.equal(third.snapshot.completedControlledGames,3);assert.equal(third.snapshot.simulationAvailable,false);assert.equal(third.snapshot.scheduledGames,0);assert.equal(f.writes(),3);
 assert.equal(JSON.stringify(third).includes('secret private GM notes'),false);assert.equal(third.finalDecisionMaker,'human-gm');assert.equal(third.productionActivationAllowed,false);assert.equal(third.automaticTransactionsAllowed,false);
 return f.raw();
}
assert.equal(run(123),run(123));console.log('Mission 1311 deterministic multi-day, save/reload, GM cancel and privacy acceptance passed');
