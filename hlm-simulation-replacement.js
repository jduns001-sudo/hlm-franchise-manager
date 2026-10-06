'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');const {serializeGameState}=require('./hlm-game-state-serialization');
const {createCalendarPersistenceRecoveryCheckpoint,restoreCalendarPersistenceRecoveryCheckpoint}=require('./hlm-calendar-persistence-recovery-checkpoint');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertReload(r){if(!r||r.kind!=='persisted-simulation-command-gamestate-reload-verification'||r.version!==1||!r.verified||!r.slotId||!r.state)throw err('INVALID_SIMULATION_REPLACEMENT','Verified Mission 222 reload required.');}
function prepareSimulationReplacement({reloadVerification,repository,storage,targetSlotId}={}){
 assertReload(reloadVerification);targetSlotId=String(targetSlotId||'').trim();
 if(!repository||typeof repository.has!=='function'||!targetSlotId||targetSlotId===reloadVerification.slotId||!repository.has(targetSlotId))throw err('SIMULATION_REPLACEMENT_NOT_READY','Distinct occupied target required.');
 const checkpoint=createCalendarPersistenceRecoveryCheckpoint({storage,storageKey:repository.storageKey,slotId:targetSlotId});
 return Object.freeze({kind:'simulation-command-replacement-readiness',version:1,ready:true,replacementPerformed:false,candidateSlotId:reloadVerification.slotId,targetSlotId,
 storageKey:repository.storageKey,mode:reloadVerification.mode,days:reloadVerification.days,fromDate:reloadVerification.fromDate,toDate:reloadVerification.toDate,
 reloadVerification,checkpoint,candidateState:reloadVerification.state});
}
function authorizeSimulationReplacement({readiness,approved}={}){if(!readiness||readiness.kind!=='simulation-command-replacement-readiness'||!readiness.ready||readiness.replacementPerformed)throw err('INVALID_SIMULATION_REPLACEMENT_AUTHORIZATION','Valid readiness required.');
 if(approved!==true)throw err('SIMULATION_REPLACEMENT_NOT_APPROVED','Replacement requires explicit approval.');
 return Object.freeze({kind:'simulation-command-replacement-authorization',version:1,approved:true,readiness,checkpoint:readiness.checkpoint,candidateState:readiness.candidateState});}
function executeSimulationReplacement({readiness,authorization,repository,storage}={}){
 if(!authorization||authorization.kind!=='simulation-command-replacement-authorization'||!authorization.approved||authorization.readiness!==readiness||authorization.checkpoint!==readiness?.checkpoint)throw err('SIMULATION_REPLACEMENT_AUTHORIZATION_MISMATCH','Authorization must match exact readiness.');
 if(!repository||repository.storageKey!==readiness.storageKey||!repository.has(readiness.targetSlotId)||repository.has(readiness.candidateSlotId)!==true)throw err('SIMULATION_REPLACEMENT_REPOSITORY_MISMATCH','Expected occupied target and staging candidate required.');
 if(!validateGameStateEnvelope(readiness.candidateState).valid||readiness.candidateState.meta.currentDate!==readiness.toDate)throw err('INVALID_SIMULATION_REPLACEMENT_CANDIDATE','Candidate invalid.');
 try{repository.save(readiness.targetSlotId,readiness.candidateState,{saveId:readiness.targetSlotId},{replace:true});const state=repository.load(readiness.targetSlotId).state;
  if(!state||serializeGameState(state)!==serializeGameState(readiness.candidateState))throw err('SIMULATION_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED','Replacement verification failed.');
  return Object.freeze({kind:'simulation-command-replacement-execution',version:1,executed:true,verified:true,rolledBack:false,readiness,authorization,checkpoint:readiness.checkpoint,
   candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,mode:readiness.mode,days:readiness.days,fromDate:readiness.fromDate,toDate:readiness.toDate,candidateState:readiness.candidateState});
 }catch(error){try{error.restoration=restoreCalendarPersistenceRecoveryCheckpoint({storage,checkpoint:readiness.checkpoint});error.persistenceRolledBack=error.restoration.restored===true;}catch(x){error.rollbackError=x;error.persistenceRolledBack=false;}throw error;}
}
function verifySimulationReplacement({execution,repository}={}){
 if(!execution||execution.kind!=='simulation-command-replacement-execution'||!execution.executed||!execution.verified||execution.rolledBack!==false||execution.authorization?.readiness!==execution.readiness)throw err('SIMULATION_REPLACEMENT_VERIFICATION_FAILED','Successful replacement execution required.');
 let state;try{state=repository.load(execution.targetSlotId).state;}catch(_){throw err('SIMULATION_REPLACEMENT_VERIFICATION_FAILED','Target reload failed.');}
 if(!state||state.meta.currentDate!==execution.toDate||serializeGameState(state)!==serializeGameState(execution.candidateState))throw err('SIMULATION_REPLACEMENT_VERIFICATION_FAILED','Target differs from candidate.');
 return Object.freeze({kind:'simulation-command-replacement-verification',version:1,verified:true,execution,state,checkpoint:execution.checkpoint});
}
function completeSimulationReplacement({verification}={}){
 if(!verification||verification.kind!=='simulation-command-replacement-verification'||!verification.verified||!verification.execution||verification.checkpoint!==verification.execution.checkpoint)throw err('SIMULATION_REPLACEMENT_TRANSACTION_NOT_COMPLETE','Verified replacement required.');
 const e=verification.execution;return Object.freeze({kind:'simulation-command-replacement-transaction-completion',version:1,complete:true,durableVerificationComplete:true,cleanupPerformed:false,checkpointPreserved:true,stagingSlotPreserved:true,
 candidateSlotId:e.candidateSlotId,targetSlotId:e.targetSlotId,storageKey:e.storageKey,mode:e.mode,days:e.days,fromDate:e.fromDate,toDate:e.toDate,verification,execution:e,checkpoint:e.checkpoint,state:verification.state});
}
module.exports={prepareSimulationReplacement,authorizeSimulationReplacement,executeSimulationReplacement,verifySimulationReplacement,completeSimulationReplacement};