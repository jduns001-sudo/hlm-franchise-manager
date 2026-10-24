'use strict';
const assert=require('node:assert/strict');
const {inspectCpuProposalBinding:inspect,deriveProposalId:derive}=require('./hlm-phase11-m1554-cpu-authorization-proposal-binding');
function fixture(){return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
const state=fixture(),identity=derive(state,input);assert.equal(identity.ok,true);
const record={proposalId:identity.proposalId,gameRevision:13,receivingTeamId:'B',decision:'accept'};
function check(s,i,r,code){const before=JSON.stringify(s),value=inspect(s,i,r);assert.equal(value.code,code);assert.equal(value.ok,false);assert.equal(value.saved,false);assert.equal(value.consentAuthenticated,false);assert.equal(value.settlementAuthorized,false);assert.equal(JSON.stringify(s),before);}
check(state,input,record,'independent-cpu-authorization-required');
check(state,{...input,cpuConsentApproved:true,consentAuthenticated:true},record,'independent-cpu-authorization-required');
check(state,{...input,gmApproved:false},record,'human-gm-approval-required');
check(state,{...input,expectedGameRevision:12},record,'stale-game-revision');
check(state,input,null,'authorization-record-required');
check(state,input,{...record,proposalId:'forged'},'proposal-binding-mismatch');
check(state,input,{...record,gameRevision:12},'stale-authorization-revision');
check(state,input,{...record,receivingTeamId:'A'},'receiving-team-binding-mismatch');
check(state,input,{...record,decision:'decline'},'cpu-policy-decision-conflict');
check(state,input,{...record,decision:'unknown'},'invalid-authorization-decision');
const changed=fixture();changed.meta.revision=14;check(changed,{...input,expectedGameRevision:14},record,'proposal-binding-mismatch');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';check(restricted,input,record,'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;check(overcap,input,record,'salary-cap-exceeded');
console.log('M1554 proposal binding Node acceptance passed');
