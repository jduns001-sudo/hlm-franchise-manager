'use strict';
/* Mission 1507P: immutable proposal identity and authority readiness, read-only.
 * A digest binds the exact source state revision and canonical trade proposal.
 * It does NOT authenticate a CPU or GM, establish a trusted replay ledger,
 * or authorize settlement. No user-provided verifier is accepted.
 */
const crypto=require('node:crypto');
function makeIdentity(state,input,revision){
 if(typeof revision!=='string'||!revision||revision.length>256)throw Error('Revision required');
 if(!state||!input||!state.meta||!state.universe)throw Error('Source required');
 const proposal=Object.freeze({controlledTeamId:String(state.meta.controlledTeamId),
  outgoingPlayerId:String(input.outgoingPlayerId),incomingPlayerId:String(input.incomingPlayerId)});
 const digest=crypto.createHash('sha256').update(JSON.stringify({schema:'hlm-m1507p-preview-v1',revision,proposal,source:state})).digest('hex');
 return Object.freeze({revision,digest,proposal});
}
const {review}=require('./hlm-phase11-m1507o-cpu-decision-foundation');
function assess(state,input,revision,receipt,options){
 const deny=(code,identity=null,cpu=null)=>Object.freeze({
  status:'trade-authority-not-ready',code,
  proposalDigest:identity?.digest||null,stateRevision:identity?.revision||null,
  cpuRecommendation:cpu?.receivingTeamRecommendation||null,
  independentlyAuthenticated:false,gmApproved:false,
  replayProtected:false,settlementAuthorized:false,atomicSettlementVerified:false,
  saved:false,experimental:true
 });
 if(options?.cancelled===true||options?.declined===true)return deny('gm-declined-or-cancelled');
 let identity;
 try{identity=makeIdentity(state,input,revision)}catch{return deny('invalid-source-or-revision')}
 const cpu=review(state,input);
 if(cpu.status==='cpu-review-blocked')return deny('cpu-source-review-blocked',identity,cpu);
 if(cpu.receivingTeamRecommendation!=='accept')return deny('cpu-recommends-decline',identity,cpu);
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))
  return deny('independent-cpu-proof-missing',identity,cpu);
 if(receipt.proposalDigest!==identity.digest||receipt.stateRevision!==identity.revision)
  return deny('stale-or-mismatched-proof',identity,cpu);
 // A matching digest or nonce is not a trusted signature or a replay ledger.
 // Neither caller-supplied "trusted" flags nor consent declarations grant authority.
 return deny('trusted-cpu-authority-and-replay-ledger-unavailable',identity,cpu);
}
module.exports={assess,identity:makeIdentity};
