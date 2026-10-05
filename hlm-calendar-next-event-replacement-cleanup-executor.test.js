'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createNextEventCalendarReplacementCleanupAuthorization}=require('./hlm-calendar-next-event-replacement-cleanup-authorization');
const {executeNextEventCalendarReplacementCleanup}=require('./hlm-calendar-next-event-replacement-cleanup-executor');
const {serializeGameState}=require('./hlm-game-state-serialization');
function memoryStorage(){const d=new Map();return{getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
function fixture(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
 const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
 repository.save('franchise',state,{saveId:'franchise'});repository.save('next-event-staging',state,{saveId:'next-event-staging'});
 const checkpoint=Object.freeze({marker:'checkpoint'});
 const execution=Object.freeze({candidateState:state,targetEvent});
 const completion=Object.freeze({kind:'next-event-calendar-replacement-transaction-completion',complete:true,
  candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,checkpoint,execution});
 const readiness=Object.freeze({kind:'next-event-calendar-replacement-cleanup-readiness',version:1,ready:true,
  cleanupAuthorized:false,cleanupPerformed:false,candidateSlotId:'next-event-staging',targetSlotId:'franchise',
  storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,completion,checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
 const authorization=createNextEventCalendarReplacementCleanupAuthorization({readiness,approved:true});
 return{storage,repository,state,targetEvent,readiness,authorization,checkpoint};
}
{
 const f=fixture(),before=serializeGameState(f.repository.load('franchise').state);
 const r=executeNextEventCalendarReplacementCleanup(f);
 assert.strictEqual(r.kind,'next-event-calendar-replacement-cleanup-execution');assert.strictEqual(r.executed,true);
 assert.strictEqual(r.verified,true);assert.strictEqual(r.stagingSlotRemoved,true);assert.strictEqual(r.checkpointPreserved,true);
 assert.strictEqual(r.targetEvent,f.targetEvent);assert.strictEqual(r.checkpoint,f.checkpoint);
 assert.strictEqual(f.repository.has('next-event-staging'),false);assert.strictEqual(f.repository.has('franchise'),true);
 assert.strictEqual(serializeGameState(f.repository.load('franchise').state),before);assert.strictEqual(Object.isFrozen(r),true);
}
{
 const f=fixture();assert.throws(()=>executeNextEventCalendarReplacementCleanup({...f,authorization:{...f.authorization,approved:false}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');assert.strictEqual(f.repository.has('next-event-staging'),true);
}
{
 const f=fixture();f.repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
 assert.throws(()=>executeNextEventCalendarReplacementCleanup(f),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');
 assert.strictEqual(f.repository.has('next-event-staging'),true);
}
{
 const f=fixture();f.repository.remove('next-event-staging');
 assert.throws(()=>executeNextEventCalendarReplacementCleanup(f),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED');
 assert.strictEqual(f.repository.has('franchise'),true);
}
console.log('Next-event calendar replacement cleanup executor tests passed.');
