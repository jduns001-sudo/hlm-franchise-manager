'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectCpuSourceAndTradeReview}=require('./hlm-phase11-m1646-cpu-source-review-acceptance');
const evidence={slot:'s',revision:'r',proposalDigest:'digest',teamId:'BUF',decision:'accept',decisionId:'id',issuer:'fake',keyId:'fake',signature:'fake',issuedAt:10,expiresAt:20};
const base={experimentalEnabled:true,gmAction:'approve',humanGMApproved:true,slot:'s',revision:'r',proposalDigest:'digest',teamId:'BUF',now:15,consumedDecisionIds:[],cpuEvidence:evidence};
const check=x=>{const r=inspectCpuSourceAndTradeReview(x);assert.equal(r.ok,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);assert.equal(r.productionTouched,false);assert.equal(r.experimental,true);return r;};
test('both source and review reject forged caller trust',()=>{
 const r=check({...base,authenticated:true,publicKey:'forged',verifier:()=>true,cpuEvidence:{...evidence,authenticated:true}});
 assert.equal(r.sourceCode,'trusted-cpu-source-unavailable');
 assert.equal(r.reviewCode,'trusted-cpu-key-unavailable');
});
test('GM cancellation, decline, missing approval and default off are no-save',()=>{
 for(const change of [{gmAction:'cancel'},{gmAction:'decline'},{humanGMApproved:false},{experimentalEnabled:false}])check({...base,...change});
});
test('source and review independently reject synthetic, stale, replay and mismatch',()=>{
 for(const change of [{cpuEvidence:{...evidence,synthetic:true}},{cpuEvidence:{...evidence,source:'fixture'}},{cpuEvidence:{...evidence,decision:'decline'}},{cpuEvidence:{...evidence,revision:'old'}},{consumedDecisionIds:['id']},{now:20}])check({...base,...change});
});
test('invalid and absent evidence cannot settle',()=>{check(null);check({});check({...base,cpuEvidence:null});});
