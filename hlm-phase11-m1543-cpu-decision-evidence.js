'use strict';
/* Mission 1543: read-only CPU decision evidence verifier.
 * Persisted game evidence is not an authenticated authorization channel.
 * Never settle or write franchise data.
 */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
function verifyCpuDecisionEvidence(state,input={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const receiver=String(plan.transfers[0].toTeamId);
 const decisions=state.extensions?.cpuTradeDecisions;
 if(!Array.isArray(decisions))return deny('source-cpu-decision-ledger-required');
 const matches=decisions.filter(d=>d&&d.outgoingPlayerId===input.outgoingPlayerId&&
   d.incomingPlayerId===input.incomingPlayerId&&String(d.receivingTeamId)===receiver);
 if(matches.length!==1)return deny('unique-source-cpu-decision-required');
 const d=matches[0];
 if(!Number.isSafeInteger(d.gameRevision)||d.gameRevision!==plan.revision)
  return deny('stale-cpu-decision');
 if(!['accept','decline'].includes(d.decision))return deny('invalid-cpu-decision');
 // Caller-supplied approval, policy recommendation or ledger fields are not
 // sufficient to establish that an authorized CPU organization made the decision.
 return Object.freeze({ok:true,code:'source-cpu-decision-read-only',decision:d.decision,
  receivingTeamId:receiver,gameRevision:plan.revision,
  consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports={verifyCpuDecisionEvidence};
