'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const ROLE_TYPES=Object.freeze(['Franchise','Star','Top-Six','Bottom-Six','Top-Four','Depth','Starter','Backup','Prospect','Specialist']);
function err(code,message){const e=new Error(message);e.code=code;return e;}
function createFranchiseManagementSnapshot(state,teamId){
 if(!validateGameStateEnvelope(state).valid)throw err('INVALID_FRANCHISE_GAME_STATE','Valid GameState required.');
 if(teamId===null||teamId===undefined||String(teamId).trim()==='')throw err('FRANCHISE_TEAM_REQUIRED','Permanent team ID required.');
 const id=String(teamId);const team=state.universe.teams.find(t=>String(t.id)===id);
 if(!team)throw err('FRANCHISE_TEAM_NOT_FOUND','Team not found in GameState.');
 const players=state.universe.players.filter(p=>String(p.teamId)===id&&p.retired!==true);
 const contracts=state.assets.contracts.filter(c=>String(c.teamId)===id||players.some(p=>String(p.id)===String(c.playerId)));
 const picks=state.assets.draftPicks.filter(p=>String(p.ownerTeamId??p.teamId)===id);
 const injuries=state.activity.injuries.filter(i=>players.some(p=>String(p.id)===String(i.playerId)));
 return Object.freeze({kind:'franchise-management-snapshot',version:1,teamId:id,team:Object.freeze({...team}),
  roster:Object.freeze(players.map(p=>Object.freeze({...p}))),contracts:Object.freeze(contracts.map(c=>Object.freeze({...c}))),
  draftPicks:Object.freeze(picks.map(p=>Object.freeze({...p}))),injuries:Object.freeze(injuries.map(i=>Object.freeze({...i}))),
  dashboard:Object.freeze({record:null,finances:null,prospects:null,staff:null,owner:null,alerts:Object.freeze([])}),
  capabilities:Object.freeze({roster:true,depthChart:true,lines:true,specialTeams:true,callUpsDemotions:true,aiLineSuggestions:true,
   playerRoles:true,contracts:true,promises:true,trust:true,capManagement:true,tradeCenter:true,waivers:true,releasesBuyouts:true,
   futureCapPlanning:true,organizationPhilosophy:true,ownerExpectations:true,gmReputation:true,decisionHistory:true,franchiseAI:true,tradeRequests:true}),
  roleTypes:ROLE_TYPES,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={ROLE_TYPES,createFranchiseManagementSnapshot};
