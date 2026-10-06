'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');const {serializeGameState}=require('./hlm-game-state-serialization');
function err(code,m){const e=new Error(m);e.code=code;return e;}
function assertCompletion(c){if(!c||c.kind!=='simulation-command-replacement-transaction-completion'||c.version!==1||!c.complete||!c.durableVerificationComplete||
 c.cleanupPerformed!==false||!c.checkpointPreserved||!c.stagingSlotPreserved||!c.checkpoint||!c.state)throw err('INVALID_SIMULATION_REPLACEMENT_CLOSEOUT','Verified Mission 223 completion required.');return c;}
function prepareSimulationReplacementCloseout({completion,repository}={}){
 assertCompletion(completion);if(!repository||repository.storageKey!==completion.storageKey||!repository.has(completion.targetSlotId)||!repository.has(completion.candidateSlotId))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_NOT_READY','Durable target and staging candidate required.');
 const target=repository.load(completion.targetSlotId).state;if(!validateGameStateEnvelope(target).valid||serializeGameState(target)!==serializeGameState(completion.state))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_NOT_READY','Durable target changed.');
 return Object.freeze({kind:'simulation-command-replacement-closeout-readiness',version:1,ready:true,completion,checkpoint:completion.checkpoint,state:target,
 candidateSlotId:completion.candidateSlotId,targetSlotId:completion.targetSlotId,storageKey:completion.storageKey,mode:completion.mode,days:completion.days,fromDate:completion.fromDate,toDate:completion.toDate});
}
function authorizeSimulationReplacementCloseout({readiness,approved}={}){if(!readiness||readiness.kind!=='simulation-command-replacement-closeout-readiness'||!readiness.ready)throw err('INVALID_SIMULATION_REPLACEMENT_CLOSEOUT_AUTHORIZATION','Valid readiness required.');
 if(approved!==true)throw err('SIMULATION_REPLACEMENT_CLOSEOUT_NOT_APPROVED','Closeout requires explicit approval.');
 return Object.freeze({kind:'simulation-command-replacement-closeout-authorization',version:1,approved:true,readiness,completion:readiness.completion,checkpoint:readiness.checkpoint,state:readiness.state});}
function executeSimulationReplacementCloseout({readiness,authorization,repository}={}){
 if(!authorization||authorization.kind!=='simulation-command-replacement-closeout-authorization'||!authorization.approved||authorization.readiness!==readiness||authorization.checkpoint!==readiness?.checkpoint)throw err('SIMULATION_REPLACEMENT_CLOSEOUT_AUTHORIZATION_MISMATCH','Authorization must match exact readiness.');
 if(!repository||repository.storageKey!==readiness.storageKey||!repository.has(readiness.targetSlotId)||!repository.has(readiness.candidateSlotId))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_EXECUTION_FAILED','Expected target and staging slots required.');
 const before=repository.load(readiness.targetSlotId).state;if(serializeGameState(before)!==serializeGameState(readiness.state))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_EXECUTION_FAILED','Durable target changed before cleanup.');
 repository.remove(readiness.candidateSlotId);if(repository.has(readiness.candidateSlotId))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_EXECUTION_FAILED','Staging slot still exists.');
 const after=repository.load(readiness.targetSlotId).state;if(!validateGameStateEnvelope(after).valid||serializeGameState(after)!==serializeGameState(before))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_EXECUTION_FAILED','Durable target changed during cleanup.');
 return Object.freeze({kind:'simulation-command-replacement-closeout-execution',version:1,executed:true,stagingSlotRemoved:true,checkpointRetired:true,rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,
 readiness,authorization,completion:readiness.completion,retiredCheckpoint:readiness.checkpoint,state:after,candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,storageKey:readiness.storageKey,mode:readiness.mode,days:readiness.days,fromDate:readiness.fromDate,toDate:readiness.toDate});
}
function verifySimulationReplacementCloseout({execution,repository}={}){
 if(!execution||execution.kind!=='simulation-command-replacement-closeout-execution'||!execution.executed||!execution.stagingSlotRemoved||!execution.checkpointRetired||!execution.rollbackAuthorityRetired||execution.storageDeleted!==false||!execution.durableTargetPreserved)throw err('SIMULATION_REPLACEMENT_CLOSEOUT_VERIFICATION_FAILED','Successful closeout execution required.');
 if(!repository||repository.storageKey!==execution.storageKey||repository.has(execution.candidateSlotId)||!repository.has(execution.targetSlotId))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_VERIFICATION_FAILED','Repository does not match closeout.');
 const state=repository.load(execution.targetSlotId).state;if(serializeGameState(state)!==serializeGameState(execution.state))throw err('SIMULATION_REPLACEMENT_CLOSEOUT_VERIFICATION_FAILED','Durable target changed after closeout.');
 return Object.freeze({kind:'simulation-command-replacement-closeout-verification',version:1,verified:true,stagingSlotAbsent:true,checkpointRetirementVerified:true,rollbackAuthorityRetired:true,durableTargetPreserved:true,storagePreserved:true,execution,state,retiredCheckpoint:execution.retiredCheckpoint});
}
function completeSimulationReplacementCloseout({verification}={}){
 if(!verification||verification.kind!=='simulation-command-replacement-closeout-verification'||!verification.verified||!verification.stagingSlotAbsent||!verification.checkpointRetirementVerified||!verification.rollbackAuthorityRetired||!verification.durableTargetPreserved||!verification.storagePreserved)throw err('SIMULATION_REPLACEMENT_CLOSEOUT_NOT_COMPLETE','Verified closeout required.');
 const e=verification.execution;return Object.freeze({kind:'simulation-command-replacement-closeout-completion',version:1,complete:true,cleanupComplete:true,checkpointRetirementComplete:true,rollbackAuthorityRetired:true,durableTargetPreserved:true,stagingSlotAbsent:true,
 mode:e.mode,days:e.days,fromDate:e.fromDate,toDate:e.toDate,candidateSlotId:e.candidateSlotId,targetSlotId:e.targetSlotId,storageKey:e.storageKey,verification,execution:e,replacementCompletion:e.completion,retiredCheckpoint:e.retiredCheckpoint,state:verification.state});
}
module.exports={prepareSimulationReplacementCloseout,authorizeSimulationReplacementCloseout,executeSimulationReplacementCloseout,verifySimulationReplacementCloseout,completeSimulationReplacementCloseout};