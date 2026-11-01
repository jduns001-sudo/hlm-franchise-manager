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
console.log('Mobile lifecycle one-time GM review, stale, decline and existing-manager delegation passed');

// Revision-bound asynchronous path; persisted-state CAS is owned by the manager.
(async()=>{
 const {createTransactional}=require('./hlm-phase11-guarded-mobile-lifecycle');
 let assertions=0,token={epoch:'epoch-a',revision:1},persisted=1,resolveCommit,fail=false;
 const handles=new Set();state.extensions={};
 const transactional={peek:()=>state,snapshotToken:()=>({...token}),prepare:(action,args)=>{const h={action,args:structuredClone(args),token:{...token}};handles.add(h);return h},cancel:h=>{handles.delete(h)},execute:async(h,approved)=>{assert.equal(approved,true);assert.ok(handles.delete(h));if(h.token.revision!==persisted)throw Object.assign(Error('stale'),{code:'STALE_REVISION'});await new Promise(ok=>resolveCommit=ok);if(fail)throw Object.assign(Error('abort'),{code:'TRANSACTION_ABORTED'});persisted++;token={...token,revision:persisted};return {action:h.action,args:h.args}}};
 const g=createTransactional(transactional),check=v=>{assert.ok(v);assertions++};
 let r=g.review('playoffs');check(r.epoch==='epoch-a'&&r.revision===1);g.decline(r.reviewSequence);await assert.rejects(()=>g.approve(r.reviewSequence),/Stale/);assertions++;
 r=g.review('playoffs');let done=false;const result=g.approve(r.reviewSequence).then(x=>{done=true;return x});await Promise.resolve();check(!done&&persisted===1);resolveCommit();const out=await result;check(out.action==='startPlayoffs'&&out.args[0]===4&&persisted===2);await assert.rejects(()=>g.approve(r.reviewSequence),/Stale/);assertions++;
 r=g.review('playoffs');token={epoch:'epoch-b',revision:2};await assert.rejects(()=>g.approve(r.reviewSequence),/changed/);assertions++;
 r=g.review('playoffs');persisted=3;await assert.rejects(()=>g.approve(r.reviewSequence),e=>e.code==='STALE_REVISION');assertions++;
 token={epoch:'epoch-b',revision:3};r=g.review('playoffs');fail=true;const abort=g.approve(r.reviewSequence);await Promise.resolve();resolveCommit();await assert.rejects(()=>abort,e=>e.code==='TRANSACTION_ABORTED');assertions++;check(persisted===3);await assert.rejects(()=>g.approve(r.reviewSequence),/Stale/);assertions++;
 r=g.review('playoffs');g.clear();await assert.rejects(()=>g.approve(r.reviewSequence),/Stale/);assertions++;
 console.log(JSON.stringify({status:'passed',transactionalAssertions:assertions,note:'Existing synchronous lifecycle assertions also passed'}));
})().catch(e=>{console.error(e);process.exitCode=1});
