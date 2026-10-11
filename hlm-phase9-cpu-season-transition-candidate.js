'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialIsolatedCPUTradeCandidates}=require('./hlm-phase9-cpu-trade-sequence');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createCPUSeasonTransitionCandidate(state,{fromSeasonId,toSeasonId,nextDate,steps=[]}={}){
 if(!validateGameStateEnvelope(state).valid)fail('CPU_SEASON_TRANSITION_INVALID_STATE','Valid GameState required');
 if(![fromSeasonId,toSeasonId,nextDate].every(v=>typeof v==='string'&&v.trim()))
  fail('CPU_SEASON_TRANSITION_FIELDS_REQUIRED','From season, next season and next date required');
 if(fromSeasonId===toSeasonId)fail('CPU_SEASON_TRANSITION_SAME_SEASON','Season IDs must differ');
 const old=state.history.seasons.filter(s=>String(s.id??s.seasonId)===fromSeasonId);
 if(old.length!==1)fail('CPU_SEASON_TRANSITION_SOURCE_SEASON','Exactly one source season required');
 if(state.history.seasons.some(s=>String(s.id??s.seasonId)===toSeasonId))
  fail('CPU_SEASON_TRANSITION_TARGET_EXISTS','Target season already exists');
 if(old[0].status!=='completed')fail('CPU_SEASON_TRANSITION_NOT_COMPLETED','Source season must be completed');
 if(state.history.seasons.some(s=>s.status==='active'))
  fail('CPU_SEASON_TRANSITION_ACTIVE_SEASON','Cannot create a new active season while another is active');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)||!Number.isFinite(Date.parse(nextDate))||
    new Date(nextDate).toISOString().slice(0,10)!==nextDate)
  fail('CPU_SEASON_TRANSITION_INVALID_DATE','Valid next date required');
 if(typeof state.meta.currentDate!=='string'||nextDate<=state.meta.currentDate)
  fail('CPU_SEASON_TRANSITION_DATE_ORDER','Next date must follow current date');
 const fingerprint=serializeGameState(state);
 const sequence=steps.length?createSequentialIsolatedCPUTradeCandidates(state,steps):null;
 const candidate=JSON.parse(JSON.stringify(sequence?.candidateState??state));
 candidate.history.seasons.push({id:toSeasonId,status:'active',previousSeasonId:fromSeasonId});
 candidate.meta.currentDate=nextDate;
 if(serializeGameState(state)!==fingerprint)fail('CPU_SEASON_TRANSITION_SOURCE_CHANGED','Source state changed');
 if(String(candidate.meta.controlledTeamId??'')!==String(state.meta.controlledTeamId??''))
  fail('CPU_SEASON_TRANSITION_HUMAN_CHANGED','Human controlled team must remain unchanged');
 if(!validateGameStateEnvelope(candidate).valid)fail('CPU_SEASON_TRANSITION_CANDIDATE_INVALID','Invalid transition candidate');
 return Object.freeze({kind:'phase9-cpu-season-transition-candidate',version:1,candidateState:candidate,
  fromSeasonId,toSeasonId,nextDate,tradeCount:steps.length,sourceFingerprint:fingerprint,
  candidateFingerprint:serializeGameState(candidate),candidateOnly:true,persistencePerformed:false,
  productionCPUExecutionEnabled:false});
}
module.exports={createCPUSeasonTransitionCandidate};
