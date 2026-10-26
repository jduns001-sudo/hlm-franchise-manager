/* Mission 1627: source-ledger CPU decision binding for read-only GM review.
 * Saved evidence is NOT authenticated CPU consent. No writes or settlement.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMM1627CpuConsentBoundary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const deny=code=>Object.freeze({ok:false,code,sourceBound:false,consentAuthenticated:false,settlementAuthorized:false,saved:false});
function inspect(state,input={}){
 if(!state||!Number.isSafeInteger(state.meta?.revision)||state.meta.revision<1)return deny('invalid-source-revision');
 if(input.gmApproved!==true)return deny('human-gm-approval-required');
 if(input.expectedGameRevision!==state.meta.revision)return deny('stale-game-revision');
 if(typeof input.proposalId!=='string'||!input.proposalId.trim())return deny('proposal-id-required');
 const ids=[input.outgoingPlayerId,input.incomingPlayerId];
 if(ids.some(id=>typeof id!=='string'||!id.trim())||ids[0]===ids[1])return deny('invalid-player-ids');
 const players=state.universe?.players,contracts=state.assets?.contracts,teams=state.universe?.teams;
 if(!Array.isArray(players)||!Array.isArray(contracts)||!Array.isArray(teams))return deny('source-assets-required');
 const found=ids.map(id=>({p:players.filter(p=>p&&p.id===id),c:contracts.filter(c=>c&&c.playerId===id&&c.status==='active')}));
 if(found.some(x=>x.p.length!==1||x.c.length!==1||String(x.p[0].teamId)!==String(x.c[0].teamId)))return deny('unique-active-ownership-required');
 const gm=String(found[0].p[0].teamId),cpu=String(found[1].p[0].teamId);
 if(gm!==String(state.meta.controlledTeamId)||gm===cpu||teams.filter(t=>String(t?.id)===cpu).length!==1)return deny('receiving-team-mismatch');
 if(found.some(x=>x.c[0].tradePermission!=='allowed'))return deny('trade-restricted');
 const ledger=state.extensions?.cpuTradeDecisions;
 if(!Array.isArray(ledger))return deny('source-cpu-ledger-required');
 // Duplicate proposal IDs or duplicate player pair decisions are ambiguous, even if one appears valid.
 const byProposal=ledger.filter(d=>d&&d.proposalId===input.proposalId);
 const byPair=ledger.filter(d=>d&&d.outgoingPlayerId===ids[0]&&d.incomingPlayerId===ids[1]&&String(d.receivingTeamId)===cpu);
 if(byProposal.length!==1||byPair.length!==1||byProposal[0]!==byPair[0])return deny('unique-source-decision-required');
 const d=byProposal[0];
 if(d.outgoingPlayerId!==ids[0]||d.incomingPlayerId!==ids[1]||String(d.receivingTeamId)!==cpu)return deny('decision-binding-mismatch');
 if(d.gameRevision!==state.meta.revision)return deny('stale-cpu-decision');
 if(d.decision!=='accept')return deny(d.decision==='decline'?'cpu-declined':'invalid-cpu-decision');
 // Existing deterministic CPU advisory policy: receiver's AAV must not increase.
 const [a,b]=found.map(x=>x.c[0].aav);
 if(![a,b].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))return deny('financial-source-required');
 if(a>b)return deny('cpu-policy-conflict');
 return Object.freeze({ok:true,code:'source-cpu-decision-bound-read-only',proposalId:d.proposalId,receivingTeamId:cpu,gameRevision:state.meta.revision,sourceBound:true,decision:'accept',consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
return Object.freeze({inspect});
});
