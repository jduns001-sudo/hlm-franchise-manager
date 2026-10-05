'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness}=require('./hlm-calendar-next-event-recovery-checkpoint-retirement-readiness');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05'}});
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),execution=Object.freeze({marker:'cleanup-execution'});
const readiness=Object.freeze({marker:'cleanup-readiness'}),authorization=Object.freeze({marker:'cleanup-authorization'});
const replacementCompletion=Object.freeze({marker:'replacement-completion'});
const verification=Object.freeze({kind:'next-event-calendar-replacement-cleanup-verification',version:1,verified:true,
 stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,execution,readiness,authorization,completion:replacementCompletion,checkpoint,state});
const completion=Object.freeze({kind:'next-event-calendar-replacement-cleanup-transaction-completion',version:1,complete:true,
 cleanupPerformed:true,cleanupVerified:true,stagingSlotRemoved:true,targetPreserved:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,verification,execution,readiness,authorization,replacementCompletion,checkpoint,state});
const r=evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness({completion});
assert.strictEqual(r.kind,'next-event-calendar-recovery-checkpoint-retirement-readiness');assert.strictEqual(r.ready,true);
assert.strictEqual(r.retirementAuthorized,false);assert.strictEqual(r.retirementPerformed,false);assert.strictEqual(r.checkpointStillPreserved,true);
assert.strictEqual(r.targetEvent,targetEvent);assert.strictEqual(r.completion,completion);assert.strictEqual(r.verification,verification);
assert.strictEqual(r.checkpoint,checkpoint);assert.strictEqual(r.state,state);
assert.strictEqual(r.requirements.explicitRetirementAuthorizationRequired,true);assert.strictEqual(r.requirements.durableTargetMustRemainVerified,true);
assert.strictEqual(Object.isFrozen(r),true);assert.strictEqual(Object.isFrozen(r.requirements),true);
assert.throws(()=>evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,complete:false}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,checkpointPreserved:false}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,targetEvent:{...targetEvent}}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextEventCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,toDate:'2027-03-06'}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
console.log('Next-event calendar recovery checkpoint retirement readiness tests passed.');
