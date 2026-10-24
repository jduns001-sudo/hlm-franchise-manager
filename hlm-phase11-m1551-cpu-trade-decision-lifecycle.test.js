'use strict';
const assert=require('node:assert/strict');
const {inspectCpuTradeLifecycle:inspect}=require('./hlm-phase11-m1551-cpu-trade-decision-lifecycle');
function fixture(){
 return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},
 cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
function run(state,input,stage){const before=JSON.stringify(state),r=inspect(state,input);
 assert.equal(r.stage,stage);assert.equal(r.saved,false);assert.equal(r.consentAuthenticated,false);
 assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(state),before);return r;}
assert.equal(run(fixture(),input,'source-evidence-agrees').policyDecision,'accept');
const conflict=fixture();conflict.extensions.cpuTradeDecisions[0].decision='decline';
assert.equal(run(conflict,input,'source-evidence-conflicts').decisionMatches,false);
const missing=fixture();delete missing.extensions.cpuTradeDecisions;
assert.equal(run(missing,input,'source-evidence-unavailable').evidenceStatus,'source-cpu-decision-ledger-required');
const duplicate=fixture();duplicate.extensions.cpuTradeDecisions.push({...duplicate.extensions.cpuTradeDecisions[0]});
assert.equal(run(duplicate,input,'source-evidence-unavailable').evidenceStatus,'unique-source-cpu-decision-required');
const stale=fixture();stale.extensions.cpuTradeDecisions[0].gameRevision=12;
assert.equal(run(stale,input,'source-evidence-unavailable').evidenceStatus,'stale-cpu-decision');
assert.equal(run(fixture(),{...input,gmApproved:false},'blocked').code,'human-gm-approval-required');
assert.equal(run(fixture(),{...input,expectedGameRevision:12},'blocked').code,'stale-game-revision');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';
assert.equal(run(restricted,input,'blocked').code,'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;
assert.equal(run(overcap,input,'blocked').code,'salary-cap-exceeded');
const decline=fixture();decline.assets.contracts[0].aav=4;decline.assets.contracts[1].aav=3;
decline.extensions.cpuTradeDecisions[0].decision='decline';
assert.equal(run(decline,input,'source-evidence-agrees').policyDecision,'decline');
console.log('M1551 source CPU decision lifecycle, blocked and conflict cases, no-save passed');
