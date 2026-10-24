/* Mission 1551: browser-parity, read-only CPU decision lifecycle. */
(function(root){'use strict';const factories=Object.create(null),cache=Object.create(null);
function require(id){const key=id.replace(/^\.\//,'').replace(/\.js$/,'');if(!factories[key])throw Error('Unknown CPU lifecycle module');if(!cache[key]){const module={exports:{}};cache[key]=module;factories[key](module,module.exports,require)}return cache[key].exports}
factories["hlm-phase11-m1540-readonly-trade-plan"]=function(module,exports,require){
'use strict';
/* Mission 1540: isolated, read-only trade settlement planning. No writes or authorization. */
function planTrade(state,input={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
 if(!state||!Array.isArray(state.universe?.players)||!Array.isArray(state.universe?.teams)||
    !Array.isArray(state.assets?.contracts)||!Number.isSafeInteger(state.meta?.revision)||
    state.meta.revision<1)return deny('invalid-source-state');
 if(input.gmApproved!==true)return deny('human-gm-approval-required');
 if(!Number.isSafeInteger(input.expectedGameRevision)||input.expectedGameRevision!==state.meta.revision)
  return deny('stale-game-revision');
 const players=state.universe.players,contracts=state.assets.contracts;
 const ids=[input.outgoingPlayerId,input.incomingPlayerId];
 if(ids.some(id=>typeof id!=='string'||!id.trim())||ids[0]===ids[1])return deny('invalid-player-ids');
 const selected=[];
 for(const id of ids){
  const p=players.filter(x=>String(x?.id)===id),c=contracts.filter(x=>String(x?.playerId)===id&&x.status==='active');
  if(p.length!==1||c.length!==1||String(p[0].teamId)!==String(c[0].teamId))return deny('missing-or-mismatched-active-contract');
  selected.push({player:p[0],contract:c[0]});
 }
 const [a,b]=selected,teamA=String(a.player.teamId),teamB=String(b.player.teamId);
 if(teamA!==String(state.meta.controlledTeamId)||teamA===teamB||
   ![teamA,teamB].every(id=>state.universe.teams.filter(t=>String(t?.id)===id).length===1))
  return deny('invalid-team-ownership');
 // Caller-supplied consent flags are never authoritative. This planner cannot
 // authenticate receiving-team consent and never grants settlement authority.
 const consentStatus='receiving-team-consent-not-authenticated';
 if(selected.some(x=>x.contract.tradePermission!=='allowed'||['retired','suspended'].includes(x.player.status)))
  return deny('trade-restricted');
 const validAav=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 const active=contracts.filter(x=>x.status==='active'),caps=state.finances?.teamCapLimits;
 if(!caps||![teamA,teamB].every(id=>typeof caps[id]==='number'&&Number.isFinite(caps[id])&&caps[id]>=0)||
    active.filter(c=>[teamA,teamB].includes(String(c.teamId))).some(c=>!validAav(c.aav))||
    selected.some(x=>!validAav(x.contract.aav)))return deny('source-financial-evidence-required');
 const payroll=id=>active.filter(c=>String(c.teamId)===id).reduce((sum,c)=>sum+c.aav,0);
 const afterA=payroll(teamA)-a.contract.aav+b.contract.aav;
 const afterB=payroll(teamB)-b.contract.aav+a.contract.aav;
 if(afterA>caps[teamA]||afterB>caps[teamB])return deny('salary-cap-exceeded');
 const limits=state.extensions?.tradeRosterLimits;
 if(!limits||![teamA,teamB].every(id=>Number.isSafeInteger(limits[id])&&limits[id]>=0&&
     players.filter(p=>String(p.teamId)===id).length<=limits[id]))return deny('roster-limit-unverified');
 const transfers=Object.freeze([
  Object.freeze({playerId:a.player.id,contractPlayerId:a.contract.playerId,fromTeamId:teamA,toTeamId:teamB}),
  Object.freeze({playerId:b.player.id,contractPlayerId:b.contract.playerId,fromTeamId:teamB,toTeamId:teamA})
 ]);
 return Object.freeze({ok:true,code:'read-only-plan',revision:state.meta.revision,transfers,
  projectedPayroll:Object.freeze({[teamA]:afterA,[teamB]:afterB}),
  consentStatus,saved:false,settlementAuthorized:false});
}
module.exports={planTrade};

};
factories["hlm-phase11-m1544-cpu-decision-authority"]=function(module,exports,require){
'use strict';
/* Mission 1544: isolated CPU authority evaluates the source-backed proposal.
 * This module generates decisions; it never accepts caller-supplied CPU consent.
 * No writes, no authenticated settlement consent, no production activation.
 */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
function evaluateCpuTrade(state,input={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const receiver=plan.transfers[0].toTeamId;
 const outgoing=state.assets.contracts.find(c=>String(c.playerId)===String(input.outgoingPlayerId)&&c.status==='active');
 const incoming=state.assets.contracts.find(c=>String(c.playerId)===String(input.incomingPlayerId)&&c.status==='active');
 // Deterministic experimental receiving-team policy, not a negotiated or signed acceptance.
 const accepted=outgoing.aav<=incoming.aav;
 return Object.freeze({ok:true,code:'cpu-policy-decision-read-only',policyId:'incoming-team-aav-nonincreasing-v1',
  decision:accepted?'accept':'decline',receivingTeamId:receiver,gameRevision:plan.revision,
  outgoingPlayerId:input.outgoingPlayerId,incomingPlayerId:input.incomingPlayerId,
  reason:accepted?'receiving-team-aav-nonincreasing':'receiving-team-aav-increase',
  consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports={evaluateCpuTrade};

};
factories["hlm-phase11-m1543-cpu-decision-evidence"]=function(module,exports,require){
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

};
factories["hlm-phase11-m1549-cpu-trade-evidence-bridge"]=function(module,exports,require){
'use strict';
/* Mission 1549: source-backed CPU policy/evidence comparison for GM review.
 * Read-only advisory. Never authenticates consent or enables settlement.
 */
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const {verifyCpuDecisionEvidence}=require('./hlm-phase11-m1543-cpu-decision-evidence');
const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function reviewCpuTradeEvidence(state,input={}){
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 const evidence=verifyCpuDecisionEvidence(state,input);
 if(evidence.ok!==true)return Object.freeze({ok:true,code:'cpu-policy-advisory-only',policyDecision:policy.decision,
  evidenceStatus:evidence.code,decisionMatches:false,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 const matches=policy.decision===evidence.decision&&
  String(policy.receivingTeamId)===String(evidence.receivingTeamId)&&
  policy.gameRevision===evidence.gameRevision;
 return Object.freeze({ok:true,code:matches?'cpu-policy-evidence-agrees':'cpu-policy-evidence-conflict',
  policyDecision:policy.decision,evidenceDecision:evidence.decision,
  decisionMatches:matches,saved:false,consentAuthenticated:false,settlementAuthorized:false});
}
module.exports={reviewCpuTradeEvidence};

};
factories["hlm-phase11-m1551-cpu-trade-decision-lifecycle"]=function(module,exports,require){
'use strict';
/* Mission 1551: pure CPU decision lifecycle for one source-backed trade proposal.
 * No persistence, no CPU consent authentication, no settlement authorization.
 */
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const {reviewCpuTradeEvidence}=require('./hlm-phase11-m1549-cpu-trade-evidence-bridge');
const deny=code=>Object.freeze({ok:false,code,stage:'blocked',saved:false,consentAuthenticated:false,settlementAuthorized:false});
function inspectCpuTradeLifecycle(state,input={}){
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 const evidence=reviewCpuTradeEvidence(state,input);
 if(evidence.ok!==true)return deny(evidence.code);
 const stage=evidence.code==='cpu-policy-evidence-agrees'?'source-evidence-agrees':
  evidence.code==='cpu-policy-evidence-conflict'?'source-evidence-conflicts':'source-evidence-unavailable';
 return Object.freeze({ok:true,code:'cpu-trade-lifecycle-read-only',stage,
  receivingTeamId:policy.receivingTeamId,gameRevision:policy.gameRevision,
  policyId:policy.policyId,policyDecision:policy.decision,
  evidenceStatus:evidence.evidenceStatus||evidence.code,
  evidenceDecision:evidence.evidenceDecision||null,
  decisionMatches:evidence.decisionMatches===true,
  requiresIndependentCpuConsent:true,requiresHumanGmApproval:true,
  saved:false,consentAuthenticated:false,settlementAuthorized:false});
}
module.exports={inspectCpuTradeLifecycle};

};
root.HLMPhase11CpuTradeLifecycle=Object.freeze({inspect:require('./hlm-phase11-m1551-cpu-trade-decision-lifecycle').inspectCpuTradeLifecycle});
})(typeof globalThis!=='undefined'?globalThis:this);
