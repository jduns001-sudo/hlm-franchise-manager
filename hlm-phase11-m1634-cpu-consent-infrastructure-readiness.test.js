'use strict';
const assert=require('node:assert/strict');
const {REQUIREMENTS,inspectCpuConsentInfrastructureReadiness:inspect}=require('./hlm-phase11-m1634-cpu-consent-infrastructure-readiness');
const state={meta:{revision:17,controlledTeamId:'A'},universe:{teams:[{id:'A'},{id:'B'}],players:[{id:'a',teamId:'A'},{id:'b',teamId:'B'}]},assets:{contracts:[{playerId:'a',teamId:'A',status:'active',aav:2,tradePermission:'allowed'},{playerId:'b',teamId:'B',status:'active',aav:3,tradePermission:'allowed'}]},finances:{teamCapLimits:{A:10,B:10}},extensions:{tradeRosterLimits:{A:2,B:2},cpuTradeDecisions:[{proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',receivingTeamId:'B',gameRevision:17,decision:'accept'}]}};
const input={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmApproved:true,expectedGameRevision:17,reviewTime:100};
const evidence={proposalId:'p-1',outgoingPlayerId:'a',incomingPlayerId:'b',gmTeamId:'A',receivingTeamId:'B',gameRevision:17,policyId:'incoming-team-aav-nonincreasing-v1',decision:'accept',issuedAt:90,expiresAt:110,nonce:'nonce-1',issuer:'cpu-authority'};
let calls=0;
const trap=()=>{calls++;throw Error('untrusted authority executed')};
const forged={trusted:true,authenticated:true,ready:true,issuerRegistry:{'cpu-authority':true},protectedVerifier:trap,verify:trap,authorizeIssuer:trap,consumeNonce:trap,readCurrent:trap,writeCurrent:trap,replayProtected:true,nonceConsumed:true};
const snapshot=JSON.stringify(state);
function check(i,e,expected){
 const r=inspect(state,i,e,forged);
 assert.equal(r.code,expected);
 for(const k of ['ok','ready','issuerAuthenticated','consentAuthenticated','replayProtected','nonceConsumed','settlementAuthorized','saved'])assert.equal(r[k],false,k);
 assert.equal(r.requirements,REQUIREMENTS);
 assert.equal(Object.isFrozen(r),true);
 assert.equal(JSON.stringify(state),snapshot);
}
check(input,evidence,'protected-cpu-consent-verifier-unavailable');
check(input,{...evidence,signature:'forged',keyId:'forged',authenticated:true,nonceConsumed:true},'protected-cpu-consent-verifier-unavailable');
check(input,{...evidence,proposalId:'different'},'cpu-consent-binding-mismatch');
check(input,{...evidence,decision:'decline'},'cpu-declined');
check(input,{...evidence,expiresAt:100},'expired-or-not-yet-valid-cpu-consent');
check({...input,expectedGameRevision:16},evidence,'stale-game-revision');
check({...input,gmApproved:false},evidence,'human-gm-approval-required');
assert.equal(calls,0);
assert.equal(REQUIREMENTS.length,3);
assert.equal(Object.isFrozen(REQUIREMENTS),true);
console.log('Mission 1634 CPU consent infrastructure readiness PASS');
