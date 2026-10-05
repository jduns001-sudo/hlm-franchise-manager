'use strict';

/**
 * Phase 3 Mission 176: controlled next-game existing-slot replacement executor.
 * Replaces one exact authorized occupied target, verifies it, and restores the
 * Mission 173 checkpoint on failure.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {assertExistingSlotNextGameCalendarReplacementAuthorized}=require('./hlm-calendar-next-game-replacement-authorization');
const {restoreNextGameCalendarPersistenceRecoveryCheckpoint}=require('./hlm-calendar-next-game-persistence-recovery-checkpoint');
function executionError(code,message){const error=new Error(message);error.code=code;return error;}
function executeExistingSlotNextGameCalendarReplacement(input={}){
 const readiness=input.readiness,authorization=input.authorization,repository=input.repository,storage=input.storage;
 try{assertExistingSlotNextGameCalendarReplacementAuthorized(readiness,authorization);}
 catch(_){throw executionError('NEXT_GAME_CALENDAR_REPLACEMENT_EXECUTION_NOT_AUTHORIZED','Exact existing-slot next-game calendar replacement authorization is required.');}
 if(!repository||typeof repository.save!=='function'||typeof repository.load!=='function'||typeof repository.has!=='function')
  throw executionError('INVALID_NEXT_GAME_CALENDAR_REPLACEMENT_REPOSITORY','A save repository is required.');
 if(repository.storageKey!==authorization.storageKey)
  throw executionError('NEXT_GAME_CALENDAR_REPLACEMENT_STORAGE_MISMATCH','Repository storage key does not match authorization.');
 if(!repository.has(authorization.targetSlotId))
  throw executionError('NEXT_GAME_CALENDAR_REPLACEMENT_TARGET_MISSING','Authorized target save slot must exist.');
 const candidateState=authorization.candidateState;
 if(!validateGameStateEnvelope(candidateState).valid||candidateState.meta.currentDate!==authorization.toDate||
 !authorization.targetGame||authorization.targetGame.kind!=='calendar-event'||authorization.targetGame.type!=='game'||
 authorization.targetGame.date!==authorization.toDate)
  throw executionError('INVALID_NEXT_GAME_CALENDAR_REPLACEMENT_CANDIDATE','Authorized next-game replacement candidate is invalid.');
 try{
  repository.save(authorization.targetSlotId,candidateState,{saveId:authorization.targetSlotId},{replace:true});
  const loaded=repository.load(authorization.targetSlotId);
  if(!loaded||!loaded.state||!validateGameStateEnvelope(loaded.state).valid||
   loaded.state.meta.currentDate!==authorization.toDate||
   serializeGameState(loaded.state)!==serializeGameState(candidateState))
   throw executionError('NEXT_GAME_CALENDAR_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED','Replaced next-game calendar GameState failed durable verification.');
  return Object.freeze({kind:'existing-slot-next-game-calendar-replacement-execution',version:1,executed:true,verified:true,
   rolledBack:false,candidateSlotId:authorization.candidateSlotId,targetSlotId:authorization.targetSlotId,
   storageKey:authorization.storageKey,fromDate:authorization.fromDate,toDate:authorization.toDate,
   targetGame:authorization.targetGame,readiness,authorization,checkpoint:authorization.checkpoint,candidateState});
 }catch(error){
  try{const restoration=restoreNextGameCalendarPersistenceRecoveryCheckpoint({storage,checkpoint:authorization.checkpoint});
   error.persistenceRolledBack=restoration.restored===true;error.restoration=restoration;
  }catch(rollbackError){error.persistenceRolledBack=false;error.rollbackError=rollbackError;}
  throw error;
 }
}
module.exports={executeExistingSlotNextGameCalendarReplacement};
