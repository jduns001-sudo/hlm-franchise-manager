'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const DEADLINE_POSTURES=Object.freeze(['buy','sell','hold','rebuild','push']);
const DEADLINE_FACTORS=Object.freeze(['standings','injuries','contracts','assets','owner-goals']);
const BRIEFING_AREAS=Object.freeze(['team-status','weaknesses','assets','protected-assets','targets','expected-costs']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function validTeam(state,id){return state.universe.teams.some(t=>String(t.id)===String(id));}
function createTradeDeadlineContext(state,teamId,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_DEADLINE_STATE','Valid GameState required.');if(!validTeam(state,teamId))fail('DEADLINE_TEAM_NOT_FOUND','Team not found.');
 return Object.freeze({kind:'trade-deadline-context',version:1,teamId:String(teamId),postures:DEADLINE_POSTURES,factors:DEADLINE_FACTORS,
  evidence:Object.freeze({...input.evidence}),evaluation:Object.freeze({posture:null,performed:false}),sourceStateMutated:false,persistencePerformed:false});
}
function createTradeBlock(state,teamId,input={}){
 if(!validateGameStateEnvelope(state).valid||!validTeam(state,teamId))fail('TRADE_BLOCK_TEAM_NOT_FOUND','Valid state/team required.');
 return Object.freeze({kind:'trade-block',version:1,teamId:String(teamId),available:Object.freeze([...(input.available||[])]),needs:Object.freeze([...(input.needs||[])]),untouchables:Object.freeze([...(input.untouchables||[])]),mayMove:Object.freeze([...(input.mayMove||[])]),sourceStateMutated:false,persistencePerformed:false});
}
function createTradeRumor(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_RUMOR_STATE','Valid GameState required.');
 return Object.freeze({kind:'trade-rumor',version:1,subject:input.subject??null,organizationalBehaviorEvidence:input.organizationalBehaviorEvidence??null,reliability:input.reliability??null,generated:false,confirmed:false,sourceStateMutated:false,persistencePerformed:false});
}
function createSecretTarget(state,teamId,input={}){
 if(!validateGameStateEnvelope(state).valid||!validTeam(state,teamId))fail('SECRET_TARGET_TEAM_NOT_FOUND','Valid state/team required.');
 return Object.freeze({kind:'secret-trade-target',version:1,teamId:String(teamId),target:input.target??null,scoutingEvidence:input.scoutingEvidence??null,aiAnalysis:input.aiAnalysis??null,confirmed:false,sourceStateMutated:false,persistencePerformed:false});
}
function createDeadlineBriefing(state,teamId,input={}){
 const context=createTradeDeadlineContext(state,teamId,input);const sections={};for(const k of BRIEFING_AREAS)sections[k]=input[k]??null;
 return Object.freeze({kind:'ai-deadline-briefing',version:1,teamId:String(teamId),context,areas:BRIEFING_AREAS,sections:Object.freeze(sections),recommendationGenerated:false,automaticAction:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={DEADLINE_POSTURES,DEADLINE_FACTORS,BRIEFING_AREAS,createTradeDeadlineContext,createTradeBlock,createTradeRumor,createSecretTarget,createDeadlineBriefing};
