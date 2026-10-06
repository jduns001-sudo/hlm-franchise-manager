'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');const {serializeGameState}=require('./hlm-game-state-serialization');
function err(m){const e=new Error(m);e.code='DAILY_TICK_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED';return e;}
function verifyDailyTickCheckpointRetirement({execution,repository}={}){
 if(!execution||execution.kind!=='daily-tick-checkpoint-retirement-execution'||!execution.executed||!execution.verified||!execution.checkpointRetired||
 !execution.rollbackAuthorityRetired||execution.storageDeleted!==false||!execution.durableTargetPreserved||!execution.stagingSlotAbsent||execution.days!==1||
 execution.authorization?.readiness!==execution.readiness||execution.authorization?.checkpoint!==execution.retiredCheckpoint)throw err('Valid retirement execution required.');
 if(!repository||repository.storageKey!==execution.storageKey||repository.has(execution.candidateSlotId)||!repository.has(execution.targetSlotId))throw err('Repository state does not match retirement.');
 let state;try{state=repository.load(execution.targetSlotId).state;}catch(_){throw err('Durable target reload failed.');}
 if(!state||!validateGameStateEnvelope(state).valid||serializeGameState(state)!==serializeGameState(execution.state))throw err('Durable target changed after retirement.');
 return Object.freeze({kind:'daily-tick-checkpoint-retirement-verification',version:1,verified:true,checkpointRetirementVerified:true,
 rollbackAuthorityRetired:true,storagePreserved:true,durableTargetPreserved:true,stagingSlotAbsent:true,lineageIntact:true,days:1,
 candidateSlotId:execution.candidateSlotId,targetSlotId:execution.targetSlotId,storageKey:execution.storageKey,fromDate:execution.fromDate,toDate:execution.toDate,
 execution,readiness:execution.readiness,authorization:execution.authorization,completion:execution.completion,retiredCheckpoint:execution.retiredCheckpoint,state});
}module.exports={verifyDailyTickCheckpointRetirement};