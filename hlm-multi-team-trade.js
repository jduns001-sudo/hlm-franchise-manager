'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createTradeAsset}=require('./hlm-trade-asset-offer-foundation');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createMultiTeamTradeCandidate(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_MULTI_TEAM_TRADE_STATE','Valid GameState required.');
 const ids=[...new Set((input.teamIds||[]).map(String))];if(ids.length<2)fail('MULTI_TEAM_TRADE_TEAMS_REQUIRED','At least two participating organizations required.');
 if(ids.some(id=>!state.universe.teams.some(t=>String(t.id)===id)))fail('MULTI_TEAM_TRADE_TEAM_NOT_FOUND','Participating team not found.');
 const legs=(input.legs||[]).map((leg,i)=>{
  const from=String(leg.fromTeamId??''),to=String(leg.toTeamId??'');if(!ids.includes(from)||!ids.includes(to)||from===to)fail('INVALID_MULTI_TEAM_TRADE_LEG','Each leg requires two different participating teams.');
  const assets=(leg.assets||[]).map(a=>createTradeAsset(state,a));if(assets.some(a=>a.ownerTeamId!==from))fail('MULTI_TEAM_TRADE_ASSET_OWNER_MISMATCH','Asset owner must match sending team.');
  return Object.freeze({legId:String(leg.legId??i+1),fromTeamId:from,toTeamId:to,assets:Object.freeze(assets)});
 });
 return Object.freeze({kind:'multi-team-trade-candidate',version:1,teamIds:Object.freeze(ids),legs:Object.freeze(legs),
  participantCount:ids.length,twoTeamSupported:true,threeTeamSupported:true,moreTeamsStructurallySupported:true,
  validation:Object.freeze({participantsValid:true,legsValid:true,assetOwnershipAtCandidateTime:true}),
  candidateOnly:true,authorizationRequired:true,transactionPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={createMultiTeamTradeCandidate};
