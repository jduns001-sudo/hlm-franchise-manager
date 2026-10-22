'use strict';
/* Mission 1450: isolated, read-only receiving consent contract.
 * A signed receipt is not authentication until a separately audited verifier exists.
 * No production integration, settlement, storage or authority is provided here. */
const crypto=require('node:crypto');
const {canonicalRequest}=require('./hlm-phase11-receiving-authority-boundary');
function plainObject(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype}
function nonempty(x){return typeof x==='string'&&x.length>0&&x.length<=256}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}
function contract(state,input,revision){
 const request=canonicalRequest(state,input);
 if(!nonempty(revision))throw Error('Trusted state revision required');
 const proposal=Object.freeze({...request});
 return Object.freeze({schema:'hlm-receiving-consent-v1',revision,proposal,digest:digest({schema:'hlm-receiving-consent-v1',revision,proposal})});
}
function check(state,input,revision,receipt,authority,spent){
 const blocked=reason=>Object.freeze({status:'consent-blocked',reason,independentlyAuthenticated:false,settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true});
 let expected;
 try{expected=contract(state,input,revision)}catch{return blocked('Invalid proposal or revision')}
 if(!plainObject(receipt)||!nonempty(receipt.nonce)||!nonempty(receipt.revision)||!nonempty(receipt.digest)||!nonempty(receipt.receivingTeamId))return blocked('Malformed receipt');
 if(receipt.revision!==expected.revision||receipt.digest!==expected.digest||receipt.receivingTeamId!==expected.proposal.receivingTeamId)return blocked('Mismatched or stale receipt');
 if(!spent||typeof spent.has!=='function')return blocked('Trusted replay ledger unavailable');
 try{if(spent.has(receipt.nonce))return blocked('Replayed receipt')}catch{return blocked('Replay ledger failed closed')}
 if(!authority||typeof authority.verify!=='function'||authority.trustedIntegration!==true)return blocked('Trusted authority unavailable');
 let accepted=false;
 try{accepted=authority.verify(expected,Object.freeze({...receipt}))===true}catch{return blocked('Verifier error')}
 if(!accepted)return blocked('Unverified receipt');
 // Read-only: never consume nonce, write saves or imply settlement authority.
 return Object.freeze({status:'verified-preview-only',independentlyAuthenticated:true,settlementAuthorized:false,atomicSettlementVerified:false,saved:false,experimental:true,reason:'Verification preview only; trusted integration and atomic settlement not wired'});
}
module.exports={contract,check};
