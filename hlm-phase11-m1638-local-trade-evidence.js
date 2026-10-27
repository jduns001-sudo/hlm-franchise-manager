'use strict';
// Mission 1638: LOCAL TEST FIXTURE ONLY. Digest equality is not authentication.
const {createHash}=require('node:crypto');
const {createIsolatedCPUTradeCandidate}=require('./hlm-phase9-cpu-isolated-trade-candidate');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const local=require('./hlm-phase11-m1637-local-atomic-trade');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,productionTouched:false,experimental:true});
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function digest({slot,revision,teamId,input,source,candidate}){
 return createHash('sha256').update(canonical({version:'m1638-local-v1',slot,revision,teamId,input,source,candidate})).digest('hex');
}
async function review(db,{slot,expectedRevision,teamId,input}){
 if(![slot,expectedRevision,teamId].every(v=>typeof v==='string'&&v.length>0)||!input||typeof input!=='object')return deny('invalid-review');
 try{
  const prior=await local.read(db,slot);
  if(!prior||prior.revision!==expectedRevision)return deny('stale-review');
  const candidate=createIsolatedCPUTradeCandidate(prior.state,teamId,input).candidateState;
  if(!validateGameStateEnvelope(candidate).valid)return deny('invalid-candidate');
  return Object.freeze({ok:true,proposalDigest:digest({slot,revision:expectedRevision,teamId,input,source:prior.state,candidate}),slot,revision:expectedRevision,teamId,experimental:true,settlementAuthorized:false});
 }catch{return deny('invalid-review-candidate')}
}
async function settle(db,request){
 if(request?.localTestFixture!==true)return deny('local-test-only');
 if(request.gmAction!=='approve')return deny('gm-cancelled-or-declined');
 if(request.cpuFixtureDecision!=='accept')return deny('cpu-declined-or-unverified');
 if(request.input?.humanGMApproved!==true)return deny('gm-approval-required');
 const {slot,expectedRevision,teamId,input,decisionId,proposalDigest,gmReview,cpuFixtureEvidence}=request;
 if(![slot,expectedRevision,teamId,decisionId,proposalDigest].every(v=>typeof v==='string'&&v.length>0))return deny('invalid-request');
 const current=await review(db,{slot,expectedRevision,teamId,input});
 if(!current.ok)return deny(current.code);
 const binding={proposalDigest:current.proposalDigest,slot,revision:expectedRevision,teamId};
 if(proposalDigest!==current.proposalDigest)return deny('proposal-digest-mismatch');
 if(!gmReview||gmReview.approved!==true||Object.keys(binding).some(k=>gmReview[k]!==binding[k]))return deny('gm-review-mismatch');
 if(!cpuFixtureEvidence||cpuFixtureEvidence.decisionId!==decisionId||cpuFixtureEvidence.decision!=='accept'||Object.keys(binding).some(k=>cpuFixtureEvidence[k]!==binding[k]))return deny('cpu-fixture-evidence-mismatch');
 // D1 reloads authoritative state and recomputes candidate inside the existing
 // atomic CAS settlement. This remains a local fixture, not real CPU consent.
 return local.settle(db,request);
}
module.exports=Object.freeze({canonical,digest,review,settle});
