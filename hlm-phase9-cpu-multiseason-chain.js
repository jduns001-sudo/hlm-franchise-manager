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
  // Between transitions, only an explicitly supplied season completion record can close the prior season.
  if(index>0){
   const completion=transition.completedSeason;
   if(!completion||completion.seasonId!==transition.fromSeasonId||
      typeof completion.championTeamId!=='string'||!completion.championTeamId.trim())
    fail('CPU_MULTI_SEASON_COMPLETION_REQUIRED','Explicit completed-season result required for subsequent transition');
   if(!current.universe.teams.some(t=>String(t.id)===completion.championTeamId))
    fail('CPU_MULTI_SEASON_CHAMPION_UNKNOWN','Champion team must exist');
   const active=current.history.seasons.filter(s=>String(s.id??s.seasonId)===completion.seasonId&&s.status==='active');
   if(active.length!==1)fail('CPU_MULTI_SEASON_COMPLETION_MISMATCH','Exactly one matching active season required');
   current=JSON.parse(JSON.stringify(current));
   const season=current.history.seasons.find(s=>String(s.id??s.seasonId)===completion.seasonId);
   season.status='completed';
   season.champion=completion.championTeamId;
  }
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
