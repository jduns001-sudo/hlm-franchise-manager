'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createTradeAsset,createTradeOfferCandidate}=require('./hlm-trade-asset-offer-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}],players:[{id:'p1',teamId:'PIT'},{id:'p2',teamId:'BUF'}],draftPicks:[{pickId:'d1',ownerTeamId:'PIT'}]});const before=JSON.stringify(state);
const asset=createTradeAsset(state,{type:'draft-pick',id:'d1',ownerTeamId:'PIT',protection:{type:'top-10'}});assert.strictEqual(asset.type,'draft-pick');
const offer=createTradeOfferCandidate(state,{fromTeamId:'PIT',toTeamId:'BUF',offeredAssets:[{type:'player',id:'p1',ownerTeamId:'PIT'}],requestedAssets:[{type:'player',id:'p2',ownerTeamId:'BUF'}]});
assert.strictEqual(offer.candidateOnly,true);assert.strictEqual(offer.negotiation.counterofferSupported,true);assert.strictEqual(offer.transactionPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade asset and offer foundation tests passed.');
