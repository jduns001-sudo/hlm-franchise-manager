'use strict';

/**
 * Phase 3 Mission 202: isolated daily tick persistence executor.
 * First controlled Daily Tick write boundary. Creates only a new isolated slot.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {assertDailyTickPersistenceExecutionAuthorized}=require('./hlm-daily-tick-persistence-execution-authorization');

function executionError(code,message){const error=new Error(message);error.code=code;return error;}

function executeIsolatedDailyTickPersistence(input={}){
 const pkg=input.package,authorization=input.authorization,repository=input.repository;
 const slotId=typeof input.slotId==='string'?input.slotId.trim():'';
 try{assertDailyTickPersistenceExecutionAuthorized(pkg,authorization);}
 catch(_){throw executionError('DAILY_TICK_PERSISTENCE_EXECUTION_NOT_AUTHORIZED','Exact Mission 201 daily tick persistence execution authorization is required.');}
 if(!repository||typeof repository.save!=='function'||typeof repository.load!=='function'||
 typeof repository.has!=='function'||typeof repository.remove!=='function')
  throw executionError('INVALID_DAILY_TICK_PERSISTENCE_REPOSITORY','An isolated save repository is required.');
 if(!slotId)throw executionError('INVALID_DAILY_TICK_PERSISTENCE_SLOT','A target save slot is required.');
 if(repository.has(slotId))throw executionError('DAILY_TICK_PERSISTENCE_TARGET_OCCUPIED','Mission 202 refuses to replace an existing save slot.');

 const candidateState=pkg.candidateState;
 if(!validateGameStateEnvelope(candidateState).valid||pkg.days!==1||authorization.days!==1||
 candidateState.meta.currentDate!==pkg.toDate)
  throw executionError('INVALID_DAILY_TICK_PERSISTENCE_CANDIDATE','Authorized daily tick candidate GameState is invalid.');

 try{
  repository.save(slotId,candidateState,{saveId:slotId},{replace:false});
  const written=repository.load(slotId);
  if(!written||!written.state||!validateGameStateEnvelope(written.state).valid||
  written.state.meta.currentDate!==pkg.toDate)
   throw executionError('DAILY_TICK_PERSISTENCE_POST_WRITE_VERIFICATION_FAILED','Persisted daily tick GameState failed immediate verification.');
  return Object.freeze({
   kind:'isolated-daily-tick-persistence-execution',version:1,executed:true,verified:true,
   rolledBack:false,slotId,fromDate:pkg.fromDate,toDate:pkg.toDate,days:1,package:pkg,authorization
  });
 }catch(error){
  try{if(repository.has(slotId))repository.remove(slotId);}catch(rollbackError){error.rollbackError=rollbackError;}
  error.persistenceRolledBack=true;throw error;
 }
}
module.exports={executeIsolatedDailyTickPersistence};
