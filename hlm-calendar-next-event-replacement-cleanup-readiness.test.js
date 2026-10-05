'use strict';
const assert=require('assert');
const { DEFAULT_STORAGE_KEY,createBrowserSaveAdapter }=require('./hlm-browser-save-adapter');
const { createGameStateEnvelope }=require('./hlm-game-state');
const { evaluateNextEventCalendarReplacementCleanupReadiness }=require('./hlm-calendar-next-event-replacement-cleanup-readiness');

function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function build(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});
 repository.save('next-event-staging',state,{saveId:'next-event-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'});
 const authorization=Object.freeze({targetEvent});
 const execution=Object.freeze({targetEvent,candidateState:state});
 const verification=Object.freeze({execution,authorization,checkpoint,targetEvent});
 const completion=Object.freeze({
  kind:'next-event-calendar-replacement-transaction-completion',version:1,complete:true,
  durableVerificationComplete:true,cleanupPerformed:false,checkpointPreserved:true,stagingSlotPreserved:true,
  candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,verification,execution,authorization,checkpoint,state
 });
 return{storage,repository,state,targetEvent,completion};
}
{
 const f=build(),r=evaluateNextEventCalendarReplacementCleanupReadiness(f);
 assert.strictEqual(r.kind,'next-event-calendar-replacement-cleanup-readiness');
 assert.strictEqual(r.ready,true);assert.strictEqual(r.cleanupAuthorized,false);assert.strictEqual(r.cleanupPerformed,false);
 assert.strictEqual(r.targetEvent,f.targetEvent);assert.strictEqual(r.completion,f.completion);assert.strictEqual(r.checkpoint,f.completion.checkpoint);
 assert.strictEqual(r.requirements.explicitCleanupAuthorizationRequired,true);assert.strictEqual(r.requirements.targetMustRemainDurable,true);
 assert.strictEqual(Object.isFrozen(r),true);assert.strictEqual(Object.isFrozen(r.requirements),true);
 assert.strictEqual(f.repository.has('next-event-staging'),true);assert.strictEqual(f.repository.has('franchise'),true);
}
{
 const f=build();f.repository.remove('next-event-staging');
 assert.throws(()=>evaluateNextEventCalendarReplacementCleanupReadiness(f),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');
}
{
 const f=build();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>evaluateNextEventCalendarReplacementCleanupReadiness(f),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');
}
{
 const f=build();
 assert.throws(()=>evaluateNextEventCalendarReplacementCleanupReadiness({...f,completion:{...f.completion,targetEvent:{...f.targetEvent}}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_NOT_READY');
}
console.log('Next-event calendar replacement cleanup readiness tests passed.');
