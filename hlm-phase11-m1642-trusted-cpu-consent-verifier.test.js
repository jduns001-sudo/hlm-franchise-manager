'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifyTrustedCpuConsent:verify}=require('./hlm-phase11-m1642-trusted-cpu-consent-verifier');
const base={slot:'s',revision:'r2',proposalDigest:'d',teamId:'BUF',gmAction:'approve',humanGMApproved:true,now:100,consumedDecisionIds:[]};
const e={slot:'s',revision:'r2',proposalDigest:'d',teamId:'BUF',decision:'accept',decisionId:'one',issuer:'CPU-BUF',keyId:'key1',signature:'ZmFrZQ==',issuedAt:90,expiresAt:110};
function check(x,code){const v=verify(x);assert.equal(v.code,code);assert.equal(v.saved,false);assert.equal(v.settlementAuthorized,false);assert.equal(v.productionTouched,false);assert.equal(v.consentAuthenticated,false);assert.equal(v.ok,false)}
test('source-shaped evidence and caller-provided keys cannot establish trust',()=>{
 for(const x of [{...base,cpuEvidence:e},{...base,cpuEvidence:{...e,authenticated:true},publicKey:'attacker',verifier:()=>true}])
  check(x,'trusted-cpu-key-unavailable');
});
test('GM decline, CPU decline, fixture, mismatch and absent source fail closed',()=>{
 check({...base,cpuEvidence:e,gmAction:'cancel'},'gm-approval-required');
 check({...base,cpuEvidence:e,humanGMApproved:false},'gm-approval-required');
 check({...base,cpuEvidence:{...e,decision:'decline'}},'cpu-declined');
 check({...base,cpuEvidence:{...e,synthetic:true}},'synthetic-evidence-not-authenticated');
 check({...base,cpuEvidence:{...e,revision:'r1'}},'cpu-evidence-binding-mismatch');
 check(base,'cpu-evidence-missing');
});
test('replay, expiry, invalid signature fields and missing ledger fail closed',()=>{
 check({...base,cpuEvidence:e,consumedDecisionIds:['one']},'replayed-cpu-decision');
 check({...base,cpuEvidence:e,now:111},'stale-or-invalid-evidence');
 check({...base,cpuEvidence:{...e,signature:''}},'signed-source-evidence-required');
 check({...base,cpuEvidence:e,consumedDecisionIds:null},'replay-ledger-required');
});
test('does not read storage or mutate input',()=>{
 const forbidden=new Proxy({}, {get(){throw Error('storage accessed')}});
 const x={...base,cpuEvidence:e,db:forbidden,localStorage:forbidden};
 const before=JSON.stringify({...base,cpuEvidence:e});
 check(x,'trusted-cpu-key-unavailable');
 assert.equal(JSON.stringify({...base,cpuEvidence:e}),before);
});
