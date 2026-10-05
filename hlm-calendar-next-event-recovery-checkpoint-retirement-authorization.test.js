'use strict';
const assert=require('assert');
const {createNextEventCalendarRecoveryCheckpointRetirementAuthorization,assertNextEventCalendarRecoveryCheckpointRetirementAuthorized}=require('./hlm-calendar-next-event-recovery-checkpoint-retirement-authorization');
const state=Object.freeze({meta:Object.freeze({currentDate:'2027-03-05'})});
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),verification=Object.freeze({marker:'verification'});
const completion=Object.freeze({candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,verification,checkpoint,state});
const readiness=Object.freeze({kind:'next-event-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,
 retirementAuthorized:false,retirementPerformed:false,checkpointStillPreserved:true,candidateSlotId:'next-event-staging',
 targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,
 completion,verification,checkpoint,state,requirements:Object.freeze({explicitRetirementAuthorizationRequired:true,durableTargetMustRemainVerified:true})});
const authorization=createNextEventCalendarRecoveryCheckpointRetirementAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'next-event-calendar-recovery-checkpoint-retirement-authorization');
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.executed,false);
assert.strictEqual(authorization.checkpointMustRemainPreservedUntilExecution,true);assert.strictEqual(authorization.durableTargetMustRemainVerified,true);
assert.strictEqual(authorization.targetEvent,targetEvent);assert.strictEqual(authorization.readiness,readiness);
assert.strictEqual(authorization.checkpoint,checkpoint);assert.strictEqual(authorization.state,state);assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(assertNextEventCalendarRecoveryCheckpointRetirementAuthorized(readiness,authorization),true);
assert.throws(()=>createNextEventCalendarRecoveryCheckpointRetirementAuthorization({readiness,approved:false}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>createNextEventCalendarRecoveryCheckpointRetirementAuthorization({readiness:{...readiness,checkpointStillPreserved:false},approved:true}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextEventCalendarRecoveryCheckpointRetirementAuthorized({...readiness},authorization),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextEventCalendarRecoveryCheckpointRetirementAuthorized(readiness,{...authorization,targetEvent:{...targetEvent}}),e=>e.code==='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
console.log('Next-event calendar recovery checkpoint retirement authorization tests passed.');
