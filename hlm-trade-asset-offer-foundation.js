'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const TRADE_ASSET_TYPES=Object.freeze(['player','prospect','draft-pick','salary','future-asset']);
const OFFER_TYPES=Object.freeze(['offer','counteroffer']);
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function createTradeAsset(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_ASSET_STATE','Valid GameState required.');
 const type=String(input.type||'');if(!TRADE_ASSET_TYPES.includes(type))fail('UNSUPPORTED_TRADE_ASSET_TYPE','Supported trade asset type required.');
 const id=String(input.id??'').trim();if(!id)fail('TRADE_ASSET_ID_REQUIRED','Permanent asset ID required.');
 const ownerTeamId=String(input.ownerTeamId??'').trim();if(!ownerTeamId||!state.universe.teams.some(t=>String(t.id)===ownerTeamId))fail('TRADE_ASSET_OWNER_TEAM_REQUIRED','Valid owner team ID required.');
 let exists=true;
 if(type==='player'||type==='prospect')exists=state.universe.players.some(p=>String(p.id)===id);
 if(type==='draft-pick')exists=state.assets.draftPicks.some(p=>String(p.id??p.pickId)===id);
 if(!exists)fail('TRADE_ASSET_NOT_FOUND','Referenced trade asset not found.');
 return Object.freeze({kind:'trade-asset',version:1,type,id,ownerTeamId,retention:input.retention??null,conditions:input.conditions??null,protection:input.protection??null,
  sourceStateMutated:false,persistencePerformed:false});
}
function createTradeOfferCandidate(state,input={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_TRADE_OFFER_STATE','Valid GameState required.');
 const type=input.type??'offer';if(!OFFER_TYPES.includes(type))fail('UNSUPPORTED_TRADE_OFFER_TYPE','Offer or counteroffer required.');
 const fromTeamId=String(input.fromTeamId??'').trim(),toTeamId=String(input.toTeamId??'').trim();
 if(!fromTeamId||!toTeamId||fromTeamId===toTeamId)fail('TRADE_OFFER_TEAMS_REQUIRED','Two different team IDs required.');
 for(const id of [fromTeamId,toTeamId])if(!state.universe.teams.some(t=>String(t.id)===id))fail('TRADE_OFFER_TEAM_NOT_FOUND','Trade team not found.');
 const offered=Object.freeze((input.offeredAssets||[]).map(x=>createTradeAsset(state,x)));
 const requested=Object.freeze((input.requestedAssets||[]).map(x=>createTradeAsset(state,x)));
 return Object.freeze({kind:'trade-offer-candidate',version:1,type,fromTeamId,toTeamId,offeredAssets:offered,requestedAssets:requested,parentOfferId:input.parentOfferId??null,
  negotiation:Object.freeze({generated:false,counterofferSupported:true,accepted:false,rejected:false}),candidateOnly:true,transactionPerformed:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={TRADE_ASSET_TYPES,OFFER_TYPES,createTradeAsset,createTradeOfferCandidate};
