'use strict';
const {createIsolatedCPUTradeCandidate}=require('./hlm-phase9-cpu-isolated-trade-candidate');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function verifyIsolatedCPUTradeSaveRoundTrip({state,teamId,trade,repository,slotId}={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_CPU_TRADE_SAVE_STATE','Valid GameState required');
 if(!repository||['has','save','load','remove'].some(k=>typeof repository[k]!=='function'))
  fail('INVALID_CPU_TRADE_SAVE_REPOSITORY','Isolated save repository required');
 if(typeof slotId!=='string'||!slotId.trim())fail('INVALID_CPU_TRADE_SAVE_SLOT','Nonempty isolated save slot required');
 const id=slotId.trim();
 if(repository.has(id))fail('CPU_TRADE_SAVE_SLOT_OCCUPIED','Existing saves cannot be replaced');
 const sourceBefore=serializeGameState(state);
 const candidate=createIsolatedCPUTradeCandidate(state,teamId,trade);
 const expected=serializeGameState(candidate.candidateState);
 let written=false;
 try{
  repository.save(id,candidate.candidateState,{saveId:id},{replace:false});written=true;
  const loaded=repository.load(id)?.state;
  if(!validateGameStateEnvelope(loaded).valid||serializeGameState(loaded)!==expected)
   fail('CPU_TRADE_SAVE_ROUNDTRIP_MISMATCH','Reloaded candidate does not match');
  if(serializeGameState(state)!==sourceBefore)fail('CPU_TRADE_SOURCE_CHANGED','Source changed');
  return Object.freeze({kind:'phase9-cpu-trade-isolated-save-roundtrip',version:1,slotId:id,teamId:String(teamId),
   verified:true,isolatedSaveWritten:true,liveFranchiseSaveChanged:false,sourceStateMutated:false,
   candidateOnly:true,productionCPUExecutionEnabled:false,assetCount:candidate.assetCount});
 }catch(error){
  try{
   // Never delete a slot that another writer may have created after our initial has() check.
   // On an ambiguous failed write, preserve the slot for manual recovery.
   if(written)repository.remove(id);
  }catch(rollbackError){error.rollbackError=rollbackError;}
  throw error;
 }
}
module.exports={verifyIsolatedCPUTradeSaveRoundTrip};
