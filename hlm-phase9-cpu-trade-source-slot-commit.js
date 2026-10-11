'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function commitApprovedCPUTradeSequence({repository,sourceSlotId,destinationSlotId,steps,expectedSourceFingerprint,confirmCommit=false}={}){
 if(!repository||['has','load','save'].some(k=>typeof repository[k]!=='function'))
  fail('CPU_COMMIT_INVALID_REPOSITORY','Repository with has, load and save required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||typeof destinationSlotId!=='string'||!destinationSlotId.trim())
  fail('CPU_COMMIT_INVALID_SLOT','Source and destination slot IDs required');
 const sourceId=sourceSlotId.trim(),destinationId=destinationSlotId.trim();
 if(sourceId===destinationId)fail('CPU_COMMIT_SOURCE_PROTECTED','Cannot overwrite source franchise slot');
 if(confirmCommit!==true)fail('CPU_COMMIT_CONFIRMATION_REQUIRED','Explicit commit confirmation required');
 if(!repository.has(sourceId))fail('CPU_COMMIT_SOURCE_MISSING','Source slot missing');
 if(repository.has(destinationId))fail('CPU_COMMIT_DESTINATION_OCCUPIED','Destination slot already exists');
 const state=repository.load(sourceId).state;
 const fingerprint=serializeGameState(state);
 if(typeof expectedSourceFingerprint!=='string'||fingerprint!==expectedSourceFingerprint)
  fail('CPU_COMMIT_SOURCE_STALE','Source snapshot does not match approved fingerprint');
 const sequence=createSequentialIsolatedCPUTradeCandidates(state,steps);
 if(serializeGameState(state)!==fingerprint)fail('CPU_COMMIT_SOURCE_CHANGED','Source state changed during candidate generation');
 if(!repository.has(sourceId)||serializeGameState(repository.load(sourceId).state)!==fingerprint)
  fail('CPU_COMMIT_SOURCE_STALE','Source slot changed before commit');
 if(repository.has(destinationId))fail('CPU_COMMIT_DESTINATION_OCCUPIED','Destination slot already exists');
 const candidateFingerprint=serializeGameState(sequence.candidateState);
 repository.save(destinationId,sequence.candidateState,{saveId:destinationId},{replace:false});
 const persisted=repository.load(destinationId).state;
 if(serializeGameState(persisted)!==candidateFingerprint)
  fail('CPU_COMMIT_VERIFY_FAILED','Saved CPU trade candidate mismatch; destination retained for recovery');
 if(serializeGameState(repository.load(sourceId).state)!==fingerprint)
  fail('CPU_COMMIT_SOURCE_CHANGED','Source slot changed during commit; destination retained for recovery');
 return Object.freeze({kind:'phase9-cpu-trade-sequence-committed-slot',version:1,
  sourceSlotId:sourceId,destinationSlotId:destinationId,stepCount:sequence.steps.length,
  verified:true,sourcePreserved:true,persistentCandidateCreated:true,
  activeFranchiseSlotReplaced:false,productionCPUExecutionEnabled:false});
}
module.exports={commitApprovedCPUTradeSequence};
