'use strict';

/**
 * Phase 3 Mission 181: controlled next-game replacement staging cleanup.
 * Removes only the exact authorized temporary staging slot after re-verifying
 * the durable target. The recovery checkpoint remains preserved.
 */
const {assertNextGameCalendarReplacementCleanupAuthorized}=require('./hlm-calendar-next-game-replacement-cleanup-authorization');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function cleanupError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_EXECUTION_FAILED';return error;}
function executeNextGameCalendarReplacementCleanup(input={}){
 const readiness=input.readiness,authorization=input.authorization,repository=input.repository;
 try{assertNextGameCalendarReplacementCleanupAuthorized(readiness,authorization);}
 catch(_){throw cleanupError('Next-game cleanup is not authorized for the exact readiness result.');}
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function'||typeof repository.remove!=='function')
  throw cleanupError('A repository with slot lookup, load, and remove capability is required.');
 if(repository.storageKey!==authorization.storageKey)throw cleanupError('Repository storage key does not match cleanup authorization.');
 if(!repository.has(authorization.targetSlotId)||!repository.has(authorization.candidateSlotId))
  throw cleanupError('Authorized target and next-game staging slots must both exist before cleanup.');
 if(!authorization.targetGame||authorization.targetGame.kind!=='calendar-event'||authorization.targetGame.type!=='game'||
 authorization.targetGame.date!==authorization.toDate)throw cleanupError('Authorized target game does not match the cleanup destination date.');
 const candidateState=authorization.completion.execution?.candidateState;
 let targetBefore;try{targetBefore=repository.load(authorization.targetSlotId).state;}
 catch(_){throw cleanupError('Durable next-game replacement target could not be loaded before cleanup.');}
 if(!candidateState||!targetBefore||!validateGameStateEnvelope(targetBefore).valid||
 targetBefore.meta.currentDate!==authorization.toDate||serializeGameState(targetBefore)!==serializeGameState(candidateState))
  throw cleanupError('Durable next-game replacement target no longer matches the authorized candidate.');
 const targetSerialized=serializeGameState(targetBefore);
 try{repository.remove(authorization.candidateSlotId);}
 catch(cause){const error=cleanupError('Temporary next-game staging slot could not be removed.');error.cause=cause;throw error;}
 if(repository.has(authorization.candidateSlotId))throw cleanupError('Temporary next-game staging slot still exists after cleanup.');
 let targetAfter;try{targetAfter=repository.load(authorization.targetSlotId).state;}
 catch(_){throw cleanupError('Durable next-game replacement target could not be loaded after cleanup.');}
 if(!targetAfter||!validateGameStateEnvelope(targetAfter).valid||targetAfter.meta.currentDate!==authorization.toDate||
 serializeGameState(targetAfter)!==targetSerialized)throw cleanupError('Durable next-game replacement target changed during staging cleanup.');
 return Object.freeze({kind:'next-game-calendar-replacement-cleanup-execution',version:1,executed:true,verified:true,
  stagingSlotRemoved:true,checkpointPreserved:true,candidateSlotId:authorization.candidateSlotId,targetSlotId:authorization.targetSlotId,
  storageKey:authorization.storageKey,fromDate:authorization.fromDate,toDate:authorization.toDate,targetGame:authorization.targetGame,
  readiness,authorization,completion:authorization.completion,checkpoint:authorization.checkpoint,state:targetAfter});
}
module.exports={executeNextGameCalendarReplacementCleanup};
