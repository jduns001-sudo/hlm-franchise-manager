'use strict';
/* Mission 1518: deterministic provenance-bound CPU decision evidence.
 * Evidence can verify a local decision record, but does not authenticate
 * organizational consent or authorize real settlement.
 */
const crypto=require('node:crypto');
const {evaluate}=require('./hlm-phase11-m1513-cpu-trade-decision');
const stable=x=>JSON.stringify(x);
function evidence(state,input,options={}){
 const deny=code=>({ok:false,code,authenticatedCpuConsent:false,saved:false,settlementAuthorized:false});
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 const advisory=evaluate(state,input,options);
 if(!advisory.ok)return deny(advisory.code);
 const payload={version:1,gameRevision:advisory.gameRevision,
  controlledTeamId:advisory.controlledTeamId,otherTeamId:advisory.otherTeamId,
  outgoingPlayerId:advisory.outgoingPlayerId,incomingPlayerId:advisory.incomingPlayerId,
  decision:advisory.decision,policy:advisory.policy};
 const digest=crypto.createHash('sha256').update(stable(payload)).digest('hex');
 return {ok:true,code:'decision-provenance-only',payload,digest,
  authenticatedCpuConsent:false,saved:false,settlementAuthorized:false};
}
function verify(state,input,record,options={}){
 const deny=code=>({valid:false,code,authenticatedCpuConsent:false,saved:false,settlementAuthorized:false});
 if(!record||typeof record!=='object'||typeof record.digest!=='string')return deny('missing-evidence');
 const expected=evidence(state,input,options);
 if(!expected.ok)return deny(expected.code);
 if(record.digest.length!==expected.digest.length||
  !crypto.timingSafeEqual(Buffer.from(record.digest),Buffer.from(expected.digest))||
  stable(record.payload)!==stable(expected.payload))return deny('stale-or-mismatched-evidence');
 return {valid:true,code:'provenance-verified-not-consent',authenticatedCpuConsent:false,
  saved:false,settlementAuthorized:false};
}
module.exports={evidence,verify};
