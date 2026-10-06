'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertActivationVerification(v){
 if(!v||v.kind!=='simulation-command-gamestate-activation-verification'||v.version!==1||v.verified!==true||
 v.candidateIdentityPreserved!==true||v.authorizationLineageVerified!==true||v.eventsUnprocessed!==true||
 v.gameSimulationPerformed!==false||v.universeSystemsProcessed!==false||v.persistencePerformed!==false||!v.activation||
 v.activation.state!==v.state||!validateGameStateEnvelope(v.state).valid||v.state.meta.currentDate!==v.toDate)
 throw err('SIMULATION_PERSISTENCE_NOT_READY','Verified unified simulation GameState activation required.');return v;
}
function createSimulationPersistenceReadiness({verification}={}){
 assertActivationVerification(verification);
 return Object.freeze({kind:'simulation-command-persistence-readiness',version:1,ready:true,mode:verification.mode,days:verification.days,
 fromDate:verification.fromDate,toDate:verification.toDate,verification,candidateState:verification.state,
 requirements:Object.freeze({explicitPersistenceAuthorizationRequired:true,verifyAfterWriteRequired:true,rollbackOnFailureRequired:true})});
}
function assertReadiness(r){
 if(!r||r.kind!=='simulation-command-persistence-readiness'||r.version!==1||r.ready!==true||!Number.isSafeInteger(r.days)||r.days<1||
 !r.verification||r.candidateState!==r.verification.state||r.candidateState?.meta?.currentDate!==r.toDate||
 r.requirements?.explicitPersistenceAuthorizationRequired!==true||r.requirements?.verifyAfterWriteRequired!==true||r.requirements?.rollbackOnFailureRequired!==true)
 throw err('INVALID_SIMULATION_PERSISTENCE_AUTHORIZATION','Valid unified simulation persistence readiness required.');return r;
}
function authorizeSimulationPersistence({readiness,approved}={}){
 assertReadiness(readiness);if(approved!==true)throw err('SIMULATION_PERSISTENCE_NOT_APPROVED','Persistence requires explicit approval.');
 return Object.freeze({kind:'simulation-command-persistence-authorization',version:1,approved:true,persisted:false,mode:readiness.mode,days:readiness.days,
 fromDate:readiness.fromDate,toDate:readiness.toDate,readiness,candidateState:readiness.candidateState});
}
function createSimulationPersistenceExecutionPackage({readiness,authorization}={}){
 assertReadiness(readiness);
 if(!authorization||authorization.kind!=='simulation-command-persistence-authorization'||authorization.version!==1||authorization.approved!==true||
 authorization.persisted!==false||authorization.readiness!==readiness||authorization.candidateState!==readiness.candidateState||
 authorization.mode!==readiness.mode||authorization.days!==readiness.days||authorization.fromDate!==readiness.fromDate||authorization.toDate!==readiness.toDate)
 throw err('INVALID_SIMULATION_PERSISTENCE_EXECUTION_PACKAGE','Exact unified persistence authorization required.');
 if(!validateGameStateEnvelope(readiness.candidateState).valid)throw err('INVALID_SIMULATION_PERSISTENCE_EXECUTION_PACKAGE','Candidate GameState invalid.');
 return Object.freeze({kind:'simulation-command-persistence-execution-package',version:1,packaged:true,executable:false,mode:readiness.mode,days:readiness.days,
 fromDate:readiness.fromDate,toDate:readiness.toDate,readiness,authorization,candidateState:readiness.candidateState,
 transaction:Object.freeze({verifyAfterWrite:true,rollbackOnFailure:true,executionAuthorizationRequired:true})});
}
module.exports={createSimulationPersistenceReadiness,authorizeSimulationPersistence,createSimulationPersistenceExecutionPackage};