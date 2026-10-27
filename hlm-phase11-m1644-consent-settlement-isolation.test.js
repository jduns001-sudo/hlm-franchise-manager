'use strict';
// Mission 1644: read-only integration acceptance. No D1 fixture writes, trusted keys or production wiring.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectCpuTradeReview}=require('./hlm-phase11-m1643-cpu-trade-review-integration');
const {inspectAuthenticatedCpuConsent}=require('./hlm-phase11-m1641-cpu-consent-boundary');
const {verifyTrustedCpuConsent}=require('./hlm-phase11-m1642-trusted-cpu-consent-verifier');
const {createContinuityHandler}=require('./hlm-phase11-m1640-d1-continuity');
const cpu={slot:'slot1',revision:'r1',proposalDigest:'digest1',teamId:'BUF',decision:'accept',decisionId:'d1',issuer:'CPU-BUF',keyId:'untrusted',signature:'ZmFrZQ==',issuedAt:100,expiresAt:200};
const input={slot:'slot1',revision:'r1',proposalDigest:'digest1',teamId:'BUF',now:150,consumedDecisionIds:[],cpuEvidence:cpu,gmAction:'approve',humanGMApproved:true,experimentalEnabled:true};
function noSave(result){assert.equal(result.saved,false);assert.equal(result.settlementAuthorized,false);assert.equal(result.productionTouched,false)}
test('every consent boundary rejects caller-provided trust claims',()=>{
 const malicious={...input,authenticated:true,publicKey:'attacker',verifier:()=>true,cpuEvidence:{...cpu,authenticated:true}};
 noSave(inspectAuthenticatedCpuConsent(malicious));
 noSave(verifyTrustedCpuConsent(malicious));
 const result=inspectCpuTradeReview(malicious);
 noSave(result);
 assert.equal(result.consentCode,'trusted-cpu-key-unavailable');
});
test('GM cancellation, declined CPU, stale, replay and synthetic evidence remain no-save',()=>{
 for(const changed of [
  {gmAction:'cancel'},{gmAction:'decline'},{humanGMApproved:false},
  {experimentalEnabled:false},{cpuEvidence:{...cpu,decision:'decline'}},
  {cpuEvidence:{...cpu,revision:'r0'}},{consumedDecisionIds:['d1']},
  {now:201},{cpuEvidence:{...cpu,localTestFixture:true}}
 ]){
  noSave(inspectCpuTradeReview({...input,...changed}));
 }
});
test('isolated D1 continuity fixture is default-off and cannot substitute for CPU authentication',async()=>{
 let accesses=0;
 const db={prepare(){accesses++;throw Error('D1 must not be accessed')}};
 const fixture={slot:'slot1'};
 const handle=createContinuityHandler({db,fixture});
 const response=await handle({method:'POST',path:'/decision',body:{action:'approve'}});
 assert.equal(response.body.saved,false);
 assert.equal(response.body.code,'disabled-by-default');
 assert.equal(accesses,0);
 noSave(inspectCpuTradeReview({...input,cpuEvidence:{...cpu,localTestFixture:true}}));
});
