'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createCPUSeasonTransitionCandidate}=require('./hlm-phase9-cpu-season-transition-candidate');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function persistApprovedCPUSeasonTransition({repository,sourceSlotId,destinationSlotId,expectedSourceFingerprint,transition,confirmCommit=false}={}){
 if(!repository||['has','load','save'].some(k=>typeof repository[k]!=='function'))
  fail('CPU_SEASON_SAVE_INVALID_REPOSITORY','Save repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||typeof destinationSlotId!=='string'||!destinationSlotId.trim())
  fail('CPU_SEASON_SAVE_INVALID_SLOT','Source and destination save slots required');
 const sourceId=sourceSlotId.trim(),destId=destinationSlotId.trim();
 if(sourceId===destId)fail('CPU_SEASON_SAVE_SOURCE_PROTECTED','Cannot replace active source save');
 if(confirmCommit!==true)fail('CPU_SEASON_SAVE_APPROVAL_REQUIRED','Explicit season transition confirmation required');
 if(!repository.has(sourceId))fail('CPU_SEASON_SAVE_SOURCE_MISSING','Source save missing');
 if(repository.has(destId))fail('CPU_SEASON_SAVE_DESTINATION_OCCUPIED','Destination save already exists');
 const source=repository.load(sourceId).state;
 const fingerprint=serializeGameState(source);
 if(typeof expectedSourceFingerprint!=='string'||fingerprint!==expectedSourceFingerprint)
  fail('CPU_SEASON_SAVE_SOURCE_STALE','Source fingerprint mismatch');
 const candidate=createCPUSeasonTransitionCandidate(source,transition);
 if(serializeGameState(source)!==fingerprint||serializeGameState(repository.load(sourceId).state)!==fingerprint)
  fail('CPU_SEASON_SAVE_SOURCE_CHANGED','Source changed during candidate preparation');
 if(repository.has(destId))fail('CPU_SEASON_SAVE_DESTINATION_OCCUPIED','Destination save already exists');
 repository.save(destId,candidate.candidateState,{saveId:destId},{replace:false});
 if(serializeGameState(repository.load(destId).state)!==candidate.candidateFingerprint)
  fail('CPU_SEASON_SAVE_VERIFY_FAILED','Persisted season candidate mismatch; preserve destination for recovery');
 if(serializeGameState(repository.load(sourceId).state)!==fingerprint)
  fail('CPU_SEASON_SAVE_SOURCE_CHANGED','Source changed during persistence; preserve destination for recovery');
 return Object.freeze({kind:'phase9-approved-cpu-season-transition-save',version:1,
  sourceSlotId:sourceId,destinationSlotId:destId,fromSeasonId:candidate.fromSeasonId,
  toSeasonId:candidate.toSeasonId,tradeCount:candidate.tradeCount,verified:true,
  sourcePreserved:true,activeFranchiseSlotReplaced:false,productionCPUExecutionEnabled:false});
}
module.exports={persistApprovedCPUSeasonTransition};
