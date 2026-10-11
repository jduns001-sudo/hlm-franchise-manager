'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function prepareApprovedCPUTradeBatch({repository,sourceSlotId,steps,expectedSourceFingerprint}={}){
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  fail('CPU_BATCH_INVALID_REPOSITORY','Readable repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim())fail('CPU_BATCH_INVALID_SLOT','Source slot required');
 const id=sourceSlotId.trim();
 if(!repository.has(id))fail('CPU_BATCH_SOURCE_MISSING','Source slot not found');
 const source=repository.load(id).state;
 const fingerprint=serializeGameState(source);
 if(typeof expectedSourceFingerprint!=='string'||expectedSourceFingerprint!==fingerprint)
  fail('CPU_BATCH_SOURCE_STALE','Source fingerprint mismatch');
 const sequence=createSequentialIsolatedCPUTradeCandidates(source,steps);
 if(serializeGameState(source)!==fingerprint)fail('CPU_BATCH_SOURCE_CHANGED','Source mutated during batch');
 return Object.freeze({kind:'phase9-approved-cpu-trade-batch-preview',version:1,sourceSlotId:id,
  sourceFingerprint:fingerprint,candidateFingerprint:serializeGameState(sequence.candidateState),
  stepCount:sequence.steps.length,transactionIds:Object.freeze(sequence.steps.map(s=>s.transactionId)),
  readyForExplicitCommit:true,committed:false,sourcePreserved:true});
}
module.exports={prepareApprovedCPUTradeBatch};
