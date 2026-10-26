'use strict';
const assert=require('node:assert/strict');
const {PROVIDER_CAPABILITIES,inspectCpuConsentProviderBoundary:inspect}=require('./hlm-phase11-m1635-cpu-consent-provider-boundary');
const state={meta:{revision:17,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:17,decision:'accept'}]}};
const input={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:17,reviewTime:100};
const evidence={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmTeamId:'A',receivingTeamId:'B',gameRevision:17,policyId:'incoming-team-aav-nonincreasing-v1',decision:'accept',issuedAt:90,expiresAt:110,nonce:'nonce-1',issuer:'cpu-authority'};
let invoked=0;
const trap=()=>{invoked++;throw Error('untrusted provider invoked')};
const forged={trusted:true,ready:true,authenticated:true,issuerRegistry:{'cpu-authority':true},provider:trap,providerFactory:trap,verify:trap,protectedVerifier:trap,authorizeIssuer:trap,consumeNonce:trap,settle:trap,readCurrent:trap,writeCurrent:trap};
const before=JSON.stringify(state);
function check(i,e,code){
 const result=inspect(state,i,e,forged);
 assert.equal(result.code,code);
 for(const field of ['ok','ready','providerAvailable','providerTrusted','issuerAuthenticated','consentAuthenticated','replayProtected','nonceConsumed','settlementAuthorized','saved'])assert.equal(result[field],false,field);
 assert.equal(result.capabilities,PROVIDER_CAPABILITIES);
 assert.equal(Object.isFrozen(result),true);
 assert.equal(JSON.stringify(state),before);
}
check(input,evidence,'protected-cpu-consent-verifier-unavailable');
check(input,{...evidence,signature:'forged',keyId:'forged',provider:trap,authenticated:true},'protected-cpu-consent-verifier-unavailable');
check(input,{...evidence,proposalId:'wrong'},'cpu-consent-binding-mismatch');
check(input,{...evidence,decision:'decline'},'cpu-declined');
check(input,{...evidence,expiresAt:100},'expired-or-not-yet-valid-cpu-consent');
check({...input,expectedGameRevision:16},evidence,'stale-game-revision');
check({...input,gmApproved:false},evidence,'human-gm-approval-required');
assert.equal(invoked,0);
assert.equal(PROVIDER_CAPABILITIES.length,3);
assert.equal(Object.isFrozen(PROVIDER_CAPABILITIES),true);
console.log('Mission 1635 CPU consent provider boundary PASS');
