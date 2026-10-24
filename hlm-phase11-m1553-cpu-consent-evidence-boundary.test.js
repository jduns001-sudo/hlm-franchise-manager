'use strict';
const assert=require('node:assert/strict');
const {inspectCpuConsentEvidence:inspect}=require('./hlm-phase11-m1553-cpu-consent-evidence-boundary');
function fixture(){return {meta:{revision:13,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeConsentEvidence:[{outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:13,decision:'accept'}]}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:13};
function check(state,changes,code){const before=JSON.stringify(state),r=inspect(state,{...input,...changes});assert.equal(r.code,code);assert.equal(r.ok,false);assert.equal(r.saved,false);assert.equal(r.consentAuthenticated,false);assert.equal(r.settlementAuthorized,false);assert.equal(JSON.stringify(state),before);}
check(fixture(),{},'cpu-consent-untrusted-source');
check(fixture(),{consentAuthenticated:true,cpuConsentApproved:true},'cpu-consent-untrusted-source');
check(fixture(),{gmApproved:false},'human-gm-approval-required');
check(fixture(),{expectedGameRevision:12},'stale-game-revision');
const missing=fixture();delete missing.extensions.cpuTradeConsentEvidence;check(missing,{},'source-cpu-consent-ledger-required');
const duplicate=fixture();duplicate.extensions.cpuTradeConsentEvidence.push({...duplicate.extensions.cpuTradeConsentEvidence[0]});check(duplicate,{},'unique-source-cpu-consent-required');
const stale=fixture();stale.extensions.cpuTradeConsentEvidence[0].gameRevision=12;check(stale,{},'stale-cpu-consent-evidence');
const declined=fixture();declined.extensions.cpuTradeConsentEvidence[0].decision='decline';check(declined,{},'cpu-consent-declined');
const invalid=fixture();invalid.extensions.cpuTradeConsentEvidence[0].decision='maybe';check(invalid,{},'invalid-cpu-consent-decision');
const mismatched=fixture();mismatched.extensions.cpuTradeConsentEvidence[0].receivingTeamId='C';check(mismatched,{},'unique-source-cpu-consent-required');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';check(restricted,{},'trade-restricted');
const overcap=fixture();overcap.finances.teamCapLimits.B=1;check(overcap,{},'salary-cap-exceeded');
console.log('M1553 CPU consent evidence fail-closed Node acceptance passed');
