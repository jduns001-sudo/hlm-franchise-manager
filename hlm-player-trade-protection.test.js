'use strict';const assert=require('assert');const {createGameStateEnvelope}=require('./hlm-game-state');const {PLAYER_PROTECTION_TYPES,createPlayerTradeProtection,evaluateTradeDestinationProtection}=require('./hlm-player-trade-protection');
const state=createGameStateEnvelope({teams:[{id:'PIT'},{id:'BUF'}],players:[{id:'p1',teamId:'PIT'}]});const before=JSON.stringify(state);
assert.deepStrictEqual([...PLAYER_PROTECTION_TYPES],['no-trade','modified-no-trade','no-movement','destination-preferences']);
const p=createPlayerTradeProtection(state,'p1',{type:'modified-no-trade',destinations:['BUF']});const e=evaluateTradeDestinationProtection(state,p,'BUF');
assert.strictEqual(e.status,'requires-rule-resolution');assert.strictEqual(e.automaticApproval,false);
const w=createPlayerTradeProtection(state,'p1',{type:'no-trade',waived:true});assert.strictEqual(evaluateTradeDestinationProtection(state,w,'BUF').status,'clear');assert.strictEqual(JSON.stringify(state),before);
console.log('Player trade protection tests passed.');
