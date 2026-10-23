'use strict';
/* Mission 1451: CPU receiving-team consent provenance, read-only.
 * The engine currently has no authenticated CPU decision authority or trusted key store.
 * A provenance declaration is not proof of origin. All decisions remain untrusted. */
const {contract}=require('./hlm-phase11-trusted-consent-contract');
const REQUIRED=Object.freeze(['schema','decisionId','receivingTeamId','proposalDigest','stateRevision','decision','issuedBy','issuedAt','authorityProof']);
function string(x){return typeof x==='string'&&x.length>0&&x.length<=256}
function assess(state,input,revision,declaration,options){
 const deny=(reason,expected)=>Object.freeze({status:'cpu-authority-unverified',reason,proposalDigest:expected?.digest||null,independentlyAuthenticated:false,gmApproved:false,settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true});
 if(options?.cancelled===true||options?.declined===true)return deny('GM cancelled or declined');
 let expected;try{expected=contract(state,input,revision)}catch{return deny('Invalid trade or revision')}
 if(!declaration||typeof declaration!=='object'||Array.isArray(declaration)||Object.getPrototypeOf(declaration)!==Object.prototype)return deny('Malformed declaration',expected);
 for(const key of REQUIRED)if(!Object.hasOwn(declaration,key))return deny('Missing provenance field: '+key,expected);
 if(declaration.schema!=='hlm-cpu-decision-v1'||!string(declaration.decisionId)||!string(declaration.issuedBy)||!string(declaration.issuedAt))return deny('Invalid provenance identity',expected);
 if(declaration.receivingTeamId!==expected.proposal.receivingTeamId||declaration.proposalDigest!==expected.digest||declaration.stateRevision!==expected.revision)return deny('Stale or mismatched proposal',expected);
 if(declaration.decision!=='accepted')return deny('Receiving team has not accepted',expected);
 if(!declaration.authorityProof||typeof declaration.authorityProof!=='object')return deny('Missing independent authority proof',expected);
 // A self-declared issuer, proof, verifier or trusted flag is forgeable.
 // Do not call supplied callbacks, mutate state or authorize settlement.
 return deny('No independently authenticated CPU authority integration',expected);
}
module.exports={REQUIRED,assess};
