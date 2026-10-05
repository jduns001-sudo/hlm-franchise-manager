'use strict';

/**
 * Phase 3 Mission 154: next-event recovery checkpoint retirement execution.
 * Retires rollback authority after freshly verifying the durable target.
 * The immutable in-memory checkpoint is retained for lineage; no storage is deleted.
 */
const {assertNextEventCalendarRecoveryCheckpointRetirementAuthorized}=require('./hlm-calendar-next-event-recovery-checkpoint-retirement-authorization');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function executionError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED';return error;}
function executeNextEventCalendarRecoveryCheckpointRetirement(input={}){
 const readiness=input.readiness,authorization=input.authorization,repository=input.repository;
 try{assertNextEventCalendarRecoveryCheckpointRetirementAuthorized(readiness,authorization);}
 catch(_){throw executionError('Next-event checkpoint retirement is not authorized for the exact readiness result.');}
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')throw executionError('A repository with slot lookup and load capability is required.');
 if(repository.storageKey!==authorization.storageKey)throw executionError('Repository storage key does not match retirement authorization.');
 if(repository.has(authorization.candidateSlotId))throw executionError('Temporary next-event staging slot reappeared before checkpoint retirement.');
 if(!repository.has(authorization.targetSlotId))throw executionError('Durable next-event replacement target is missing before checkpoint retirement.');
 let durableState;try{durableState=repository.load(authorization.targetSlotId).state;}catch(_){throw executionError('Durable next-event replacement target could not be freshly reloaded.');}
 const expectedState=authorization.state;
 if(!durableState||!validateGameStateEnvelope(durableState).valid||durableState.meta.currentDate!==authorization.toDate||
    serializeGameState(durableState)!==serializeGameState(expectedState))
  throw executionError('Durable next-event replacement target no longer matches the authorized verified state.');
 return Object.freeze({
  kind:'next-event-calendar-recovery-checkpoint-retirement-execution',version:1,executed:true,verified:true,
  checkpointRetired:true,rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,stagingSlotAbsent:true,
  candidateSlotId:authorization.candidateSlotId,targetSlotId:authorization.targetSlotId,storageKey:authorization.storageKey,
  fromDate:authorization.fromDate,toDate:authorization.toDate,targetEvent:authorization.targetEvent,
  readiness,authorization,completion:authorization.completion,verification:authorization.verification,
  retiredCheckpoint:authorization.checkpoint,state:durableState
 });
}
module.exports={executeNextEventCalendarRecoveryCheckpointRetirement};
