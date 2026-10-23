'use strict';
/* Mission 1455: fail-closed protected authority interface.
 * Public browser code cannot hold a trust root or authoritative replay store.
 * No caller-supplied verifier, proof, flag, or storage adapter is trusted.
 * This module never writes, authenticates or settles a trade.
 */
const schema='hlm-protected-cpu-trust-v1';
function blocked(code) {
 return Object.freeze({schema,status:'cpu-trust-blocked',code,
  independentlyAuthenticated:false,replayProtected:false,
  gmApproved:false,settlementAuthorized:false,saved:false,experimental:true});
}
function assess(request,options) {
 if(options?.cancelled===true||options?.declined===true)return blocked('gm-cancelled-or-declined');
 if(options?.enabled!==true)return blocked('protected-cpu-trust-disabled');
 if(!request||typeof request!=='object'||Array.isArray(request)||
    Object.getPrototypeOf(request)!==Object.prototype)return blocked('invalid-request');
 for(const field of ['decisionId','receivingTeamId','proposalDigest','stateRevision','issuedAt','expiresAt']){
  if(typeof request[field]!=='string'||!request[field].trim())return blocked('invalid-request-identity');
 }
 if(request.decision!=='accepted')return blocked('cpu-not-accepted');
 const issued=Date.parse(request.issuedAt),expires=Date.parse(request.expiresAt);
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||expires<=issued)
  return blocked('invalid-expiry');
 // No protected service or durable replay ledger is configured. Never call
 // untrusted request.verify, options.verifier or options.replayStore.
 return blocked('protected-service-and-replay-ledger-unavailable');
}
module.exports={schema,assess};
