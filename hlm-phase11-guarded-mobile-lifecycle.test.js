'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {create}=require('./hlm-phase11-guarded-mobile-lifecycle');
const html=fs.readFileSync(require('node:path').join(__dirname,'hlm-phase11-isolated-single-game.html'),'utf8');
assert.match(html,/hlm-phase11-guarded-mobile-lifecycle\.js/);
for(const action of ['playoffs','playoff-game','archive'])assert.ok(html.includes("lifecycleReview.review('"+action+"'"),'mobile handler '+action);
let raw='ORIGINAL',calls=[],status='playoffs';
const key='hlm-phase11-m1340-isolated-single-game-v1';
const state={meta:{controlledTeamId:1},universe:{teams:[{id:1},{id:2},{id:3},{id:4}]},activity:{games:[{status:'final'}]},history:{seasons:[]},extensions:{}};
const storage={getItem:k=>k===key?raw:null};
const manager={peek:()=>state,startPlayoffs:(...a)=>{calls.push(['playoffs',...a]);return {seeds:[{teamId:1}]}},advancePlayoff:(...a)=>{calls.push(['game',...a]);return {result:{gameId:'PO-1'}}},archiveSeason:(...a)=>{calls.push(['archive',...a]);return {summary:{championTeamId:1}}}};
const guard=create(manager,storage,key);
assert.throws(()=>create(manager,storage,'hlm_front_office_v8'),/isolated/);
let r=guard.review('playoffs');assert.equal(guard.decline(r.reviewSequence).saved,false);assert.equal(calls.length,0);assert.throws(()=>guard.approve(r.reviewSequence),/Stale/);
r=guard.review('playoffs');raw='OTHER';assert.throws(()=>guard.approve(r.reviewSequence),/changed/);assert.equal(calls.length,0);raw='ORIGINAL';
r=guard.review('playoffs');assert.equal(guard.approve(r.reviewSequence).seeds[0].teamId,1);assert.throws(()=>guard.approve(r.reviewSequence),/Stale/);
state.extensions.phase10Playoffs={status:'active'};r=guard.review('playoff-game');guard.approve(r.reviewSequence);assert.deepEqual(calls[1],['game',1350,true]);
state.extensions.phase10Playoffs={status:'complete',championTeamId:1};r=guard.review('archive',{seasonId:'2026-27'});guard.approve(r.reviewSequence);assert.deepEqual(calls[2],['archive','2026-27',true]);
assert.equal(calls.length,3);

// Playoff-game decline and replay must not mutate series wins or persisted finals.
const playoffHistory=[];
let seriesWins=0;
const guardedPlayoffManager={
 peek:()=>state,
 advancePlayoff:()=>{seriesWins++;playoffHistory.push({gameId:'PO-'+seriesWins});return {result:playoffHistory.at(-1)}},
 startPlayoffs:()=>{throw Error('unexpected playoff start')},
 archiveSeason:()=>{throw Error('unexpected archive')}
};
state.extensions.phase10Playoffs={status:'active'};
const playoffGuard=create(guardedPlayoffManager,storage,key);
const beforeDecline=JSON.stringify({seriesWins,playoffHistory});
const declinedGame=playoffGuard.review('playoff-game');
assert.equal(playoffGuard.decline(declinedGame.reviewSequence).saved,false);
assert.throws(()=>playoffGuard.approve(declinedGame.reviewSequence),/Stale/);
assert.equal(JSON.stringify({seriesWins,playoffHistory}),beforeDecline);
const approvedGame=playoffGuard.review('playoff-game');
assert.equal(playoffGuard.approve(approvedGame.reviewSequence).result.gameId,'PO-1');
const afterApproval=JSON.stringify({seriesWins,playoffHistory});
assert.throws(()=>playoffGuard.approve(approvedGame.reviewSequence),/Stale/);
assert.equal(JSON.stringify({seriesWins,playoffHistory}),afterApproval);
assert.equal(seriesWins,1);
assert.deepEqual(playoffHistory,[{gameId:'PO-1'}]);

console.log('Mobile lifecycle one-time GM review, stale, decline and existing-manager delegation passed');
