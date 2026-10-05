'use strict';

/**
 * Phase 3 Mission 177: next-game existing-slot replacement verification.
 * Freshly reloads the Mission 176 target and proves it still equals the exact
 * authorized Next Game candidate. Performs no writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function verificationError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_REPLACEMENT_VERIFICATION_FAILED';return error;}
function verifyExistingSlotNextGameCalendarReplacement(input={}){
 const execution=input.execution,repository=input.repository;
 if(!execution||execution.kind!=='existing-slot-next-game-calendar-replacement-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||!execution.targetGame||
 execution.targetGame.kind!=='calendar-event'||execution.targetGame.type!=='game'||execution.targetGame.date!==execution.toDate||
 !execution.authorization||!execution.readiness||execution.authorization.readiness!==execution.readiness||
 execution.authorization.checkpoint!==execution.checkpoint||execution.authorization.candidateState!==execution.candidateState||
 execution.authorization.targetGame!==execution.targetGame||execution.authorization.candidateSlotId!==execution.candidateSlotId||
 execution.authorization.targetSlotId!==execution.targetSlotId||execution.authorization.storageKey!==execution.storageKey||
 execution.authorization.fromDate!==execution.fromDate||execution.authorization.toDate!==execution.toDate)
  throw verificationError('A valid successful Mission 176 next-game replacement execution is required.');
 if(!repository||typeof repository.load!=='function'||typeof repository.has!=='function')
  throw verificationError('A repository with load and slot lookup capability is required.');
 if(repository.storageKey!==execution.storageKey||!repository.has(execution.targetSlotId))
  throw verificationError('Replacement repository does not match the executed next-game target.');
 let loaded;try{loaded=repository.load(execution.targetSlotId);}catch(_){throw verificationError('Replaced next-game GameState could not be freshly reloaded.');}
 const state=loaded&&loaded.state;
 if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==execution.toDate)
  throw verificationError('Freshly reloaded next-game replacement GameState is invalid or has the wrong date.');
 let equivalent=false;try{equivalent=serializeGameState(state)===serializeGameState(execution.candidateState);}catch(_){equivalent=false;}
 if(!equivalent)throw verificationError('Freshly reloaded next-game replacement does not match the authorized candidate.');
 return Object.freeze({kind:'existing-slot-next-game-calendar-replacement-verification',version:1,verified:true,
  candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,storageKey:execution.storageKey,
  fromDate:execution.fromDate,toDate:execution.toDate,targetGame:execution.targetGame,execution,
  authorization:execution.authorization,checkpoint:execution.checkpoint,state});
}
module.exports={verifyExistingSlotNextGameCalendarReplacement};
