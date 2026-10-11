'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createIsolatedCPUTradeCandidate}=require('./hlm-phase9-cpu-isolated-trade-candidate');
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'},{id:'BOS'}],
 players:[{id:'p1',teamId:'BUF'},{id:'p2',teamId:'NYR'},{id:'p3',teamId:'BOS'}],
 contracts:[{playerId:'p1',teamId:'BUF',aav:3000000},{playerId:'p2',teamId:'NYR',aav:4000000},{playerId:'p3',teamId:'BOS',aav:2000000}],
 finances:{buf:{teamId:'BUF',seasonId:2030,payroll:17000000,capLimit:20000000},
 nyr:{teamId:'NYR',seasonId:2030,payroll:18000000,capLimit:20000000},
 bos:{teamId:'BOS',seasonId:2030,payroll:17000000,capLimit:20000000}}});
const trade={teamIds:['BUF','NYR','BOS'],legs:[
 {fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]},
 {fromTeamId:'NYR',toTeamId:'BOS',assets:[{type:'player',id:'p2',ownerTeamId:'NYR'}]},
 {fromTeamId:'BOS',toTeamId:'BUF',assets:[{type:'player',id:'p3',ownerTeamId:'BOS'}]}],
 humanGMApproved:true,playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,transactionId:'three-way-2030'};
const original=JSON.stringify(state);
const candidate=createIsolatedCPUTradeCandidate(state,'BUF',trade).candidateState;
assert.deepEqual(candidate.universe.players.map(p=>p.teamId),['NYR','BOS','BUF']);
assert.deepEqual(candidate.assets.contracts.map(p=>p.teamId),['NYR','BOS','BUF']);
assert.deepEqual([candidate.finances.buf.payroll,candidate.finances.nyr.payroll,candidate.finances.bos.payroll],[16000000,17000000,19000000]);
assert.equal(candidate.activity.transactions.length,1);
assert.equal(candidate.activity.transactions[0].legs.length,3);
assert.equal(JSON.stringify(state),original);
const over=JSON.parse(JSON.stringify(state));over.finances.bos.payroll=20000000;
assert.throws(()=>createIsolatedCPUTradeCandidate(over,'BUF',trade),e=>e.code==='CPU_TRADE_CAP_LIMIT_EXCEEDED');
const missing=JSON.parse(JSON.stringify(state));delete missing.finances.bos;
assert.throws(()=>createIsolatedCPUTradeCandidate(missing,'BUF',trade),e=>e.code==='CPU_TRADE_CAP_RECONCILIATION_UNSUPPORTED');
const duplicate=JSON.parse(JSON.stringify(state));duplicate.finances.bos2={...duplicate.finances.bos};
assert.throws(()=>createIsolatedCPUTradeCandidate(duplicate,'BUF',trade),e=>e.code==='CPU_TRADE_CAP_RECONCILIATION_UNSUPPORTED');
const human={...trade,teamIds:['BUF','NYR','BOS','PIT']};
assert.throws(()=>createIsolatedCPUTradeCandidate(state,'BUF',human),e=>e.code==='CPU_TRADE_HUMAN_TEAM_PROTECTED');
assert.equal(JSON.stringify(state),original);
console.log('Phase 9 three-team CPU trade cap reconciliation tests passed');
