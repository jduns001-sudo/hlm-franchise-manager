'use strict';

/**
 * Phase 3 Mission 211: daily tick replacement cleanup readiness.
 * Determines whether the temporary staging slot may later be removed.
 * Performs no persistence writes or deletion.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function readinessError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_CLEANUP_NOT_READY';return error;}

function evaluateDailyTickReplacementCleanupReadiness(input={}){
 const completion=input.completion,repository=input.repository;
 if(!completion||completion.kind!=='daily-tick-replacement-transaction-completion'||completion.version!==1||
 completion.complete!==true||completion.durableVerificationComplete!==true||completion.cleanupPerformed!==false||
 completion.checkpointPreserved!==true||completion.stagingSlotPreserved!==true||completion.exactlyOneDayComplete!==true||
 completion.days!==1||!completion.verification||!completion.execution||!completion.authorization||!completion.checkpoint||
 !completion.state||completion.verification.execution!==completion.execution||
 completion.verification.authorization!==completion.authorization||completion.verification.checkpoint!==completion.checkpoint||
 completion.execution.authorization!==completion.authorization||completion.execution.checkpoint!==completion.checkpoint)
  throw readinessError('A complete verified daily tick replacement transaction with preserved safety artifacts is required.');

 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  throw readinessError('A repository with slot lookup and load capability is required.');
 if(repository.storageKey!==completion.storageKey)
  throw readinessError('Repository storage key does not match the completed daily tick transaction.');
 if(!repository.has(completion.targetSlotId)||!repository.has(completion.candidateSlotId))
  throw readinessError('Both durable target and preserved daily tick staging slot must exist before cleanup can be considered.');

 let target;try{target=repository.load(completion.targetSlotId);}
 catch(_){throw readinessError('Durable daily tick replacement target could not be reloaded.');}
 const state=target&&target.state;
 if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==completion.toDate||
 serializeGameState(state)!==serializeGameState(completion.execution.candidateState))
  throw readinessError('Durable daily tick replacement target no longer matches the completed transaction.');

 return Object.freeze({
  kind:'daily-tick-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,cleanupPerformed:false,
  candidateSlotId:completion.candidateSlotId,targetSlotId:completion.targetSlotId,storageKey:completion.storageKey,
  fromDate:completion.fromDate,toDate:completion.toDate,days:1,completion,checkpoint:completion.checkpoint,
  requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})
 });
}
module.exports={evaluateDailyTickReplacementCleanupReadiness};
