'use strict';

/**
 * Phase 3 Mission 209: daily tick existing-slot replacement verification.
 * Freshly reloads the Mission 208 target and proves it still equals the exact
 * authorized one-day Daily Tick candidate. Performs no writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');

function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_VERIFICATION_FAILED';return error;}

function verifyExistingSlotDailyTickReplacement(input={}){
 const execution=input.execution,repository=input.repository;
 if(!execution||execution.kind!=='existing-slot-daily-tick-replacement-execution'||execution.version!==1||
 execution.executed!==true||execution.verified!==true||execution.rolledBack!==false||execution.days!==1||
 !execution.authorization||!execution.readiness||execution.authorization.readiness!==execution.readiness||
 execution.authorization.checkpoint!==execution.checkpoint||execution.authorization.candidateState!==execution.candidateState||
 execution.authorization.days!==1||execution.authorization.candidateSlotId!==execution.candidateSlotId||
 execution.authorization.targetSlotId!==execution.targetSlotId||execution.authorization.storageKey!==execution.storageKey||
 execution.authorization.fromDate!==execution.fromDate||execution.authorization.toDate!==execution.toDate)
  throw verificationError('A valid successful Mission 208 daily tick replacement execution is required.');

 if(!repository||typeof repository.load!=='function'||typeof repository.has!=='function')
  throw verificationError('A repository with load and slot lookup capability is required.');
 if(repository.storageKey!==execution.storageKey||!repository.has(execution.targetSlotId)||
 !repository.has(execution.candidateSlotId))
  throw verificationError('Replacement repository does not match the executed daily tick target or staging slot.');

 let loaded;
 try{loaded=repository.load(execution.targetSlotId);}
 catch(_){throw verificationError('Replaced daily tick GameState could not be freshly reloaded.');}

 const state=loaded&&loaded.state;
 if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==execution.toDate)
  throw verificationError('Freshly reloaded daily tick replacement GameState is invalid or has the wrong date.');

 let equivalent=false;
 try{equivalent=serializeGameState(state)===serializeGameState(execution.candidateState);}catch(_){equivalent=false;}
 if(!equivalent)throw verificationError('Freshly reloaded daily tick replacement does not match the authorized candidate.');

 return Object.freeze({
  kind:'existing-slot-daily-tick-replacement-verification',version:1,verified:true,exactlyOneDayVerified:true,
  candidateSlotPreserved:true,candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,
  storageKey:execution.storageKey,fromDate:execution.fromDate,toDate:execution.toDate,days:1,
  execution,authorization:execution.authorization,checkpoint:execution.checkpoint,state
 });
}
module.exports={verifyExistingSlotDailyTickReplacement};
