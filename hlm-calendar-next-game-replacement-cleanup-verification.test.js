'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextGameCalendarReplacementCleanupAuthorization}=require('./hlm-calendar-next-game-replacement-cleanup-authorization');
const {executeNextGameCalendarReplacementCleanup}=require('./hlm-calendar-next-game-replacement-cleanup-executor');
const {verifyNextGameCalendarReplacementCleanup}=require('./hlm-calendar-next-game-replacement-cleanup-verification');
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function fixture(){
 const repository=createBrowserSaveAdapter(memoryStorage());
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('next-game-staging',state,{saveId:'next-game-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'}),replacementExecution=Object.freeze({candidateState:state,targetGame});
 const completion=Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',complete:true,candidateSlotId:'next-game-staging',
  targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,checkpoint,execution:replacementExecution});
 const readiness=Object.freeze({kind:'next-game-calendar-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,
  cleanupPerformed:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,completion,checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createNextGameCalendarReplacementCleanupAuthorization({readiness,approved:true});
 const execution=executeNextGameCalendarReplacementCleanup({readiness,authorization,repository});
 return{repository,state,targetGame,checkpoint,readiness,authorization,completion,execution};
}
{const f=fixture(),r=verifyNextGameCalendarReplacementCleanup({execution:f.execution,repository:f.repository});
 assert.strictEqual(r.kind,'next-game-calendar-replacement-cleanup-verification');assert.strictEqual(r.verified,true);
 assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.targetMatchesAuthorizedCandidate,true);
 assert.strictEqual(r.checkpointPreserved,true);assert.strictEqual(r.lineageIntact,true);assert.strictEqual(r.targetGame,f.targetGame);
 assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.checkpoint,f.checkpoint);assert.strictEqual(r.readiness,f.readiness);
 assert.strictEqual(r.authorization,f.authorization);assert.strictEqual(f.repository.has('next-game-staging'),false);
 assert.strictEqual(f.repository.has('franchise'),true);assert.strictEqual(Object.isFrozen(r),true);}
{const f=fixture();f.repository.save('next-game-staging',f.state,{saveId:'next-game-staging'});
 assert.throws(()=>verifyNextGameCalendarReplacementCleanup({execution:f.execution,repository:f.repository}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');}
{const f=fixture();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>verifyNextGameCalendarReplacementCleanup({execution:f.execution,repository:f.repository}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');}
{const f=fixture(),broken={...f.execution,targetGame:{...f.targetGame}};
 assert.throws(()=>verifyNextGameCalendarReplacementCleanup({execution:broken,repository:f.repository}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');}
console.log('Next-game calendar replacement cleanup verification tests passed.');
