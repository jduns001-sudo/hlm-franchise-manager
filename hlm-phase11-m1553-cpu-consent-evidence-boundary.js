'use strict';
/* Mission 1553: read-only CPU consent evidence boundary.
 * Persisted records and caller flags are never authenticated consent.
 */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
const deny=code=>Object.freeze({ok:false,code,consentAuthenticated:false,settlementAuthorized:false,saved:false});
function inspectCpuConsentEvidence(state,input={}){
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const receiver=String(plan.transfers[0].toTeamId);
 const records=state.extensions?.cpuTradeConsentEvidence;
 if(!Array.isArray(records))return deny('source-cpu-consent-ledger-required');
 const relevant=records.filter(x=>x&&x.outgoingPlayerId===input.outgoingPlayerId&&
  x.incomingPlayerId===input.incomingPlayerId&&String(x.receivingTeamId)===receiver);
 if(relevant.length!==1)return deny('unique-source-cpu-consent-required');
 const record=relevant[0];
 if(!Number.isSafeInteger(record.gameRevision)||record.gameRevision!==plan.revision)
  return deny('stale-cpu-consent-evidence');
 if(record.decision!=='accept'&&record.decision!=='decline')return deny('invalid-cpu-consent-decision');
 if(record.decision==='decline')return deny('cpu-consent-declined');
 // The game state is controlled by the client. Even a matching ledger entry
 // cannot prove the independent receiving organization made this decision.
 return Object.freeze({ok:false,code:'cpu-consent-untrusted-source',receivingTeamId:receiver,
  gameRevision:plan.revision,consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports={inspectCpuConsentEvidence};
