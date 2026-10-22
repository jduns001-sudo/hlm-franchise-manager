'use strict';
/* Mission 1454: isolated, default-disabled, fail-closed CPU consent authority.
 * This public browser application has no protected signing key, verifier root,
 * authoritative replay store or atomic settlement service. Do not mistake
 * a caller-supplied proof/verifier/flag for independent authentication.
 */
const {contract}=require('./hlm-phase11-trusted-consent-contract');
const schema='hlm-cpu-authority-v1';
function reject(code, expected) {
 return Object.freeze({status:'cpu-consent-blocked',code,
  proposalDigest:expected?.digest||null,independentlyAuthenticated:false,
  gmApproved:false,settlementAuthorized:false,atomicSettlementVerified:false,
  saved:false,experimental:true});
}
function assess(state,input,revision,decision,options) {
 if(options?.cancelled===true||options?.declined===true)return reject('gm-cancelled-or-declined');
 let expected;
 try{expected=contract(state,input,revision)}catch{return reject('invalid-proposal-or-revision')}
 if(options?.enabled!==true)return reject('experimental-authority-disabled',expected);
 if(!decision||typeof decision!=='object'||Array.isArray(decision)||
    Object.getPrototypeOf(decision)!==Object.prototype)return reject('invalid-decision',expected);
 if(decision.schema!==schema||typeof decision.decisionId!=='string'||
    !decision.decisionId||typeof decision.issuedAt!=='string'||
    !decision.issuedAt||typeof decision.expiresAt!=='string'||
    !decision.expiresAt)return reject('invalid-decision-identity',expected);
 if(decision.receivingTeamId!==expected.proposal.receivingTeamId||
    decision.proposalDigest!==expected.digest||
    decision.stateRevision!==expected.revision)return reject('mismatched-or-stale-decision',expected);
 if(decision.decision!=='accepted')return reject('cpu-declined',expected);
 const issued=Date.parse(decision.issuedAt),expires=Date.parse(decision.expiresAt);
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||expires<=issued)
  return reject('invalid-expiry',expected);
 // Caller clocks cannot prove freshness. This check only rejects objectively
 // invalid timestamps; it does not authenticate a decision.
 if(!decision.authorityProof||typeof decision.authorityProof!=='object')
  return reject('missing-authority-proof',expected);
 // No private trust root or atomic replay ledger is installed in this PWA.
 // Deliberately do not invoke caller-supplied verify(), has(), setItem(), etc.
 return reject('protected-cpu-trust-root-unavailable',expected);
}
module.exports={schema,assess};
