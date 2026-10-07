'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {createRosterStatusSnapshot}=require('./hlm-roster-status-foundation');

const LINE_GROUPS=Object.freeze(['forwards','defense','powerPlay','penaltyKill','extraAttacker','shootout']);
const ROLE_TYPES=Object.freeze(['Franchise','Star','Top-Six','Bottom-Six','Top-Four','Depth','Starter','Backup','Prospect','Specialist']);
const PROMISE_TYPES=Object.freeze(['role','ice-time','power-play','evaluation','trade-related']);

function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function ids(value){return Array.isArray(value)?value.map(String):[];}
function freezeGroup(value){return Object.freeze((Array.isArray(value)?value:[]).map(group=>Object.freeze(ids(group))));}

function createRosterConfigurationSnapshot(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_ROSTER_CONFIGURATION_GAME_STATE','Valid GameState required.');
 const roster=createRosterStatusSnapshot(state,teamId,options.rosterStatus||{});
 const organizationIds=new Set(roster.entries.map(e=>String(e.player.id)));
 const activeIds=new Set(roster.byStatus.active.map(e=>String(e.player.id)));
 const depthInput=options.depthChart||{};
 const depthChart=Object.freeze({
  centers:Object.freeze(ids(depthInput.centers)),wings:Object.freeze(ids(depthInput.wings)),
  defense:Object.freeze(ids(depthInput.defense)),goalies:Object.freeze(ids(depthInput.goalies)),
  organizational:Object.freeze(ids(depthInput.organizational))
 });
 const lineInput=options.lines||{};
 const lines={};for(const key of LINE_GROUPS)lines[key]=freezeGroup(lineInput[key]);
 const referenced=[...depthChart.centers,...depthChart.wings,...depthChart.defense,...depthChart.goalies,...depthChart.organizational,
  ...Object.values(lines).flat(2)];
 const unknownPlayerIds=Object.freeze([...new Set(referenced.filter(pid=>!organizationIds.has(String(pid))).map(String))]);
 const unavailableLineupPlayerIds=Object.freeze([...new Set(Object.values(lines).flat(2).filter(pid=>organizationIds.has(String(pid))&&!activeIds.has(String(pid))).map(String))]);
 return Object.freeze({kind:'roster-configuration-snapshot',version:1,teamId:String(teamId),roster,
  depthChart,lines:Object.freeze(lines),validation:Object.freeze({valid:unknownPlayerIds.length===0&&unavailableLineupPlayerIds.length===0,unknownPlayerIds,unavailableLineupPlayerIds}),
  aiLineSuggestions:Object.freeze({supportedAsRecommendation:true,silentLineupChangesAllowed:false}),
  sourceStateMutated:false,persistencePerformed:false});
}

function createPlayerRelationshipSnapshot(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)fail('INVALID_PLAYER_RELATIONSHIP_GAME_STATE','Valid GameState required.');
 const roster=createRosterStatusSnapshot(state,teamId,options.rosterStatus||{});
 const organizationIds=new Set(roster.entries.map(e=>String(e.player.id)));
 const roleAssignments=Object.freeze((options.roleAssignments||[]).map(x=>Object.freeze({playerId:String(x.playerId),role:x.role??null,
  validPlayer:organizationIds.has(String(x.playerId)),validRole:ROLE_TYPES.includes(x.role)})));
 const promises=Object.freeze((options.promises||[]).map(x=>Object.freeze({playerId:String(x.playerId),type:x.type??null,status:x.status??null,
  validPlayer:organizationIds.has(String(x.playerId)),validType:PROMISE_TYPES.includes(x.type)})));
 const trust=Object.freeze((options.trust||[]).map(x=>Object.freeze({playerId:String(x.playerId),value:x.value??null,
  validPlayer:organizationIds.has(String(x.playerId))})));
 return Object.freeze({kind:'player-relationship-snapshot',version:1,teamId:String(teamId),roleTypes:ROLE_TYPES,promiseTypes:PROMISE_TYPES,
  roleAssignments,promises,trust,brokenPromisesAffectTrust:true,trustCalculationPerformed:false,
  sourceStateMutated:false,persistencePerformed:false});
}
module.exports={LINE_GROUPS,ROLE_TYPES,PROMISE_TYPES,createRosterConfigurationSnapshot,createPlayerRelationshipSnapshot};
