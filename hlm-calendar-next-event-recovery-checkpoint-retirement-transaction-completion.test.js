'use strict';
const assert=require('assert');
const {completeNextEventCalendarRecoveryCheckpointRetirementTransaction}=require('./hlm-calendar-next-event-recovery-checkpoint-retirement-transaction-completion');
const state=Object.freeze({meta:Object.freeze({currentDate:'2027-03-05'})});
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),cleanupCompletion=Object.freeze({marker:'cleanup-completion'});
const readiness=Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,targetEvent,completion:cleanupCompletion,checkpoint,state});
const authorization=Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,targetEvent,readiness,completion:cleanupCompletion,checkpoint});
const execution=Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-execution',version:1,executed:true,verified:true,
 checkpointRetired:true,rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,stagingSlotAbsent:true,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',
 targetEvent,readiness,authorization,completion:cleanupCompletion,retiredCheckpoint:checkpoint,state});
const verification=Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-verification',version:1,verified:true,
 checkpointRetirementVerified:true,rollbackAuthorityRetired:true,storagePreserved:true,durableTargetPreserved:true,
 stagingSlotAbsent:true,lineageIntact:true,candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,
 storageKey:execution.storageKey,fromDate:execution.fromDate,toDate:execution.toDate,targetEvent,execution,readiness,authorization,
 completion:cleanupCompletion,retiredCheckpoint:checkpoint,state});
const r=completeNextEventCalendarRecoveryCheckpointRetirementTransaction({verification});
assert.strictEqual(r.kind,'next-event-calendar-recovery-checkpoint-retirement-transaction-completion');assert.strictEqual(r.version,1);
assert.strictEqual(r.complete,true);assert.strictEqual(r.checkpointRetirementComplete,true);assert.strictEqual(r.checkpointRetired,true);
assert.strictEqual(r.rollbackAuthorityRetired,true);assert.strictEqual(r.retirementVerified,true);assert.strictEqual(r.storagePreserved,true);
assert.strictEqual(r.durableTargetPreserved,true);assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.lineageIntact,true);
assert.strictEqual(r.targetEvent,targetEvent);assert.strictEqual(r.verification,verification);assert.strictEqual(r.execution,execution);
assert.strictEqual(r.retiredCheckpoint,checkpoint);assert.strictEqual(Object.isFrozen(r),true);
assert.throws(()=>completeNextEventCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,verified:false}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,targetEvent:{...targetEvent}}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,execution:{...execution,authorization:{...authorization}}}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,targetSlotId:'other-slot'}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
console.log('Next-event calendar recovery checkpoint retirement transaction completion tests passed.');
