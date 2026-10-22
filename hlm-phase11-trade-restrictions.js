'use strict';
/* Mission 1445: read-only trade restriction and roster eligibility. Missing authority blocks review. */
const {validateGameStateEnvelope}=require('./hlm-game-state');
function evaluateTradeRestrictions(state,{outgoingPlayerId,incomingPlayerId,controlledTeamId}={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid GameState required');
 const controlled=String(state.meta.controlledTeamId??'');
 if(!controlled||String(controlledTeamId)!==controlled)throw Error('Controlled GM authority required');
 const players=state.universe.players,teams=state.universe.teams;
 const matches=id=>players.filter(p=>p&&String(p.id)===String(id));
 const a=matches(outgoingPlayerId),b=matches(incomingPlayerId);
 if(a.length!==1||b.length!==1||String(a[0].id)===String(b[0].id))throw Error('Two distinct sourced players required');
 const other=String(b[0].teamId??'');
 if(String(a[0].teamId)!==controlled||other===controlled||!teams.some(t=>String(t.id)===other))throw Error('Invalid team ownership');
 const active=state.assets.contracts;
 for(const p of [a[0],b[0]]){
  const cs=active.filter(c=>String(c.playerId)===String(p.id)&&c.status==='active');
  if(cs.length!==1||String(cs[0].teamId)!==String(p.teamId))throw Error('Authoritative active contract required');
  // Restriction records must explicitly attest transfer permission. Unknown is not permission.
  if(cs[0].tradePermission!=='allowed')throw Error('Trade restriction permission unverified');
  if(p.status==='retired'||p.status==='suspended')throw Error('Ineligible player status');
 }
 const limits=state.extensions?.tradeRosterLimits;
 if(!limits||!Number.isSafeInteger(limits[controlled])||!Number.isSafeInteger(limits[other]))throw Error('Source-backed roster limits unavailable');
 const count=id=>players.filter(p=>String(p.teamId)===id).length;
 if(count(controlled)>limits[controlled]||count(other)>limits[other])throw Error('Roster already exceeds sourced limit');
 // Equal-size exchange preserves each team's roster count. This is NOT AI consent.
 return Object.freeze({eligibleForFurtherReview:true,settlementAuthorized:false,otherTeamId:other,reason:'Receiving-team consent and complete game integration remain unverified'});
}
module.exports={evaluateTradeRestrictions};
