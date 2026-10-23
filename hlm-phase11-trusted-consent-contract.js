'use strict';
/* Mission 1450: read-only, fail-closed receiving-team consent.
 * No trusted CPU signing key or authoritative replay store exists in this module.
 * Caller-supplied verifier/flags cannot grant authentication. */
const crypto=require('node:crypto');
const {canonicalRequest}=require('./hlm-phase11-receiving-authority-boundary');
const schema='hlm-receiving-consent-v1';
function nonempty(x){return typeof x==='string'&&x.length>0&&x.length<=256}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}
function contract(state,input,revision){
 if(!nonempty(revision))throw Error('Trusted state revision required');
 const request=canonicalRequest(state,input);
 const proposal=Object.freeze({...request});
 return Object.freeze({schema,revision,proposal,digest:digest({schema,revision,proposal})});
}
function check(state,input,revision,receipt,authority,spent,options){
 const blocked=reason=>Object.freeze({status:'consent-blocked',reason,independentlyAuthenticated:false,settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true});
 if(options&&options.cancelled===true)return blocked('Cancelled without saving');
 let expected;
 try{expected=contract(state,input,revision)}catch{return blocked('Invalid proposal or revision')}
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||Object.getPrototypeOf(receipt)!==Object.prototype)return blocked('Malformed receipt');
 if(!nonempty(receipt.nonce)||!nonempty(receipt.revision)||!nonempty(receipt.digest)||!nonempty(receipt.receivingTeamId))return blocked('Malformed receipt');
 if(receipt.revision!==expected.revision||receipt.digest!==expected.digest||receipt.receivingTeamId!==expected.proposal.receivingTeamId)return blocked('Mismatched or stale receipt');
 if(!spent||typeof spent.has!=='function')return blocked('Authoritative replay ledger unavailable');
 try{if(spent.has(receipt.nonce)!==false)return blocked('Replayed or unverified nonce')}catch{return blocked('Replay ledger failed closed')}
 // A supplied verifier, receipt signature, trustedIntegration flag or ledger can
 // all be forged by a caller. No pinned external CPU trust root is available.
 // Therefore never invoke a caller's verifier or grant authenticated status.
 return blocked('Independent CPU signing authority not configured; preview only');
}
module.exports={contract,check};
