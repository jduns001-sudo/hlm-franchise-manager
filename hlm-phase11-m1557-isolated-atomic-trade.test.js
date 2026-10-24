'use strict';
const assert=require('node:assert/strict');
const {prepareIsolatedAtomicTrade:prepare}=require('./hlm-phase11-m1557-isolated-atomic-trade');
function fixture(){return {meta:{revision:19,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2}}}}
const input={outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:19};
function check(s,i,expected){const before=JSON.stringify(s);const r=prepare(s,i);assert.equal(r.code,expected);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);assert.equal(r.consentAuthenticated,false);assert.equal(JSON.stringify(s),before);assert.equal('candidate' in r,false);return r}
const ok=check(fixture(),input,'isolated-atomic-candidate-validated');assert.equal(ok.playerTransfers,2);assert.equal(ok.contractTransfers,2);assert.equal(ok.proposedRevision,20);
check(fixture(),{...input,gmApproved:false},'human-gm-approval-required');
check(fixture(),{...input,expectedGameRevision:18},'stale-game-revision');
const decline=fixture();decline.assets.contracts[0].aav=4;check(decline,input,'cpu-policy-declined');
const restricted=fixture();restricted.assets.contracts[0].tradePermission='denied';check(restricted,input,'trade-restricted');
const cap=fixture();cap.finances.teamCapLimits.B=1;check(cap,input,'salary-cap-exceeded');
const dup=fixture();dup.assets.contracts.push({...dup.assets.contracts[0]});check(dup,input,'missing-or-mismatched-active-contract');
const overflow=fixture();overflow.meta.revision=Number.MAX_SAFE_INTEGER;check(overflow,{...input,expectedGameRevision:Number.MAX_SAFE_INTEGER},'revision-overflow');
const spoof=fixture();spoof.extensions.cpuTradeConsentEvidence=[{decision:'accept'}];check(spoof,{...input,consentAuthenticated:true,cpuDecision:'accept'},'isolated-atomic-candidate-validated');
console.log('M1557 isolated atomic candidate Node safety passed');
