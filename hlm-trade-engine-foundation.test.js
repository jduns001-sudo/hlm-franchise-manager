'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createTradeEngineFoundation,CPU_TRADE_PHILOSOPHIES,GM_PERSONALITIES,TRADE_VALUE_FACTORS}=require('./hlm-trade-engine-foundation');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT',ovr:90}]});const before=JSON.stringify(state);
const x=createTradeEngineFoundation(state,{teamId:'PIT',philosophy:'Contender',gmPersonality:'patient'});
assert.deepStrictEqual(CPU_TRADE_PHILOSOPHIES,['Aggressive','Conservative','Rebuild','Contender','Analytics','Traditional']);
assert.ok(GM_PERSONALITIES.includes('prospect-hoarder'));assert.ok(TRADE_VALUE_FACTORS.includes('competitive-window'));
assert.strictEqual(x.principles.tradeValueContextual,true);assert.strictEqual(x.principles.overallAloneDeterminesValue,false);assert.strictEqual(x.execution.tradeExecuted,false);assert.strictEqual(x.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade engine foundation tests passed.');
