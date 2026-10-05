'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextEventCalendarReplacementCleanupAuthorization}=require('./hlm-calendar-next-event-replacement-cleanup-authorization');
const {executeNextEventCalendarReplacementCleanup}=require('./hlm-calendar-next-event-replacement-cleanup-executor');
const {verifyNextEventCalendarReplacementCleanup}=require('./hlm-calendar-next-event-replacement-cleanup-verification');
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function fixture(){
 const repository=createBrowserSaveAdapter(memoryStorage());
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('next-event-staging',state,{saveId:'next-event-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'}),replacementExecution=Object.freeze({candidateState:state,targetEvent});
 const completion=Object.freeze({kind:'next-event-calendar-replacement-transaction-completion',complete:true,candidateSlotId:'next-event-staging',
  targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,checkpoint,execution:replacementExecution});
 const readiness=Object.freeze({kind:'next-event-calendar-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,
  cleanupPerformed:false,candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,completion,checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createNextEventCalendarReplacementCleanupAuthorization({readiness,approved:true});
 const execution=executeNextEventCalendarReplacementCleanup({readiness,authorization,repository});
 return{repository,state,targetEvent,checkpoint,readiness,authorization,completion,execution};
}
{
 const f=fixture(),r=verifyNextEventCalendarReplacementCleanup({execution:f.execution,repository:f.repository});
 assert.strictEqual(r.kind,'next-event-calendar-replacement-cleanup-verification');assert.strictEqual(r.verified,true);
 assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.targetMatchesAuthorizedCandidate,true);
 assert.strictEqual(r.checkpointPreserved,true);assert.strictEqual(r.lineageIntact,true);assert.strictEqual(r.targetEvent,f.targetEvent);
 assert.strictEqual(r.checkpoint,f.checkpoint);assert.strictEqual(r.readiness,f.readiness);assert.strictEqual(r.authorization,f.authorization);
 assert.strictEqual(f.repository.has('next-event-staging'),false);assert.strictEqual(f.repository.has('franchise'),true);assert.strictEqual(Object.isFrozen(r),true);
}
{
 const f=fixture();f.repository.save('next-event-staging',f.state,{saveId:'next-event-staging'});
 assert.throws(()=>verifyNextEventCalendarReplacementCleanup({execution:f.execution,repository:f.repository}),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');
}
{
 const f=fixture();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>verifyNextEventCalendarReplacementCleanup({execution:f.execution,repository:f.repository}),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');
}
{
 const f=fixture(),broken={...f.execution,targetEvent:{...f.targetEvent}};
 assert.throws(()=>verifyNextEventCalendarReplacementCleanup({execution:broken,repository:f.repository}),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED');
}
console.log('Next-event calendar replacement cleanup verification tests passed.');
