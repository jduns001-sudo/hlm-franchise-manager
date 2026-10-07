'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createTeamTradeContext,createContextualPlayerTradeValueInputs}=require('./hlm-trade-value-context');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}],players:[{id:1,teamId:'PIT',ovr:88,position:'C'}]});const before=JSON.stringify(state);
const pit=createTeamTradeContext(state,'PIT',{needs:[{type:'cap',detail:'space'}],competitiveWindow:'contender'});
const buf=createTeamTradeContext(state,'BUF',{needs:[{type:'prospect',detail:'center'}],competitiveWindow:'rebuild'});
const a=createContextualPlayerTradeValueInputs(state,1,pit,{factors:{contract:'caller-supplied'}});
const b=createContextualPlayerTradeValueInputs(state,1,buf);
assert.strictEqual(a.principles.overallAloneDeterminesValue,false);assert.strictEqual(a.valuation.formulaApplied,false);assert.strictEqual(a.factors.overall,88);
assert.notStrictEqual(a.teamId,b.teamId);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade value context tests passed.');
