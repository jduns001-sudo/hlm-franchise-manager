'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createGMTradeBehavior,createNegotiationMemory,createNegotiationContext}=require('./hlm-trade-negotiation-memory');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}]});const before=JSON.stringify(state);
const gm=createGMTradeBehavior(state,'PIT',{personality:'patient',philosophy:'Contender'});assert.strictEqual(gm.validity.personality,true);
const mem=createNegotiationMemory(state,{teamAId:'PIT',teamBId:'BUF',relationship:'caller-supplied',pastDealings:[{result:'declined'}]});assert.strictEqual(mem.influence.futureNegotiations,true);assert.strictEqual(mem.influence.formulaApplied,false);
const ctx=createNegotiationContext(state,{teamAId:'PIT',teamBId:'BUF',teamA:{personality:'flexible'},teamB:{personality:'stubborn'}});assert.strictEqual(ctx.negotiation.performed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade negotiation memory tests passed.');
