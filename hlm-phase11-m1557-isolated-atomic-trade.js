'use strict';
/* Mission 1557: isolated, in-memory transaction preparation.
 * No independent CPU authorization, storage write, or settlement is implied.
 * Do not use this output as an authorization capability.
 */
const {decideCpuTrade}=require('./hlm-phase11-m1555-engine-owned-cpu-decision');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,consentAuthenticated:false});
function prepareIsolatedAtomicTrade(state,input={}){
 const decision=decideCpuTrade(state,input);
 if(decision.ok!==true)return deny(decision.code);
 if(decision.decision!=='accept')return deny('cpu-policy-declined');
 if(!Number.isSafeInteger(state.meta.revision)||state.meta.revision>=Number.MAX_SAFE_INTEGER)
  return deny('revision-overflow');
 const candidate=JSON.parse(JSON.stringify(state));
 const transfers=[
  {playerId:input.outgoingPlayerId,from:String(state.meta.controlledTeamId),to:decision.receivingTeamId},
  {playerId:input.incomingPlayerId,from:decision.receivingTeamId,to:String(state.meta.controlledTeamId)}
 ];
 for(const t of transfers){
  const ps=candidate.universe.players.filter(p=>String(p.id)===t.playerId);
  const cs=candidate.assets.contracts.filter(c=>String(c.playerId)===t.playerId&&c.status==='active');
  if(ps.length!==1||cs.length!==1||String(ps[0].teamId)!==t.from||String(cs[0].teamId)!==t.from)
   return deny('stale-transfer-source');
  ps[0].teamId=t.to;cs[0].teamId=t.to;
 }
 candidate.meta.revision++;
 // Candidate remains private to this function. Return only a non-authorizing summary.
 return Object.freeze({ok:true,code:'isolated-atomic-candidate-validated',
  proposalId:decision.proposalId,expectedRevision:state.meta.revision,
  proposedRevision:candidate.meta.revision,playerTransfers:2,contractTransfers:2,
  decision:decision.decision,saved:false,settlementAuthorized:false,consentAuthenticated:false});
}
module.exports={prepareIsolatedAtomicTrade};
