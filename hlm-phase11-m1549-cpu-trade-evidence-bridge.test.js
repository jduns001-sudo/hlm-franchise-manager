'use strict';
const assert=require('node:assert/strict');
const {reviewCpuTradeEvidence:review}=require('./hlm-phase11-m1549-cpu-trade-evidence-bridge');
function fixture(){
 return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],
 players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},
 assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},
 {playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},
 finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},
 cpuTradeDecisions:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}};
}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
const state=fixture(),before=JSON.stringify(state);
const agreed=review(state,{...input,cpuConsentAuthenticated:true});
assert.equal(agreed.ok,true);assert.equal(agreed.code,'cpu-policy-evidence-agrees');
assert.equal(agreed.decisionMatches,true);
assert.equal(agreed.saved,false);assert.equal(agreed.consentAuthenticated,false);
assert.equal(agreed.settlementAuthorized,false);assert.equal(JSON.stringify(state),before);
const conflict=fixture();conflict.extensions.cpuTradeDecisions[0].decision='decline';
assert.equal(review(conflict,input).code,'cpu-policy-evidence-conflict');
assert.equal(review(conflict,input).decisionMatches,false);
const missing=fixture();delete missing.extensions.cpuTradeDecisions;
assert.equal(review(missing,input).code,'cpu-policy-advisory-only');
assert.equal(review(missing,input).evidenceStatus,'source-cpu-decision-ledger-required');
const stale=fixture();stale.extensions.cpuTradeDecisions[0].gameRevision=12;
assert.equal(review(stale,input).evidenceStatus,'stale-cpu-decision');
assert.equal(review(state,{...input,expectedGameRevision:12}).code,'stale-game-revision');
assert.equal(review(state,{...input,gmApproved:false}).code,'human-gm-approval-required');
console.log('M1549 CPU evidence bridge read-only, conflicts, missing evidence, stale and no-save passed');
