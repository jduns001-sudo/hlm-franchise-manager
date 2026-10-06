'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function verificationError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_CLEANUP_VERIFICATION_FAILED';return error;}
function verifyDailyTickReplacementCleanup(input={}){
 const execution=input.execution,repository=input.repository;
 if(!execution||execution.kind!=='daily-tick-replacement-cleanup-execution'||execution.version!==1||execution.executed!==true||
 execution.verified!==true||execution.stagingSlotRemoved!==true||execution.checkpointPreserved!==true||execution.days!==1||
 !execution.readiness||!execution.authorization||!execution.completion||!execution.checkpoint||
 execution.authorization.readiness!==execution.readiness||execution.authorization.completion!==execution.completion||
 execution.authorization.checkpoint!==execution.checkpoint||execution.readiness.completion!==execution.completion||
 execution.readiness.checkpoint!==execution.checkpoint||execution.candidateSlotId!==execution.authorization.candidateSlotId||
 execution.targetSlotId!==execution.authorization.targetSlotId||execution.storageKey!==execution.authorization.storageKey||
 execution.fromDate!==execution.authorization.fromDate||execution.toDate!==execution.authorization.toDate)
  throw verificationError('A valid Mission 213 daily tick cleanup execution with exact lineage is required.');
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function'||repository.storageKey!==execution.storageKey)
  throw verificationError('Matching repository lookup and load capability is required.');
 if(repository.has(execution.candidateSlotId)||!repository.has(execution.targetSlotId))
  throw verificationError('Daily tick staging must be absent and durable target must remain present.');
 let state;try{state=repository.load(execution.targetSlotId).state;}catch(_){throw verificationError('Durable daily tick target could not be freshly reloaded.');}
 const candidateState=execution.completion.execution?.candidateState;
 if(!candidateState||!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==execution.toDate||
 serializeGameState(state)!==serializeGameState(candidateState))
  throw verificationError('Durable daily tick target does not exactly match the authorized candidate.');
 return Object.freeze({kind:'daily-tick-replacement-cleanup-verification',version:1,verified:true,stagingSlotAbsent:true,
  targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,days:1,
  candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,storageKey:execution.storageKey,
  fromDate:execution.fromDate,toDate:execution.toDate,execution,readiness:execution.readiness,
  authorization:execution.authorization,completion:execution.completion,checkpoint:execution.checkpoint,state});
}
module.exports={verifyDailyTickReplacementCleanup};
