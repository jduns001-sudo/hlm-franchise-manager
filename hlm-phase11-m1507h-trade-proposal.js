'use strict';
/* Mission 1507H: pure, source-backed trade settlement PROPOSAL.
 * No CPU authority, save adapter, or production activation. Settlement remains blocked.
 */
const {evaluateTradeEligibility}=require('./hlm-phase11-trade-financial-eligibility');
const {evaluateTradeRestrictions}=require('./hlm-phase11-trade-restrictions');
function propose(state,input){
 const controlledTeamId=state?.meta?.controlledTeamId;
 const args={outgoingPlayerId:input?.outgoingPlayerId,incomingPlayerId:input?.incomingPlayerId,controlledTeamId};
 const financial=evaluateTradeEligibility(state,args);
 const restrictions=evaluateTradeRestrictions(state,args);
 if(String(financial.otherTeamId)!==String(restrictions.otherTeamId))throw Error('Conflicting receiving franchise');
 const before=JSON.stringify(state);
 const nextState=JSON.parse(before);
 const outgoing=nextState.universe.players.find(p=>String(p.id)===String(args.outgoingPlayerId));
 const incoming=nextState.universe.players.find(p=>String(p.id)===String(args.incomingPlayerId));
 const outContract=nextState.assets.contracts.find(c=>String(c.playerId)===String(args.outgoingPlayerId)&&c.status==='active');
 const inContract=nextState.assets.contracts.find(c=>String(c.playerId)===String(args.incomingPlayerId)&&c.status==='active');
 if(!outgoing||!incoming||!outContract||!inContract)throw Error('Missing sourced trade asset');
 const from=outgoing.teamId,to=incoming.teamId;
 outgoing.teamId=to;incoming.teamId=from;
 outContract.teamId=to;inContract.teamId=from;
 // Re-evaluate the unchanged source after constructing the preview; never persist or authorize it.
 if(JSON.stringify(state)!==before)throw Error('Source changed during review');
 return Object.freeze({nextState,review:Object.freeze({
  outgoingPlayerId:outgoing.id,incomingPlayerId:incoming.id,controlledTeamId:String(from),otherTeamId:String(to),
  projectedPayroll:financial.projectedPayroll,financialReviewed:true,restrictionsReviewed:true,
  requiresHumanGmApproval:true,requiresIndependentCpuConsent:true,
  settlementAuthorized:false,saved:false,experimental:true,
  reason:'Independent CPU authority and atomic guarded settlement adapter are unavailable'
 })});
}
module.exports={propose};
