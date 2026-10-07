'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createPhase6IntegrationExitGate}=require('./hlm-phase6-integration-exit-gate');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT',retired:false}],contracts:[{id:'C1',playerId:1,teamId:'PIT'}],draftPicks:[{pickId:'P1',ownerTeamId:'PIT'}]});
const before=JSON.stringify(state);
const gate=createPhase6IntegrationExitGate(state,'PIT',{configuration:{lines:{forwards:[[1]]}},leadership:{philosophy:'Balanced'},ai:{recommendations:[{type:'review'}]},
 action:{type:'call-up',playerId:1,assignmentType:'standard',leagueRules:{approved:true}},approved:true});
assert.strictEqual(gate.passed,true);assert.strictEqual(gate.checks.transactionVerified,true);assert.strictEqual(gate.checks.humanGMFinalDecision,true);
assert.strictEqual(gate.boundaries.phase7TradeExecutionIncluded,false);assert.strictEqual(gate.boundaries.livePersistenceIncluded,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Phase 6 integration exit gate tests passed.');
