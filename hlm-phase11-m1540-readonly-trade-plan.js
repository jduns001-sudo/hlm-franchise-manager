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
 if(input.cpuConsentAuthenticated!==true||input.cpuConsentEvidence?.teamId!==teamB||
    input.cpuConsentEvidence?.approved!==true||input.cpuConsentEvidence?.sourceVerified!==true)
  return deny('authenticated-receiving-team-consent-required');
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
  cpuConsentEvidenceUnverifiedByPlanner:true,saved:false,settlementAuthorized:false});
}
module.exports={planTrade};
