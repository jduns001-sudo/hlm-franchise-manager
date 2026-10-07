'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const x=require('./hlm-post-trade-history');const state=createGameStateEnvelope({teams:[{id:'PIT'}]});const before=JSON.stringify(state);
assert.deepStrictEqual([...x.POST_TRADE_EFFECT_AREAS],['rosters','contracts','cap','picks','morale','chemistry','relationships','ai-memory','news','history']);
const c=x.createPostTradeConsequences(state,{tradeId:'t1',effects:{history:{event:'caller-supplied'}}});assert.strictEqual(c.applied,false);
const tree=x.createTradeTree({rootTradeId:'t1',nodes:[{tradeId:'t1',assetId:'p1',nextTradeIds:['t2']},{tradeId:'t2',assetId:'p1',parentTradeId:'t1'}]});assert.strictEqual(tree.traceAcrossMultipleTransactions,true);
const r=x.createLongTermTradeRetrospective({tradeId:'t1',actualOutcomes:{seasons:'caller-supplied'}});assert.strictEqual(r.simpleLetterGradeUsed,false);assert.strictEqual(r.analysisPerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Post-trade history tests passed.');
