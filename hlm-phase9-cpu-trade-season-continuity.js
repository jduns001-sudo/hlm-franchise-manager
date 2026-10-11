'use strict';
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function previewCPUTradeSeasonContinuity({repository,sourceSlotId,expectedSourceFingerprint,seasonId,steps}={}){
 if(!repository||typeof repository.has!=='function'||typeof repository.load!=='function')
  fail('CPU_SEASON_INVALID_REPOSITORY','Readable repository required');
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repository.has(sourceSlotId.trim()))
  fail('CPU_SEASON_SOURCE_MISSING','Source save slot missing');
 if(typeof seasonId!=='string'||!seasonId.trim())fail('CPU_SEASON_ID_REQUIRED','Season ID required');
 const state=repository.load(sourceSlotId.trim()).state;
 const sourceFingerprint=serializeGameState(state);
 if(expectedSourceFingerprint!==sourceFingerprint)fail('CPU_SEASON_SOURCE_STALE','Source fingerprint mismatch');
 const existing=state.history.seasons.filter(s=>String(s.id??s.seasonId)===seasonId.trim());
 if(existing.length!==1)fail('CPU_SEASON_NOT_UNIQUE','Exactly one existing season history record required');
 const sequence=createSequentialIsolatedCPUTradeCandidates(state,steps);
 const result=sequence.candidateState;
 if(serializeGameState(state)!==sourceFingerprint)fail('CPU_SEASON_SOURCE_CHANGED','Source mutated');
 if(JSON.stringify(result.history.seasons)!==JSON.stringify(state.history.seasons))
  fail('CPU_SEASON_HISTORY_CHANGED','CPU trades must preserve season history');
 if(JSON.stringify(result.meta)!==JSON.stringify(state.meta))
  fail('CPU_SEASON_META_CHANGED','CPU trades must not advance calendar or controlled team');
 const newTransactions=result.activity.transactions.slice(state.activity.transactions.length);
 if(newTransactions.length!==steps.length||newTransactions.some(t=>t.type!=='cpu-trade'))
  fail('CPU_SEASON_TRANSACTION_MISMATCH','Expected one CPU trade audit per step');
 return Object.freeze({kind:'phase9-cpu-trade-season-continuity-preview',version:1,seasonId:seasonId.trim(),
  sourceSlotId:sourceSlotId.trim(),sourceFingerprint,candidateFingerprint:serializeGameState(result),
  historicalSeasonsPreserved:true,currentDatePreserved:true,controlledTeamPreserved:true,
  transactionIds:Object.freeze(newTransactions.map(t=>String(t.id))),stepCount:steps.length,
  previewOnly:true,multiSeasonCPUExecutionEnabled:false});
}
module.exports={previewCPUTradeSeasonContinuity};
