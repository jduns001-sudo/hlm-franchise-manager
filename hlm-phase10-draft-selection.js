'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
/** Execute a single verified draft selection; no automatic lottery or trade resolution. */
function selectDraftProspect(state,{pickId,prospectId,teamId}={}){
  if(!validateGameStateEnvelope(state).valid)throw new Error('Invalid franchise game state');
  if(pickId==null||prospectId==null||teamId==null)throw new TypeError('Pick, prospect and team required');
  const picks=state.assets.draftPicks.filter(p=>p&&String(p.pickId??p.id)===String(pickId));
  if(picks.length!==1)throw new Error('Draft pick missing or ambiguous');
  const pick=picks[0];
  if(String(pick.currentOwnerId)!==String(teamId))throw new Error('Team does not own pick');
  if(pick.selectedProspectId!=null||pick.status==='used')throw new Error('Draft pick already used');
  if(!state.universe.teams.some(t=>String(t.id)===String(teamId)))throw new Error('Team not found');
  const prospects=state.universe.prospects.filter(p=>p&&String(p.id)===String(prospectId));
  if(prospects.length!==1)throw new Error('Prospect missing or ambiguous');
  if(prospects[0].draftedByTeamId!=null||prospects[0].draftPickId!=null)throw new Error('Prospect already drafted');
  const nextState=JSON.parse(JSON.stringify(state));
  const nextPick=nextState.assets.draftPicks.find(p=>String(p.pickId??p.id)===String(pickId));
  const nextProspect=nextState.universe.prospects.find(p=>String(p.id)===String(prospectId));
  nextPick.selectedProspectId=nextProspect.id;
  nextPick.status='used';
  nextProspect.draftedByTeamId=teamId;
  nextProspect.draftPickId=pickId;
  return {nextState,selection:{pickId,prospectId,teamId}};
}
module.exports={selectDraftProspect};
