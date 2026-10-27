'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectTrustedCpuSource}=require('./hlm-phase11-m1645-trusted-cpu-source-boundary');
const evidence={slot:'s',revision:'r',proposalDigest:'d',teamId:'BUF',decision:'accept',decisionId:'id',issuer:'CPU-BUF',issuedAt:10,expiresAt:20,signature:'fake'};
const base={experimentalEnabled:true,gmAction:'approve',humanGMApproved:true,slot:'s',revision:'r',proposalDigest:'d',teamId:'BUF',now:15,consumedDecisionIds:[],cpuEvidence:evidence};
function reject(v){const r=inspectTrustedCpuSource(v);assert.equal(r.ok,false);assert.equal(r.sourceAuthenticated,false);assert.equal(r.saved,false);assert.equal(r.settlementAuthorized,false);assert.equal(r.productionTouched,false);return r;}
test('unprovisioned source fails closed despite forged trust flags and callbacks',()=>{
 assert.equal(reject({...base,authenticated:true,publicKey:'attacker',verifier:()=>true,cpuEvidence:{...evidence,authenticated:true}}).code,'trusted-cpu-source-unavailable');
});
test('GM, disabled, synthetic, declined, binding, replay and expiry cases are no-save',()=>{
 for(const change of [
 {experimentalEnabled:false},{gmAction:'cancel'},{gmAction:'decline'},{humanGMApproved:false},
 {cpuEvidence:{...evidence,synthetic:true}},{cpuEvidence:{...evidence,decision:'decline'}},
 {cpuEvidence:{...evidence,revision:'old'}},{consumedDecisionIds:['id']},{now:20},
 {cpuEvidence:{...evidence,source:'fixture'}},{cpuEvidence:{...evidence,localTestFixture:true}}
 ])reject({...base,...change});
});
test('invalid request and missing evidence never authorize settlement',()=>{
 reject(null);reject({});reject({...base,cpuEvidence:null});reject({...base,consumedDecisionIds:null});
});
