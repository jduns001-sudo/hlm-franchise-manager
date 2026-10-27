'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createIsolatedServerIdentityLab}=require('./hlm-phase11-block-a-isolated-server-identity-lab');
test('server-issued test GM and CPU proofs are bound to franchise revision and digest, but never authorize settlement',()=>{
 const lab=createIsolatedServerIdentityLab();
 const gm=lab.issueGmSession('lab-franchise','lab-gm');
 const cpu=lab.issueCpuDecision('lab-franchise','revision-1','lab-digest');
 const base={gm,cpu,franchiseId:'lab-franchise',revision:'revision-1',digest:'lab-digest',gmApproved:true,experimentalEnabled:true};
 const result=lab.inspect(base);
 assert.equal(result.labIdentityVerified,true);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(result.productionSaved,false);
 for(const request of [
  {...base,revision:'revision-2'},
  {...base,digest:'wrong'},
  {...base,franchiseId:'other'},
  {...base,gm:{...gm,proof:'0'.repeat(64)}},
  {...base,cpu:{...cpu,proof:'0'.repeat(64)}},
  {...base,gmApproved:false},
  {...base,cancelled:true},
  {...base,declined:true},
  {...base,experimentalEnabled:false}
 ]) {
  const rejected=lab.inspect(request);
  assert.equal(rejected.labIdentityVerified,false);
  assert.equal(rejected.saved,false);
 }
});
test('caller cannot inject identity callbacks or cross-instance authority',()=>{
 let called=0;const evil=()=>{called++;throw Error('untrusted callback')};
 const a=createIsolatedServerIdentityLab(),b=createIsolatedServerIdentityLab();
 const gm=a.issueGmSession('f','g'),cpu=a.issueCpuDecision('f','r','d');
 const result=b.inspect({gm,cpu,franchiseId:'f',revision:'r',digest:'d',gmApproved:true,experimentalEnabled:true,verify:evil,save:evil});
 assert.equal(result.labIdentityVerified,false);
 assert.equal(result.settlementAuthorized,false);
 assert.equal(called,0);
});
