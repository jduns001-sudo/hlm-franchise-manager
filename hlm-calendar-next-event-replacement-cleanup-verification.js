'use strict';

/**
 * Phase 3 Mission 150: next-event replacement cleanup verification.
 * Independently verifies Mission 149 without writes.
 */

const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');

function verificationError(message){const error=new Error(message);error.code='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED';return error;}

function verifyNextEventCalendarReplacementCleanup(input={}){
 const execution=input.execution,repository=input.repository;
 if(
  !execution||execution.kind!=='next-event-calendar-replacement-cleanup-execution'||execution.version!==1||
  execution.executed!==true||execution.verified!==true||execution.stagingSlotRemoved!==true||
  execution.checkpointPreserved!==true||!execution.targetEvent||execution.targetEvent.date!==execution.toDate||
  !execution.readiness||!execution.authorization||!execution.completion||!execution.checkpoint||
  execution.authorization.readiness!==execution.readiness||
  execution.authorization.completion!==execution.completion||
  execution.authorization.checkpoint!==execution.checkpoint||
  execution.authorization.targetEvent!==execution.targetEvent||
  execution.readiness.completion!==execution.completion||
  execution.readiness.checkpoint!==execution.checkpoint||
  execution.readiness.targetEvent!==execution.targetEvent||
  execution.completion.targetEvent!==execution.targetEvent||
  execution.candidateSlotId!==execution.authorization.candidateSlotId||
  execution.targetSlotId!==execution.authorization.targetSlotId||
  execution.storageKey!==execution.authorization.storageKey||
  execution.fromDate!==execution.authorization.fromDate||
  execution.toDate!==execution.authorization.toDate
 )throw verificationError('A valid Mission 149 next-event cleanup execution with exact lineage is required.');

 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  throw verificationError('A repository with slot lookup and load capability is required.');
 if(repository.storageKey!==execution.storageKey)throw verificationError('Repository storage key does not match the cleanup execution.');
 if(repository.has(execution.candidateSlotId))throw verificationError('Temporary next-event staging slot still exists after cleanup.');
 if(!repository.has(execution.targetSlotId))throw verificationError('Permanent next-event replacement target is missing after cleanup.');

 let state;try{state=repository.load(execution.targetSlotId).state;}
 catch(_){throw verificationError('Permanent next-event replacement target could not be freshly reloaded.');}
 const candidateState=execution.completion.execution?.candidateState;
 if(!candidateState||!state||!validateGameStateEnvelope(state).valid||
    state.meta.currentDate!==execution.toDate||serializeGameState(state)!==serializeGameState(candidateState))
  throw verificationError('Permanent next-event replacement target does not exactly match the authorized candidate.');

 return Object.freeze({
  kind:'next-event-calendar-replacement-cleanup-verification',version:1,verified:true,
  stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
  candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,storageKey:execution.storageKey,
  fromDate:execution.fromDate,toDate:execution.toDate,targetEvent:execution.targetEvent,execution,
  readiness:execution.readiness,authorization:execution.authorization,completion:execution.completion,
  checkpoint:execution.checkpoint,state
 });
}
module.exports={verifyNextEventCalendarReplacementCleanup};
