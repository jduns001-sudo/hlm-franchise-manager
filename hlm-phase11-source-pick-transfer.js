'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Pure draft-pick transfer proposal. Never writes saves; the human GM must approve persistence separately. */
function reviewPickTransfer(state,{pickId,fromTeamId,toTeamId}={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Invalid franchise game state');
 if(pickId==null||fromTeamId==null||toTeamId==null||String(fromTeamId)===String(toTeamId))throw Error('Distinct teams and pick required');
 const teams=state.universe.teams;
 if(!teams.some(t=>String(t.id)===String(fromTeamId))||!teams.some(t=>String(t.id)===String(toTeamId)))throw Error('Unknown franchise team');
 const matches=state.assets.draftPicks.filter(p=>p&&String(p.pickId)===String(pickId));
 if(matches.length!==1)throw Error('Draft pick missing or ambiguous');
 const pick=matches[0];
 if(pick.source!=='hlm-universe.json'||pick.status!=='AVAILABLE'||pick.selectedProspectId!=null)throw Error('Pick is not a source-backed available asset');
 if(String(pick.currentOwnerId)!==String(fromTeamId))throw Error('Pick owner changed or is incorrect');
 const nextState=JSON.parse(JSON.stringify(state));
 const target=nextState.assets.draftPicks.find(p=>String(p.pickId)===String(pickId));
 target.currentOwnerId=toTeamId;
 return {nextState,review:{pickId,fromTeamId,toTeamId,originalTeamId:pick.originalTeamId,year:pick.year,round:pick.round,source:pick.source,requiresGmApproval:true}};
}
module.exports={reviewPickTransfer};
