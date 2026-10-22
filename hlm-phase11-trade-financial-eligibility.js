'use strict';
/* Mission 1445: read-only, fail-closed financial eligibility. Never authorizes a trade. */
const {validateGameStateEnvelope}=require('./hlm-game-state');
function evaluateTradeEligibility(state,{outgoingPlayerId,incomingPlayerId,controlledTeamId}={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid GameState envelope required');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||String(controlledTeamId)!==controlled)throw Error('Controlled team authority required');
 const players=state.universe.players,teams=state.universe.teams;
 const find=id=>players.filter(p=>p&&String(p.id)===String(id));
 const out=find(outgoingPlayerId),incoming=find(incomingPlayerId);
 if(out.length!==1||incoming.length!==1||String(out[0].id)===String(incoming[0].id))throw Error('Distinct uniquely sourced players required');
 const a=out[0],b=incoming[0],other=String(b.teamId??'');
 if(String(a.teamId)!==controlled||other===controlled||!teams.some(t=>String(t.id)===other))throw Error('Invalid trade ownership');
 const contracts=state.assets.contracts;
 const getContract=p=>contracts.filter(c=>c&&String(c.playerId)===String(p.id)&&c.status==='active');
 const ac=getContract(a),bc=getContract(b);
 if(ac.length!==1||bc.length!==1)throw Error('Exactly one authoritative active contract per player required');
 if(String(ac[0].teamId)!==controlled||String(bc[0].teamId)!==other)throw Error('Contract ownership mismatch');
 if(![ac[0].aav,bc[0].aav].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))throw Error('Verified contract AAV required');
 // Cap limits must originate in the saved franchise, never be supplied by the caller.
 const cap=state.finances?.teamCapLimits;
 if(!cap||!Number.isFinite(cap[controlled])||!Number.isFinite(cap[other]))throw Error('Source-backed team cap limits unavailable');
 const payroll=id=>{
  const active=contracts.filter(c=>String(c.teamId)===id&&c.status==='active');
  if(active.some(c=>typeof c.aav!=='number'||!Number.isFinite(c.aav)||c.aav<0))throw Error('Unverifiable team payroll');
  return active.reduce((n,c)=>n+c.aav,0);
 };
 const afterA=payroll(controlled)-ac[0].aav+bc[0].aav,afterB=payroll(other)-bc[0].aav+ac[0].aav;
 if(afterA>cap[controlled]||afterB>cap[other])throw Error('Trade exceeds verified salary cap');
 // No inferred no-trade clauses, roster limits, or receiving-team consent.
 return Object.freeze({eligibleForFurtherReview:true,settlementAuthorized:false,controlledTeamId:controlled,otherTeamId:other,projectedPayroll:{[controlled]:afterA,[other]:afterB},reason:'Restrictions, roster rules and receiving-team consent require independent verification'});
}
module.exports={evaluateTradeEligibility};
