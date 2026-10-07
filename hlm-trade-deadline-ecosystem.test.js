'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-trade-deadline-ecosystem');const state=createGameStateEnvelope({teams:[{id:'PIT'}]});const before=JSON.stringify(state);
assert.deepStrictEqual([...x.DEADLINE_POSTURES],['buy','sell','hold','rebuild','push']);assert.deepStrictEqual([...x.DEADLINE_FACTORS],['standings','injuries','contracts','assets','owner-goals']);
assert.strictEqual(x.createTradeDeadlineContext(state,'PIT').evaluation.performed,false);assert.strictEqual(x.createTradeRumor(state,{reliability:'caller-supplied'}).generated,false);
assert.strictEqual(x.createTradeBlock(state,'PIT',{untouchables:['p1']}).untouchables[0],'p1');assert.strictEqual(x.createSecretTarget(state,'PIT',{target:'p2'}).confirmed,false);
const b=x.createDeadlineBriefing(state,'PIT',{'team-status':'caller-supplied'});assert.strictEqual(b.automaticAction,false);assert.strictEqual(b.recommendationGenerated,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade deadline ecosystem tests passed.');
