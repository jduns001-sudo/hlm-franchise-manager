'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-trade-pick-terms');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}],players:[{id:'p1'}],draftPicks:[{pickId:'d1'},{pickId:'d2'}]});const before=JSON.stringify(state);
assert.strictEqual(x.createSalaryRetention(state,{playerId:'p1',originalTeamId:'PIT'}).attachedToOriginalOrganization,true);
assert.strictEqual(x.createConditionalPickTerms(state,'d1',{condition:'caller-supplied'}).evaluation.performed,false);
assert.strictEqual(x.createPickProtection(state,'d1',{type:'top-10'}).resolutionPerformed,false);
const swap=x.createPickSwapRight(state,{pickIds:['d1','d2'],right:'better'});assert.strictEqual(swap.selectedPickId,null);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade pick terms tests passed.');
