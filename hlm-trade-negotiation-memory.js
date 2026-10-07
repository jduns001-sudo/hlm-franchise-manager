'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {GM_PERSONALITIES,CPU_TRADE_PHILOSOPHIES}=require('./hlm-trade-engine-foundation');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createGMTradeBehavior(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_GM_TRADE_BEHAVIOR_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id||!state.universe.teams.some(t=>String(t.id)===id))fail('GM_TRADE_BEHAVIOR_TEAM_NOT_FOUND','Valid team required.');
 const personality=options.personality??null,philosophy=options.philosophy??null;
 return Object.freeze({kind:'gm-trade-behavior',version:1,teamId:id,personality,philosophy,
  validity:Object.freeze({personality:personality===null||GM_PERSONALITIES.includes(personality),philosophy:philosophy===null||CPU_TRADE_PHILOSOPHIES.includes(philosophy)}),
  behavior:Object.freeze({offerGenerationPerformed:false,counterofferGenerationPerformed:false,automaticDecisionPerformed:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
function createNegotiationMemory(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_NEGOTIATION_MEMORY_STATE','Valid GameState required.');
 const a=String(input.teamAId??'').trim(),b=String(input.teamBId??'').trim();
 if(!a||!b||a===b)fail('NEGOTIATION_MEMORY_TEAMS_REQUIRED','Two different teams required.');
 for(const id of [a,b])if(!state.universe.teams.some(t=>String(t.id)===id))fail('NEGOTIATION_MEMORY_TEAM_NOT_FOUND','Negotiation team not found.');
 const dealings=Object.freeze((Array.isArray(input.pastDealings)?input.pastDealings:[]).map(x=>Object.freeze({...x})));
 return Object.freeze({kind:'trade-negotiation-memory',version:1,teamAId:a,teamBId:b,relationship:input.relationship??null,pastDealings:dealings,
  influence:Object.freeze({futureNegotiations:true,formulaApplied:false,automaticOutcome:false}),
  sourceStateMutated:false,persistencePerformed:false});
}
function createNegotiationContext(state,input={}){
 const memory=createNegotiationMemory(state,input);const a=createGMTradeBehavior(state,memory.teamAId,input.teamA||{});const b=createGMTradeBehavior(state,memory.teamBId,input.teamB||{});
 return Object.freeze({kind:'trade-negotiation-context',version:1,memory,teamABehavior:a,teamBBehavior:b,
  negotiation:Object.freeze({offersSupported:true,counteroffersSupported:true,performed:false}),sourceStateMutated:false,persistencePerformed:false});
}
module.exports={createGMTradeBehavior,createNegotiationMemory,createNegotiationContext};
