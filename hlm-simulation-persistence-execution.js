'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertPackage(pkg){
 if(!pkg||pkg.kind!=='simulation-command-persistence-execution-package'||pkg.version!==1||pkg.packaged!==true||pkg.executable!==false||
 !pkg.readiness||!pkg.authorization||!pkg.candidateState||pkg.candidateState!==pkg.readiness.candidateState||
 pkg.candidateState!==pkg.authorization.candidateState||pkg.candidateState.meta?.currentDate!==pkg.toDate||
 pkg.transaction?.verifyAfterWrite!==true||pkg.transaction?.rollbackOnFailure!==true||pkg.transaction?.executionAuthorizationRequired!==true)
 throw err('INVALID_SIMULATION_PERSISTENCE_EXECUTION','Valid Mission 221 persistence package required.');return pkg;
}
function authorizeSimulationPersistenceExecution({package:pkg,approved}={}){
 assertPackage(pkg);if(approved!==true)throw err('SIMULATION_PERSISTENCE_EXECUTION_NOT_APPROVED','Persistence execution requires explicit approval.');
 return Object.freeze({kind:'simulation-command-persistence-execution-authorization',version:1,approved:true,executed:false,mode:pkg.mode,days:pkg.days,
 fromDate:pkg.fromDate,toDate:pkg.toDate,package:pkg,candidateState:pkg.candidateState});
}
function assertAuthorized(pkg,a){assertPackage(pkg);if(!a||a.kind!=='simulation-command-persistence-execution-authorization'||a.version!==1||a.approved!==true||
 a.executed!==false||a.package!==pkg||a.candidateState!==pkg.candidateState||a.mode!==pkg.mode||a.days!==pkg.days||a.fromDate!==pkg.fromDate||a.toDate!==pkg.toDate)
 throw err('SIMULATION_PERSISTENCE_EXECUTION_AUTHORIZATION_MISMATCH','Authorization must match exact persistence package.');}
function executeIsolatedSimulationPersistence({package:pkg,authorization,repository,slotId}={}){
 assertAuthorized(pkg,authorization);slotId=typeof slotId==='string'?slotId.trim():'';
 if(!repository||typeof repository.save!=='function'||typeof repository.load!=='function'||typeof repository.has!=='function'||typeof repository.remove!=='function')
  throw err('INVALID_SIMULATION_PERSISTENCE_REPOSITORY','Isolated save repository required.');
 if(!slotId)throw err('INVALID_SIMULATION_PERSISTENCE_SLOT','Target save slot required.');
 if(repository.has(slotId))throw err('SIMULATION_PERSISTENCE_TARGET_OCCUPIED','Unified persistence refuses to replace an existing slot.');
 if(!validateGameStateEnvelope(pkg.candidateState).valid)throw err('INVALID_SIMULATION_PERSISTENCE_CANDIDATE','Candidate GameState invalid.');
 try{
  repository.save(slotId,pkg.candidateState,{saveId:slotId},{replace:false});const loaded=repository.load(slotId),state=loaded&&loaded.state;
  if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==pkg.toDate||serializeGameState(state)!==serializeGameState(pkg.candidateState))
   throw err('SIMULATION_PERSISTENCE_POST_WRITE_VERIFICATION_FAILED','Persisted GameState failed immediate verification.');
  return Object.freeze({kind:'isolated-simulation-command-persistence-execution',version:1,executed:true,verified:true,rolledBack:false,
   mode:pkg.mode,days:pkg.days,slotId,fromDate:pkg.fromDate,toDate:pkg.toDate,package:pkg,authorization,
   eventsProcessed:false,gameSimulationPerformed:false,universeSystemsProcessed:false});
 }catch(error){try{if(repository.has(slotId))repository.remove(slotId);}catch(rollbackError){error.rollbackError=rollbackError;}error.persistenceRolledBack=true;throw error;}
}
function verifySimulationPersistenceExecution({execution}={}){
 if(!execution||execution.kind!=='isolated-simulation-command-persistence-execution'||execution.version!==1||!execution.executed||!execution.verified||
 execution.rolledBack!==false||execution.eventsProcessed!==false||execution.gameSimulationPerformed!==false||execution.universeSystemsProcessed!==false||
 !execution.slotId)throw err('SIMULATION_PERSISTENCE_EXECUTION_VERIFICATION_FAILED','Successful isolated persistence execution required.');
 try{assertAuthorized(execution.package,execution.authorization);}catch(_){throw err('SIMULATION_PERSISTENCE_EXECUTION_VERIFICATION_FAILED','Execution lineage invalid.');}
 if(execution.mode!==execution.package.mode||execution.days!==execution.package.days||execution.fromDate!==execution.package.fromDate||execution.toDate!==execution.package.toDate)
  throw err('SIMULATION_PERSISTENCE_EXECUTION_VERIFICATION_FAILED','Execution metadata does not match package.');
 return Object.freeze({kind:'simulation-command-persistence-execution-verification',version:1,verified:true,mode:execution.mode,days:execution.days,
 slotId:execution.slotId,fromDate:execution.fromDate,toDate:execution.toDate,execution,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false});
}
function verifyPersistedSimulationGameStateReload({verification,repository}={}){
 if(!verification||verification.kind!=='simulation-command-persistence-execution-verification'||verification.version!==1||!verification.verified||!verification.execution)
  throw err('SIMULATION_PERSISTENCE_RELOAD_VERIFICATION_FAILED','Valid persistence execution verification required.');
 if(!repository||typeof repository.load!=='function')throw err('SIMULATION_PERSISTENCE_RELOAD_VERIFICATION_FAILED','Repository load capability required.');
 let state;try{state=repository.load(verification.slotId).state;}catch(_){throw err('SIMULATION_PERSISTENCE_RELOAD_VERIFICATION_FAILED','Persisted GameState could not be reloaded.');}
 const expected=verification.execution.package.candidateState;
 if(!state||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==verification.toDate||serializeGameState(state)!==serializeGameState(expected))
  throw err('SIMULATION_PERSISTENCE_RELOAD_VERIFICATION_FAILED','Reloaded GameState does not match persisted candidate.');
 return Object.freeze({kind:'persisted-simulation-command-gamestate-reload-verification',version:1,verified:true,mode:verification.mode,days:verification.days,
 slotId:verification.slotId,fromDate:verification.fromDate,toDate:verification.toDate,verification,state,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false});
}
module.exports={authorizeSimulationPersistenceExecution,executeIsolatedSimulationPersistence,verifySimulationPersistenceExecution,verifyPersistedSimulationGameStateReload};