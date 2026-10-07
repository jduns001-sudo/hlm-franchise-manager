'use strict';
const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createPhase6ExitCloseout}=require('./hlm-phase6-exit-closeout');
const state=createGameStateEnvelope({teams:[{id:'PIT'}],players:[{id:1,teamId:'PIT',retired:false}]});const before=JSON.stringify(state);
const r=createPhase6ExitCloseout(state,'PIT',{leadership:{philosophy:'Balanced'},action:{type:'call-up',playerId:1,assignmentType:'standard',leagueRules:{supplied:true}},approved:true});
assert.strictEqual(r.foundationComplete,true);assert.strictEqual(r.integrationGatePassed,true);assert.strictEqual(r.nextPhase.phase,7);
assert.strictEqual(r.gate.boundaries.phase7TradeExecutionIncluded,false);assert.strictEqual(r.persistencePerformed,false);assert.strictEqual(JSON.stringify(state),before);
console.log('Phase 6 exit closeout tests passed.');
