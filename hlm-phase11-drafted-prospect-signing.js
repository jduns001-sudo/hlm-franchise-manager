'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');

/** Explicit human-GM approved signing of an owned unsigned drafted prospect. */
function signDraftedProspect(state,{prospectId,teamId,contractId,aav,years,season,capLimit}={}){
 if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
 if(prospectId==null||teamId==null||typeof contractId!=='string'||!contractId.trim())throw new TypeError('Prospect, team and contract ID required');
 if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
 const matches=state.universe.prospects.filter(p=>p&&String(p.id)===String(prospectId));
 if(matches.length!==1)throw new Error('Prospect missing or ambiguous');
 const prospect=matches[0];
 if(String(prospect.draftedByTeamId)!==String(teamId)||prospect.draftPickId==null)throw new Error('Team does not own drafted prospect rights');
 const picks=state.assets.draftPicks.filter(p=>p&&String(p.pickId??p.id)===String(prospect.draftPickId));
 if(picks.length!==1||String(picks[0].currentOwnerId)!==String(teamId)||String(picks[0].selectedProspectId)!==String(prospectId)||picks[0].status!=='used')throw new Error('Draft rights do not match completed pick');
 if(prospect.signedContractId!=null||state.universe.players.some(p=>String(p.id)===String(prospectId))||state.assets.contracts.some(c=>String(c.playerId)===String(prospectId)))throw new Error('Prospect already signed or player ID in use');
 if(state.assets.contracts.some(c=>String(c.contractId??c.id)===contractId))throw new Error('Contract ID already exists');
 if(!Number.isFinite(aav)||aav<0||!Number.isSafeInteger(years)||years<1||years>15)throw new RangeError('Invalid salary or term');
 if(typeof season!=='string'||!season.trim())throw new TypeError('Season is required');
 if(!Number.isFinite(capLimit)||capLimit<0)throw new RangeError('Valid cap limit required');
 const active=state.assets.contracts.filter(c=>String(c.teamId)===String(teamId)&&c.status!=='expired');
 if(active.some(c=>!Number.isFinite(Number(c.aav))||Number(c.aav)<0))throw new Error('Existing payroll has invalid salaries');
 const payroll=active.reduce((sum,c)=>sum+Number(c.aav),0);
 if(payroll+aav>capLimit)throw new Error('Signing exceeds salary cap');
 const nextState=JSON.parse(JSON.stringify(state));
 const signed=nextState.universe.prospects.find(p=>String(p.id)===String(prospectId));
 signed.signedContractId=contractId;
 const player={...signed,teamId};
 delete player.draftedByTeamId;
 delete player.draftPickId;
 delete player.signedContractId;
 nextState.universe.players.push(player);
 const contract={contractId,playerId:prospectId,teamId,aav,years,season,status:'active'};
 nextState.assets.contracts.push(contract);
 return {nextState,contract,summary:{prospectId,teamId,contractId,projectedPayroll:payroll+aav,capSpace:capLimit-payroll-aav}};
}
module.exports={signDraftedProspect};
