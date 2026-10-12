'use strict';
const {createGameStateEnvelope,validateGameStateEnvelope}=require('./hlm-game-state');
/** Explicit, non-destructive import from legacy Front Office records into an isolated Phase 10 save. */
function createPhase10FromFrontOffice(legacy,{controlledTeamId,currentDate,saveId='phase10-import'}={}){
 if(!legacy||typeof legacy!=='object'||Array.isArray(legacy))throw new TypeError('Front Office data must be an object');
 if(!Array.isArray(legacy.teams)||legacy.teams.length<2)throw new Error('Front Office requires at least two teams');
 if(!Array.isArray(legacy.players))throw new Error('Front Office players array required');
 if(controlledTeamId==null||!legacy.teams.some(t=>t&&String(t.id)===String(controlledTeamId)))throw new Error('Controlled team not found');
 if(typeof currentDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(currentDate)||!Number.isFinite(Date.parse(currentDate+'T00:00:00Z')))throw new Error('Valid currentDate required');
 const state=createGameStateEnvelope({
  meta:{saveId,controlledTeamId,currentDate},
  teams:legacy.teams,players:legacy.players,
  contracts:Array.isArray(legacy.contracts)?legacy.contracts:[],
  prospects:Array.isArray(legacy.prospects)?legacy.prospects:[],
  draftPicks:Array.isArray(legacy.draftPicks)?legacy.draftPicks:[],
  transactions:Array.isArray(legacy.transactions)?legacy.transactions:[]
 });
 if(!validateGameStateEnvelope(state).valid)throw new Error('Imported franchise state invalid');
 return {nextState:state,summary:{teamCount:state.universe.teams.length,playerCount:state.universe.players.length,contractCount:state.assets.contracts.length,controlledTeamId}};
}
module.exports={createPhase10FromFrontOffice};
