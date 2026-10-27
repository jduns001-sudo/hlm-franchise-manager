'use strict';
// Mission 1641: a fail-closed boundary. No authentication service exists.
// This module cannot authorize settlement or persist data.
const deny=(code,classification)=>Object.freeze({
 ok:false,code,classification,saved:false,consentAuthenticated:false,
 settlementAuthorized:false,productionTouched:false,experimental:true
});
function classifyCpuEvidence(evidence){
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))return 'unverified';
 if(evidence.localTestFixture===true||evidence.cpuFixtureEvidence||
    evidence.cpuFixtureDecision!==undefined||evidence.synthetic===true||
    evidence.classification==='synthetic-fixture'||evidence.source==='fixture')
   return 'synthetic-fixture';
 return 'unverified';
}
function inspectAuthenticatedCpuConsent(request={}){
 const classification=classifyCpuEvidence(request.cpuEvidence);
 if(request.gmAction!=='approve'||request.humanGMApproved!==true)
   return deny('gm-approval-required',classification);
 if(classification==='synthetic-fixture')
   return deny('synthetic-evidence-not-authenticated',classification);
 if(!request.cpuEvidence||typeof request.cpuEvidence!=='object')
   return deny('cpu-evidence-missing',classification);
 if(request.cpuEvidence.decision==='decline')
   return deny('cpu-declined',classification);
 if(![request.slot,request.revision,request.proposalDigest,request.teamId]
   .every(x=>typeof x==='string'&&x.length>0))
   return deny('invalid-binding',classification);
 if(['slot','revision','proposalDigest','teamId'].some(k=>request.cpuEvidence[k]!==request[k]))
   return deny('cpu-evidence-binding-mismatch',classification);
 // Even perfectly matching digests and caller-provided authenticated flags
 // are not identity proof. A future trusted verifier must be designed separately.
 return deny('trusted-cpu-verifier-unavailable',classification);
}
module.exports=Object.freeze({classifyCpuEvidence,inspectAuthenticatedCpuConsent});
