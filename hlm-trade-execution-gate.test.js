'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createTradeExecutionPackage}=require('./hlm-trade-execution-gate');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}],players:[{id:'p1'}]});const before=JSON.stringify(state);
const base={teamIds:['PIT','BUF'],legs:[{fromTeamId:'PIT',toTeamId:'BUF',assets:[{type:'player',id:'p1',ownerTeamId:'PIT'}]}]};
const blocked=createTradeExecutionPackage(state,base);assert.strictEqual(blocked.authorization.authorized,false);assert(blocked.authorization.blockers.includes('human-gm-approval-required'));
const ready=createTradeExecutionPackage(state,{...base,playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,humanGMApproved:true});
assert.strictEqual(ready.authorization.authorized,true);assert.strictEqual(ready.authorization.humanGMFinalAuthority,true);assert.strictEqual(ready.executionPerformed,false);assert.strictEqual(ready.candidateState,null);assert.strictEqual(JSON.stringify(state),before);
console.log('Trade execution gate tests passed.');
