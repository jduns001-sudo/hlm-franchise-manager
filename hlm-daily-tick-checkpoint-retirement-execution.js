'use strict';
const {assertDailyTickCheckpointRetirementAuthorized}=require('./hlm-daily-tick-checkpoint-retirement-authorization');
const {validateGameStateEnvelope}=require('./hlm-game-state');const {serializeGameState}=require('./hlm-game-state-serialization');
function err(m){const e=new Error(m);e.code='DAILY_TICK_CHECKPOINT_RETIREMENT_EXECUTION_FAILED';return e;}
function executeDailyTickCheckpointRetirement({readiness,authorization,repository}={}){
 try{assertDailyTickCheckpointRetirementAuthorized(readiness,authorization);}catch(_){throw err('Exact retirement authorization required.');}
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function'||repository.storageKey!==authorization.storageKey)throw err('Matching repository required.');
 if(repository.has(authorization.candidateSlotId)||!repository.has(authorization.targetSlotId))throw err('Staging must remain absent and durable target present.');
 let state;try{state=repository.load(authorization.targetSlotId).state;}catch(_){throw err('Durable target reload failed.');}
 if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==authorization.toDate||serializeGameState(state)!==serializeGameState(authorization.state))throw err('Durable target changed.');
 return Object.freeze({kind:'daily-tick-checkpoint-retirement-execution',version:1,executed:true,verified:true,checkpointRetired:true,
 rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,stagingSlotAbsent:true,days:1,
 candidateSlotId:authorization.candidateSlotId,targetSlotId:authorization.targetSlotId,storageKey:authorization.storageKey,
 fromDate:authorization.fromDate,toDate:authorization.toDate,readiness,authorization,completion:authorization.completion,
 retiredCheckpoint:authorization.checkpoint,state});
}module.exports={executeDailyTickCheckpointRetirement};