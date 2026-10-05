'use strict';
const assert=require('assert');
const {completeNextGameCalendarRecoveryCheckpointRetirementTransaction}=require('./hlm-calendar-next-game-recovery-checkpoint-retirement-transaction-completion');
const state=Object.freeze({meta:Object.freeze({currentDate:'2027-03-05'})});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),cleanupCompletion=Object.freeze({marker:'cleanup-completion'});
const readiness=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,targetGame,completion:cleanupCompletion,checkpoint,state});
const authorization=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,targetGame,readiness,completion:cleanupCompletion,checkpoint});
const execution=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-execution',version:1,executed:true,verified:true,
 checkpointRetired:true,rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,stagingSlotAbsent:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',
 targetGame,readiness,authorization,completion:cleanupCompletion,retiredCheckpoint:checkpoint,state});
const verification=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-verification',version:1,verified:true,
 checkpointRetirementVerified:true,rollbackAuthorityRetired:true,storagePreserved:true,durableTargetPreserved:true,
 stagingSlotAbsent:true,lineageIntact:true,candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,
 storageKey:execution.storageKey,fromDate:execution.fromDate,toDate:execution.toDate,targetGame,execution,readiness,authorization,
 completion:cleanupCompletion,retiredCheckpoint:checkpoint,state});
const r=completeNextGameCalendarRecoveryCheckpointRetirementTransaction({verification});
assert.strictEqual(r.kind,'next-game-calendar-recovery-checkpoint-retirement-transaction-completion');assert.strictEqual(r.version,1);
assert.strictEqual(r.complete,true);assert.strictEqual(r.checkpointRetirementComplete,true);assert.strictEqual(r.checkpointRetired,true);
assert.strictEqual(r.rollbackAuthorityRetired,true);assert.strictEqual(r.retirementVerified,true);assert.strictEqual(r.storagePreserved,true);
assert.strictEqual(r.durableTargetPreserved,true);assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.lineageIntact,true);
assert.strictEqual(r.targetGame,targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.verification,verification);
assert.strictEqual(r.execution,execution);assert.strictEqual(r.retiredCheckpoint,checkpoint);assert.strictEqual(Object.isFrozen(r),true);
assert.throws(()=>completeNextGameCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,verified:false}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,targetGame:{...targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,execution:{...execution,authorization:{...authorization}}}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarRecoveryCheckpointRetirementTransaction({verification:{...verification,targetSlotId:'other-slot'}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_TRANSACTION_NOT_COMPLETE');
console.log('Next-game calendar recovery checkpoint retirement transaction completion tests passed.');
