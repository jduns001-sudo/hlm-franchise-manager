'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function fail(code,message){const error=new Error(message);error.code=code;throw error;}
function verifySequentialCPUTradeSaveRoundTrip({state,steps,repository,slotId}={}){
 if(!validateGameStateEnvelope(state).valid)fail('CPU_TRADE_SEQUENCE_SAVE_INVALID_STATE','Valid GameState required');
 if(!repository||['has','save','load'].some(k=>typeof repository[k]!=='function'))
  fail('CPU_TRADE_SEQUENCE_SAVE_INVALID_REPOSITORY','Save repository required');
 if(typeof slotId!=='string'||!slotId.trim())fail('CPU_TRADE_SEQUENCE_SAVE_INVALID_SLOT','Nonempty slot required');
 const id=slotId.trim();
 if(repository.has(id))fail('CPU_TRADE_SEQUENCE_SAVE_SLOT_OCCUPIED','Cannot overwrite an existing save');
 const original=serializeGameState(state);
 const sequence=createSequentialIsolatedCPUTradeCandidates(state,steps);
 // The candidate must not have modified the source before any repository write.
 if(serializeGameState(state)!==original)fail('CPU_TRADE_SEQUENCE_SOURCE_CHANGED','Original state changed before save');
 const expected=serializeGameState(sequence.candidateState);
 repository.save(id,sequence.candidateState,{saveId:id},{replace:false});
 const loaded=repository.load(id)?.state;
 if(!validateGameStateEnvelope(loaded).valid||serializeGameState(loaded)!==expected)
  fail('CPU_TRADE_SEQUENCE_SAVE_MISMATCH','Isolated sequence reload mismatch; preserve slot for recovery');
 if(serializeGameState(state)!==original)fail('CPU_TRADE_SEQUENCE_SOURCE_CHANGED','Original state changed');
 return Object.freeze({kind:'phase9-sequential-isolated-cpu-trade-save',version:1,slotId:id,verified:true,
  stepCount:sequence.steps.length,candidateOnly:true,sourceStateMutated:false,
  liveFranchiseSaveChanged:false,productionCPUExecutionEnabled:false});
}
module.exports={verifySequentialCPUTradeSaveRoundTrip};
