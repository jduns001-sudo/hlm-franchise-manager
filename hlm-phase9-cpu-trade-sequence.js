'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createIsolatedCPUTradeCandidate}=require('./hlm-phase9-cpu-isolated-trade-candidate');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createSequentialIsolatedCPUTradeCandidates(state,steps){
 if(!validateGameStateEnvelope(state).valid)fail('CPU_TRADE_SEQUENCE_INVALID_STATE','Valid GameState required');
 if(!Array.isArray(steps)||steps.length===0)fail('CPU_TRADE_SEQUENCE_EMPTY','Nonempty CPU trade sequence required');
 const source=serializeGameState(state);
 let current=state;
 const results=[];
 for(const [index,step] of steps.entries()){
  if(!step||typeof step!=='object')fail('CPU_TRADE_SEQUENCE_INVALID_STEP','CPU trade step required');
  const candidate=createIsolatedCPUTradeCandidate(current,step.teamId,step.trade);
  current=candidate.candidateState;
  results.push(Object.freeze({index,teamId:String(step.teamId),transactionId:step.trade.transactionId,assetCount:candidate.assetCount}));
 }
 if(serializeGameState(state)!==source)fail('CPU_TRADE_SEQUENCE_SOURCE_CHANGED','Original GameState changed');
 return Object.freeze({kind:'phase9-sequential-isolated-cpu-trades',version:1,candidateState:current,
  steps:Object.freeze(results),sourceStateMutated:false,candidateOnly:true,liveExecutionPerformed:false,
  persistencePerformed:false,readyForLiveExecution:false});
}
module.exports={createSequentialIsolatedCPUTradeCandidates};
