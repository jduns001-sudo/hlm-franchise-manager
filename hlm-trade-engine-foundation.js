'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const CPU_TRADE_PHILOSOPHIES=Object.freeze(['Aggressive','Conservative','Rebuild','Contender','Analytics','Traditional']);
const GM_PERSONALITIES=Object.freeze(['patient','aggressive','flexible','stubborn','secretive','risk-taking','prospect-hoarder','pick-hoarder']);
const TRADE_VALUE_FACTORS=Object.freeze(['needs','age','contract','performance','potential','salary','personality','chemistry','prospects','picks','competitive-window','owner-expectations']);
const TRADE_ENGINE_CAPABILITIES=Object.freeze(['negotiation-and-counteroffers','negotiation-memory','ntc-nmc-and-destination-preferences','salary-retention','conditional-picks','protected-picks','pick-swaps','trade-trees','multi-team-transactions','deadline-behavior','trade-rumors-and-reliability','trade-blocks','secret-targets','deadline-briefings','post-trade-consequences','long-term-trade-retrospectives']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createTradeEngineFoundation(state,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_ENGINE_GAME_STATE','Valid GameState required.');
 const teamId=options.teamId==null?null:String(options.teamId);
 if(teamId!==null&&!state.universe.teams.some(t=>String(t.id)===teamId))fail('TRADE_ENGINE_TEAM_NOT_FOUND','Team not found.');
 return Object.freeze({kind:'trade-engine-foundation',version:1,teamId,
  cpuTradePhilosophies:CPU_TRADE_PHILOSOPHIES,gmPersonalities:GM_PERSONALITIES,tradeValueFactors:TRADE_VALUE_FACTORS,
  capabilities:TRADE_ENGINE_CAPABILITIES,
  principles:Object.freeze({tradeValueContextual:true,overallAloneDeterminesValue:false,teamSpecificValue:true,organizationsHaveDifferentGoalsNeedsPersonalitiesAndMemories:true}),
  inputs:Object.freeze({philosophy:options.philosophy??null,gmPersonality:options.gmPersonality??null,teamNeeds:options.teamNeeds??null,competitiveWindow:options.competitiveWindow??null,ownerExpectations:options.ownerExpectations??null}),
  execution:Object.freeze({valuationPerformed:false,offerGenerated:false,negotiationPerformed:false,tradeExecuted:false,gameStateMutated:false,persistencePerformed:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={CPU_TRADE_PHILOSOPHIES,GM_PERSONALITIES,TRADE_VALUE_FACTORS,TRADE_ENGINE_CAPABILITIES,createTradeEngineFoundation};
