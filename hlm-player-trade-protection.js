'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const PLAYER_PROTECTION_TYPES=Object.freeze(['no-trade','modified-no-trade','no-movement','destination-preferences']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createPlayerTradeProtection(state,playerId,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PLAYER_PROTECTION_STATE','Valid GameState required.');
 const pid=String(playerId??'').trim();if(!state.universe.players.some(p=>String(p.id)===pid))fail('PLAYER_PROTECTION_PLAYER_NOT_FOUND','Player not found.');
 const type=input.type??null;if(type!==null&&!PLAYER_PROTECTION_TYPES.includes(type))fail('UNSUPPORTED_PLAYER_PROTECTION_TYPE','Unsupported protection type.');
 return Object.freeze({kind:'player-trade-protection',version:1,playerId:pid,type,
  destinations:Object.freeze(Array.isArray(input.destinations)?[...input.destinations]:[]),waived:input.waived===true,
  terms:input.terms??null,sourceStateMutated:false,persistencePerformed:false});
}
function evaluateTradeDestinationProtection(state,protection,destinationTeamId){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PROTECTION_EVALUATION_STATE','Valid GameState required.');
 const dest=String(destinationTeamId??'').trim();if(!state.universe.teams.some(t=>String(t.id)===dest))fail('PROTECTION_DESTINATION_NOT_FOUND','Destination team not found.');
 if(!protection||protection.kind!=='player-trade-protection')fail('PLAYER_PROTECTION_REQUIRED','Player protection required.');
 let status='requires-rule-resolution',reason='League-specific protection mechanics are not yet defined.';
 if(protection.type===null||protection.waived){status='clear';reason=protection.waived?'Player protection is caller-supplied as waived.':'No player protection supplied.';}
 return Object.freeze({kind:'trade-destination-protection-evaluation',version:1,playerId:protection.playerId,destinationTeamId:dest,protectionType:protection.type,
  status,reason,destinationPreferences:Object.freeze([...protection.destinations]),automaticApproval:false,tradeExecuted:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={PLAYER_PROTECTION_TYPES,createPlayerTradeProtection,evaluateTradeDestinationProtection};
