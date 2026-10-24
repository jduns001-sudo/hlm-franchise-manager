'use strict';
const assert=require('node:assert/strict');
const {decideCpuTrade:decide}=require('./hlm-phase11-m1555-engine-owned-cpu-decision');
function fixture(){return {meta:{revision:17,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:17};
function check(s,i,code,decision){const before=JSON.stringify(s),r=decide(s,i);assert.equal(r.code,code);if(decision)assert.equal(r.decision,decision);assert.equal(r.saved,false);assert.equal(r.consentAuthenticated,false);assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);return r}
const state=fixture(),accepted=check(state,input,'engine-cpu-policy-decision-only','accept');
assert.equal(accepted.decisionOrigin,'deterministic-engine-policy');assert.equal(accepted.receivingTeamId,'B');
assert.equal(check(state,{...input,cpuConsentApproved:true,cpuDecision:'decline',consentAuthenticated:true},'engine-cpu-policy-decision-only','accept').proposalId,accepted.proposalId);
state.extensions.cpuTradeConsentEvidence=[{decision:'decline',receivingTeamId:'B'}];check(state,input,'engine-cpu-policy-decision-only','accept');
const declined=fixture();declined.assets.contracts[0].aav=4;check(declined,input,'engine-cpu-policy-decision-only','decline');
check(fixture(),{...input,gmApproved:false},'human-gm-approval-required');
check(fixture(),{...input,expectedGameRevision:16},'stale-game-revision');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';check(restricted,input,'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;check(overcap,input,'salary-cap-exceeded');
const duplicate=fixture();duplicate.assets.contracts.push({...duplicate.assets.contracts[0]});check(duplicate,input,'missing-or-mismatched-active-contract');
console.log('M1555 deterministic engine CPU decision Node acceptance passed');
