'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectAuthenticatedCpuConsent:inspect,classifyCpuEvidence:classify}=require('./hlm-phase11-m1641-cpu-consent-boundary');
const binding={slot:'local-slot',revision:'r2',proposalDigest:'digest',teamId:'BUF',gmAction:'approve',humanGMApproved:true};
const evidence={slot:'local-slot',revision:'r2',proposalDigest:'digest',teamId:'BUF',decision:'accept'};
test('missing and synthetic CPU evidence fail closed',()=>{
 assert.equal(inspect(binding).code,'cpu-evidence-missing');
 for(const x of [{...evidence,synthetic:true},{...evidence,cpuFixtureDecision:'accept'},{...evidence,classification:'synthetic-fixture'}]){
  assert.equal(classify(x),'synthetic-fixture');
  assert.equal(inspect({...binding,cpuEvidence:x}).code,'synthetic-evidence-not-authenticated');
 }
});
test('untrusted assertions and digest equality never authenticate',()=>{
 for(const x of [{...evidence,authenticated:true},{...evidence,consentAuthenticated:true},{...evidence,signature:'unverified'}]){
  const result=inspect({...binding,cpuEvidence:x});
  assert.equal(result.code,'trusted-cpu-verifier-unavailable');
  assert.equal(result.consentAuthenticated,false);
  assert.equal(result.settlementAuthorized,false);
  assert.equal(result.saved,false);
 }
});
test('decline, stale binding, GM cancellation and missing binding are no-save',()=>{
 const cases=[
  {...binding,gmAction:'decline',cpuEvidence:evidence},
  {...binding,gmAction:'cancel',cpuEvidence:evidence},
  {...binding,humanGMApproved:false,cpuEvidence:evidence},
  {...binding,cpuEvidence:{...evidence,decision:'decline'}},
  {...binding,cpuEvidence:{...evidence,revision:'r1'}},
  {...binding,cpuEvidence:{...evidence,proposalDigest:'old'}},
  {...binding,proposalDigest:'',cpuEvidence:evidence}
 ];
 for(const x of cases){const result=inspect(x);assert.equal(result.saved,false);assert.equal(result.productionTouched,false);assert.equal(result.settlementAuthorized,false);}
});
test('boundary is pure and does not touch D1, replay ledger or production storage',()=>{
 const forbidden=new Proxy({}, {get(){throw Error('must not touch state or storage')}});
 const result=inspect({...binding,cpuEvidence:{...evidence,authenticated:true},db:forbidden,localStorage:forbidden});
 assert.equal(result.ok,false);
 assert.equal(result.saved,false);
});
