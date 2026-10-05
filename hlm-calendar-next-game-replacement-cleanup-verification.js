'use strict';

/**
 * Phase 3 Mission 182: next-game replacement cleanup verification.
 * Independently verifies Mission 181 without writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_VERIFICATION_FAILED';return error;}
function verifyNextGameCalendarReplacementCleanup(input={}){
 const execution=input.execution,repository=input.repository;
 if(!execution||execution.kind!=='next-game-calendar-replacement-cleanup-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.stagingSlotRemoved!==true||
 execution.checkpointPreserved!==true||!execution.targetGame||execution.targetGame.kind!=='calendar-event'||
 execution.targetGame.type!=='game'||execution.targetGame.date!==execution.toDate||
 !execution.readiness||!execution.authorization||!execution.completion||!execution.checkpoint||
 execution.authorization.readiness!==execution.readiness||execution.authorization.completion!==execution.completion||
 execution.authorization.checkpoint!==execution.checkpoint||execution.authorization.targetGame!==execution.targetGame||
 execution.readiness.completion!==execution.completion||execution.readiness.checkpoint!==execution.checkpoint||
 execution.readiness.targetGame!==execution.targetGame||execution.completion.targetGame!==execution.targetGame||
 execution.candidateSlotId!==execution.authorization.candidateSlotId||execution.targetSlotId!==execution.authorization.targetSlotId||
 execution.storageKey!==execution.authorization.storageKey||execution.fromDate!==execution.authorization.fromDate||
 execution.toDate!==execution.authorization.toDate)
  throw verificationError('A valid Mission 181 next-game cleanup execution with exact lineage is required.');
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  throw verificationError('A repository with slot lookup and load capability is required.');
 if(repository.storageKey!==execution.storageKey)throw verificationError('Repository storage key does not match the cleanup execution.');
 if(repository.has(execution.candidateSlotId))throw verificationError('Temporary next-game staging slot still exists after cleanup.');
 if(!repository.has(execution.targetSlotId))throw verificationError('Permanent next-game replacement target is missing after cleanup.');
 let state;try{state=repository.load(execution.targetSlotId).state;}catch(_){throw verificationError('Permanent next-game replacement target could not be freshly reloaded.');}
 const candidateState=execution.completion.execution?.candidateState;
 if(!candidateState||!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==execution.toDate||
 serializeGameState(state)!==serializeGameState(candidateState))
  throw verificationError('Permanent next-game replacement target does not exactly match the authorized candidate.');
 return Object.freeze({kind:'next-game-calendar-replacement-cleanup-verification',version:1,verified:true,
  stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
  candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,storageKey:execution.storageKey,
  fromDate:execution.fromDate,toDate:execution.toDate,targetGame:execution.targetGame,execution,
  readiness:execution.readiness,authorization:execution.authorization,completion:execution.completion,
  checkpoint:execution.checkpoint,state});
}
module.exports={verifyNextGameCalendarReplacementCleanup};
