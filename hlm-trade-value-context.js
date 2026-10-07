'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const TEAM_NEED_TYPES=Object.freeze(['immediate-positional','prospect','draft','cap','strategic']);
const PLAYER_VALUE_FACTORS=Object.freeze(['age','overall','potential','contract','salary','performance','development','injury','position','role','personality','fit','demand','team-context']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function list(v){return Array.isArray(v)?v:[];}
function createTeamTradeContext(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TEAM_TRADE_CONTEXT_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id)fail('TEAM_TRADE_CONTEXT_TEAM_REQUIRED','Permanent team ID required.');
 if(!state.universe.teams.some(t=>String(t.id)===id))fail('TEAM_TRADE_CONTEXT_TEAM_NOT_FOUND','Team not found.');
 const needs=Object.freeze(list(options.needs).map(n=>Object.freeze({type:n.type??null,detail:n.detail??null,validType:TEAM_NEED_TYPES.includes(n.type)})));
 return Object.freeze({kind:'team-trade-context',version:1,teamId:id,needTypes:TEAM_NEED_TYPES,needs,
  competitiveWindow:options.competitiveWindow??null,ownerExpectations:options.ownerExpectations??null,philosophy:options.philosophy??null,
  sourceStateMutated:false,persistencePerformed:false});
}
function createContextualPlayerTradeValueInputs(state,playerId,teamContext,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PLAYER_TRADE_VALUE_STATE','Valid GameState required.');
 const pid=String(playerId??'').trim();const player=state.universe.players.find(p=>String(p.id)===pid);
 if(!player)fail('PLAYER_TRADE_VALUE_PLAYER_NOT_FOUND','Player not found.');
 if(!teamContext||teamContext.kind!=='team-trade-context')fail('PLAYER_TRADE_VALUE_TEAM_CONTEXT_REQUIRED','Team trade context required.');
 const supplied=options.factors||{};
 const factors={};for(const key of PLAYER_VALUE_FACTORS)factors[key]=supplied[key]??null;
 factors.overall=factors.overall??player.ovr??null;factors.position=factors.position??player.position??null;
 return Object.freeze({kind:'contextual-player-trade-value-inputs',version:1,playerId:pid,teamId:teamContext.teamId,player:Object.freeze({...player}),
  factors:Object.freeze(factors),teamContext,principles:Object.freeze({contextual:true,teamSpecific:true,overallAloneDeterminesValue:false}),
  valuation:Object.freeze({numericValue:null,formulaApplied:false,rankingApplied:false}),sourceStateMutated:false,persistencePerformed:false});
}
module.exports={TEAM_NEED_TYPES,PLAYER_VALUE_FACTORS,createTeamTradeContext,createContextualPlayerTradeValueInputs};
