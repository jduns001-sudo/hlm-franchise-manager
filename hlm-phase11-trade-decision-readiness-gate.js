'use strict';
/* Mission 1452: read-only trade decision readiness. Never authenticates CPU authority,
 * grants GM approval, settles a trade, or writes game state. */
const {contract}=require('./hlm-phase11-trusted-consent-contract');
const {assess}=require('./hlm-phase11-cpu-consent-provenance');
function evaluate(state,input,revision,declaration,options){
 const deny=(code,reason,digest=null)=>Object.freeze({status:'trade-decision-blocked',code,reason,proposalDigest:digest,gmApproved:false,independentlyAuthenticated:false,settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true});
 if(options?.cancelled===true)return deny('cancelled','GM cancelled without saving');
 if(options?.declined===true)return deny('declined','GM declined without saving');
 let expected;
 try{expected=contract(state,input,revision)}catch{return deny('invalid-proposal','Invalid proposal or revision')}
 // A caller's gmApproved flag is never proof of GM authority. No trusted
 // approval transaction is available at this read-only boundary.
 if(options?.gmApproved!==true)return deny('gm-approval-missing','GM approval is missing',expected.digest);
 const cpu=assess(state,input,revision,declaration,options);
 if(cpu.reason==='Stale or mismatched proposal')return deny('stale-proposal',cpu.reason,expected.digest);
 if(cpu.reason==='Receiving team has not accepted')return deny('cpu-rejected',cpu.reason,expected.digest);
 if(cpu.reason==='GM cancelled or declined')return deny('declined',cpu.reason,expected.digest);
 if(cpu.reason==='Malformed declaration'||cpu.reason?.startsWith('Missing provenance field:')||cpu.reason==='Invalid provenance identity'||cpu.reason==='Missing independent authority proof')
  return deny('cpu-evidence-invalid',cpu.reason,expected.digest);
 // Even if supplied GM flag and self-declared CPU consent both look positive,
 // there is no authenticated GM authorization or independent CPU trust root.
 return deny('cpu-authority-unverified','No independently authenticated CPU authority or GM approval integration',expected.digest);
}
module.exports={evaluate};
