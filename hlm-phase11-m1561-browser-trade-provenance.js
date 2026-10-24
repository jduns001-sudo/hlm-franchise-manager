'use strict';
/* Mission 1561: browser-safe provenance for experimental synthetic trades.
 * This is NOT authenticated receiving-team consent and authorizes no settlement.
 * Uses native WebCrypto SHA-256; never substitutes a fake digest.
 */
const {evaluate}=require('./hlm-phase11-m1513-cpu-trade-decision');
const deny=code=>Object.freeze({ok:false,code,saved:false,authenticatedCpuConsent:false,settlementAuthorized:false});
const stable=value=>JSON.stringify(value);
function toHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
async function digest(payload,cryptoApi=globalThis.crypto){
 if(!cryptoApi?.subtle?.digest||typeof TextEncoder==='undefined')throw Error('webcrypto-unavailable');
 return toHex(new Uint8Array(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(stable(payload)))));
}
async function evidence(state,input,options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 const advisory=evaluate(state,input,options);
 if(!advisory.ok)return deny(advisory.code);
 const payload={version:1,gameRevision:advisory.gameRevision,controlledTeamId:advisory.controlledTeamId,otherTeamId:advisory.otherTeamId,outgoingPlayerId:advisory.outgoingPlayerId,incomingPlayerId:advisory.incomingPlayerId,decision:advisory.decision,policy:advisory.policy};
 try{return Object.freeze({ok:true,code:'browser-decision-provenance-only',payload,digest:await digest(payload,options.cryptoApi),saved:false,authenticatedCpuConsent:false,settlementAuthorized:false})}
 catch{return deny('browser-crypto-unavailable')}
}
async function verify(state,input,record,options={}){
 const invalid=code=>Object.freeze({valid:false,code,saved:false,authenticatedCpuConsent:false,settlementAuthorized:false});
 if(!record||typeof record.digest!=='string'||!/^[0-9a-f]{64}$/.test(record.digest))return invalid('missing-or-invalid-evidence');
 const expected=await evidence(state,input,options);
 if(!expected.ok)return invalid(expected.code);
 const a=record.digest,b=expected.digest;let mismatch=0;
 for(let i=0;i<64;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);
 if(mismatch!==0||stable(record.payload)!==stable(expected.payload))return invalid('stale-or-mismatched-evidence');
 return Object.freeze({valid:true,code:'browser-provenance-verified-not-consent',saved:false,authenticatedCpuConsent:false,settlementAuthorized:false});
}
module.exports={digest,evidence,verify};
