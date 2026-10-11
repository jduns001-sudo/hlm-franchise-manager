'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createCPUSeasonTransitionCandidate}=require('./hlm-phase9-cpu-season-transition-candidate');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createSequentialCPUSeasonTransitionCandidates(state,transitions){
 if(!validateGameStateEnvelope(state).valid)fail('CPU_MULTI_SEASON_INVALID_STATE','Valid GameState required');
 if(!Array.isArray(transitions)||transitions.length===0)
  fail('CPU_MULTI_SEASON_STEPS_REQUIRED','Nonempty season transitions required');
 const sourceFingerprint=serializeGameState(state);
 let current=state;
 const summaries=[];
 for(const [index,transition] of transitions.entries()){
  if(!transition||typeof transition!=='object'||Array.isArray(transition))
   fail('CPU_MULTI_SEASON_INVALID_STEP','Transition object required');
  const result=createCPUSeasonTransitionCandidate(current,transition);
  current=result.candidateState;
  summaries.push(Object.freeze({index,fromSeasonId:result.fromSeasonId,toSeasonId:result.toSeasonId,
   nextDate:result.nextDate,tradeCount:result.tradeCount}));
 }
 if(serializeGameState(state)!==sourceFingerprint)
  fail('CPU_MULTI_SEASON_SOURCE_CHANGED','Source GameState changed during sequence');
 return Object.freeze({kind:'phase9-sequential-cpu-season-transition-candidates',version:1,
  candidateState:current,sourceFingerprint,candidateFingerprint:serializeGameState(current),
  transitions:Object.freeze(summaries),sourcePreserved:true,candidateOnly:true,
  persistencePerformed:false,productionCPUExecutionEnabled:false});
}
module.exports={createSequentialCPUSeasonTransitionCandidates};
