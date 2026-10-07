'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {createMultiTeamTradeCandidate}=require('./hlm-multi-team-trade');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1'},{id:'p2'}]});const before=JSON.stringify(state);
const c=createMultiTeamTradeCandidate(state,{teamIds:['PIT','BUF','NYR'],legs:[{fromTeamId:'PIT',toTeamId:'BUF',assets:[{type:'player',id:'p1',ownerTeamId:'PIT'}]},{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p2',ownerTeamId:'BUF'}]}]});
assert.strictEqual(c.participantCount,3);assert.strictEqual(c.threeTeamSupported,true);assert.strictEqual(c.authorizationRequired,true);assert.strictEqual(c.transactionPerformed,false);assert.strictEqual(JSON.stringify(state),before);
assert.throws(()=>createMultiTeamTradeCandidate(state,{teamIds:['PIT','BUF'],legs:[{fromTeamId:'PIT',toTeamId:'BUF',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]}]}),/owner/i);
console.log('Multi-team trade candidate tests passed.');
