'use strict';
const assert = require('assert');
const { DEFAULT_STORAGE_KEY, createBrowserSaveAdapter } = require('./hlm-browser-save-adapter');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createNextEventCalendarPersistenceRecoveryCheckpoint } = require('./hlm-calendar-next-event-persistence-recovery-checkpoint');
const { createExistingSlotNextEventCalendarReplacementAuthorization } = require('./hlm-calendar-next-event-replacement-authorization');
const { executeExistingSlotNextEventCalendarReplacement } = require('./hlm-calendar-next-event-replacement-executor');
const { verifyExistingSlotNextEventCalendarReplacement } = require('./hlm-calendar-next-event-replacement-verification');

function memoryStorage(){ const d=new Map(); return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}; }
function build(){
  const storage=memoryStorage(), repository=createBrowserSaveAdapter(storage);
  const oldState=createGameStateEnvelope({meta:{currentDate:'2027-03-03',controlledTeamId:'PIT'}});
  const candidateState=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
  const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
  repository.save('franchise',oldState,{saveId:'franchise'});
  repository.save('next-event-staging',candidateState,{saveId:'next-event-staging'});
  const checkpoint=createNextEventCalendarPersistenceRecoveryCheckpoint({storage,storageKey:DEFAULT_STORAGE_KEY,slotId:'franchise'});
  const reloadVerification=Object.freeze({slotId:'next-event-staging',fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,state:candidateState});
  const readiness=Object.freeze({
    kind:'existing-slot-next-event-calendar-replacement-readiness',version:1,ready:true,
    replacementAuthorized:false,replacementPerformed:false,candidateSlotId:'next-event-staging',
    targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,fromDate:'2027-03-03',toDate:'2027-03-05',
    targetEvent,reloadVerification,checkpoint,requirements:Object.freeze({
      explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true
    })
  });
  const authorization=createExistingSlotNextEventCalendarReplacementAuthorization({readiness,approved:true});
  const execution=executeExistingSlotNextEventCalendarReplacement({readiness,authorization,repository,storage});
  return {storage,repository,candidateState,targetEvent,execution};
}

{
 const f=build(), v=verifyExistingSlotNextEventCalendarReplacement(f);
 assert.strictEqual(v.kind,'existing-slot-next-event-calendar-replacement-verification');
 assert.strictEqual(v.verified,true); assert.strictEqual(v.targetEvent,f.targetEvent);
 assert.strictEqual(v.execution,f.execution); assert.strictEqual(v.authorization,f.execution.authorization);
 assert.strictEqual(v.checkpoint,f.execution.checkpoint); assert.notStrictEqual(v.state,f.candidateState);
 assert.strictEqual(Object.isFrozen(v),true);
}
{
 const f=build();
 const tampered=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}});
 f.repository.save('franchise',tampered,{saveId:'franchise'},{replace:true});
 assert.throws(()=>verifyExistingSlotNextEventCalendarReplacement(f),e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');
}
{
 const f=build();
 assert.throws(()=>verifyExistingSlotNextEventCalendarReplacement({...f,execution:{...f.execution,targetEvent:{...f.targetEvent}}}),
   e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');
}
{
 const f=build();
 assert.throws(()=>verifyExistingSlotNextEventCalendarReplacement({...f,repository:{...f.repository,storageKey:'wrong-key'}}),
   e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_VERIFICATION_FAILED');
}
console.log('Existing-slot next-event calendar replacement verification tests passed.');
