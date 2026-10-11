'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {summarizeCPUTradeSequence}=require('./hlm-phase9-cpu-trade-sequence-evidence');
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'},{id:'BOS'}],players:[{id:'p1',teamId:'BUF'}]});
const before=JSON.stringify(state);
const trade=(from,to,id)=>({teamIds:[from,to],legs:[{fromTeamId:from,toTeamId:to,assets:[{type:'player',id:'p1',ownerTeamId:from}]}],humanGMApproved:true,playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,transactionId:id});
const steps=[{teamId:'BUF',trade:trade('BUF','NYR','t1')},{teamId:'NYR',trade:trade('NYR','BOS','t2')}];
const evidence=summarizeCPUTradeSequence(state,steps);
assert.equal(evidence.stepCount,2);
assert.deepEqual(evidence.transactionIds,['t1','t2']);
assert.deepEqual(evidence.playerMoves,[{playerId:'p1',fromTeamId:'BUF',toTeamId:'BOS'}]);
assert.deepEqual(evidence.draftPickMoves,[]);
assert.equal(evidence.productionCPUExecutionEnabled,false);
assert.notEqual(evidence.sourceStateFingerprint,evidence.candidateStateFingerprint);
assert.equal(JSON.stringify(state),before);
assert.throws(()=>summarizeCPUTradeSequence(state,[steps[0],{teamId:'NYR',trade:trade('NYR','BOS','t1')}]),e=>e.code==='CPU_TRADE_TRANSACTION_ID_DUPLICATE');
assert.equal(JSON.stringify(state),before);
const financed=createGameStateEnvelope({meta:{controlledTeamId:'PIT'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'},{id:'BOS'}],players:[{id:'p1',teamId:'BUF'}],contracts:[{playerId:'p1',teamId:'BUF',aav:100}],finances:[{teamId:'BUF',seasonId:'2026',payroll:200,capLimit:1000},{teamId:'NYR',seasonId:'2026',payroll:300,capLimit:1000},{teamId:'BOS',seasonId:'2026',payroll:400,capLimit:1000}]});
const financialBefore=JSON.stringify(financed);
const financialEvidence=summarizeCPUTradeSequence(financed,steps);
assert.deepEqual(financialEvidence.financialChanges,[
 {teamId:'BUF',seasonId:'2026',beforePayroll:200,afterPayroll:100,change:-100},
 {teamId:'BOS',seasonId:'2026',beforePayroll:400,afterPayroll:500,change:100}
]);
assert.deepEqual(financialEvidence.transactionIds,['t1','t2']);
assert.equal(JSON.stringify(financed),financialBefore);
assert.deepEqual(evidence.financialChanges,[]);
console.log('Phase 9 CPU trade sequence evidence tests passed');
