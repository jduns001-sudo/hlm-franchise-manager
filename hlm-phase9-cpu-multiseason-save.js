'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialCPUSeasonTransitionCandidates}=require('./hlm-phase9-cpu-multiseason-chain');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function persistApprovedCPUMultiSeasonCandidate({repository,sourceSlotId,destinationSlotId,expectedSourceFingerprint,transitions,confirmCommit=false}={}){
 if(!repository||['has','load','save'].some(k=>typeof repository[k]!=='function'))
  fail('CPU_MULTI_SEASON_SAVE_INVALID_REPOSITORY','Save repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||typeof destinationSlotId!=='string'||!destinationSlotId.trim())
  fail('CPU_MULTI_SEASON_SAVE_INVALID_SLOT','Source and destination slots required');
 const sourceId=sourceSlotId.trim(),destinationId=destinationSlotId.trim();
 if(sourceId===destinationId)fail('CPU_MULTI_SEASON_SAVE_SOURCE_PROTECTED','Source save cannot be overwritten');
 if(confirmCommit!==true)fail('CPU_MULTI_SEASON_SAVE_CONFIRMATION_REQUIRED','Explicit approval required');
 if(!repository.has(sourceId))fail('CPU_MULTI_SEASON_SAVE_SOURCE_MISSING','Source slot missing');
 if(repository.has(destinationId))fail('CPU_MULTI_SEASON_SAVE_DESTINATION_OCCUPIED','Destination slot occupied');
 const state=repository.load(sourceId).state;
 const sourceFingerprint=serializeGameState(state);
 if(typeof expectedSourceFingerprint!=='string'||sourceFingerprint!==expectedSourceFingerprint)
  fail('CPU_MULTI_SEASON_SAVE_SOURCE_STALE','Source fingerprint mismatch');
 const result=createSequentialCPUSeasonTransitionCandidates(state,transitions);
 if(serializeGameState(state)!==sourceFingerprint||
    !repository.has(sourceId)||serializeGameState(repository.load(sourceId).state)!==sourceFingerprint)
  fail('CPU_MULTI_SEASON_SAVE_SOURCE_CHANGED','Source changed during candidate generation');
 if(repository.has(destinationId))fail('CPU_MULTI_SEASON_SAVE_DESTINATION_OCCUPIED','Destination slot occupied');
 repository.save(destinationId,result.candidateState,{saveId:destinationId},{replace:false});
 if(serializeGameState(repository.load(destinationId).state)!==result.candidateFingerprint)
  fail('CPU_MULTI_SEASON_SAVE_VERIFY_FAILED','Persisted candidate mismatch; retain destination for recovery');
 if(serializeGameState(repository.load(sourceId).state)!==sourceFingerprint)
  fail('CPU_MULTI_SEASON_SAVE_SOURCE_CHANGED','Source changed during persistence; retain destination for recovery');
 return Object.freeze({kind:'phase9-approved-cpu-multiseason-candidate-save',version:1,
  sourceSlotId:sourceId,destinationSlotId:destinationId,transitionCount:result.transitions.length,
  verified:true,sourcePreserved:true,activeFranchiseSlotReplaced:false,productionCPUExecutionEnabled:false});
}
module.exports={persistApprovedCPUMultiSeasonCandidate};
