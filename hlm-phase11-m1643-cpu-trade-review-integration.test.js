'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {inspectCpuTradeReview:inspect}=require('./hlm-phase11-m1643-cpu-trade-review-integration');
const evidence={slot:'s',revision:'r1',proposalDigest:'digest',teamId:'BUF',decision:'accept',decisionId:'cpu1',issuer:'CPU-BUF',keyId:'key',signature:'ZmFrZQ==',issuedAt:90,expiresAt:110};
const base={experimentalEnabled:true,gmAction:'approve',humanGMApproved:true,slot:'s',revision:'r1',proposalDigest:'digest',teamId:'BUF',now:100,consumedDecisionIds:[],cpuEvidence:evidence};
function blocked(x,code,consentCode){const v=inspect(x);assert.equal(v.code,code);if(consentCode)assert.equal(v.consentCode,consentCode);assert.equal(v.saved,false);assert.equal(v.settlementAuthorized,false);assert.equal(v.productionTouched,false);return v}
test('default off, declined, cancelled and missing GM approval are no-save',()=>{
 blocked({...base,experimentalEnabled:false},'disabled-by-default');
 blocked({...base,gmAction:'decline'},'gm-declined-or-cancelled');
 blocked({...base,gmAction:'cancel'},'gm-declined-or-cancelled');
 blocked({...base,humanGMApproved:false},'gm-approval-required');
});
test('untrusted CPU decisions never authorize settlement',()=>{
 blocked(base,'cpu-consent-not-authenticated','trusted-cpu-key-unavailable');
 blocked({...base,cpuEvidence:{...evidence,synthetic:true}},'cpu-consent-not-authenticated','synthetic-evidence-not-authenticated');
 blocked({...base,cpuEvidence:{...evidence,decision:'decline'}},'cpu-consent-not-authenticated','cpu-declined');
 blocked({...base,cpuEvidence:{...evidence,revision:'stale'}},'cpu-consent-not-authenticated','cpu-evidence-binding-mismatch');
 blocked({...base,consumedDecisionIds:['cpu1']},'cpu-consent-not-authenticated','replayed-cpu-decision');
 blocked({...base,now:111},'cpu-consent-not-authenticated','stale-or-invalid-evidence');
 blocked({...base,cpuEvidence:{...evidence,authenticated:true},verifier:()=>true,publicKey:'fake'},'cpu-consent-not-authenticated','trusted-cpu-key-unavailable');
});
test('does not access database, browser storage or mutate game state',()=>{
 const forbidden=new Proxy({}, {get(){throw Error('unexpected storage access')}});
 const before=JSON.stringify(base);
 blocked({...base,db:forbidden,localStorage:forbidden,gameState:forbidden},'cpu-consent-not-authenticated');
 assert.equal(JSON.stringify(base),before);
});
