'use strict';
const {validateGameStateEnvelope}=require('./hlm-game-state');
const ROSTER_BUCKETS=Object.freeze(['active','minor','prospect','injured','suspended','scratched']);
function err(code,message){const e=new Error(message);e.code=code;return e;}
function createRosterStatusSnapshot(state,teamId,options={}){
 if(!validateGameStateEnvelope(state).valid)throw err('INVALID_ROSTER_STATUS_GAME_STATE','Valid GameState required.');
 const id=String(teamId??'').trim();if(!id)throw err('ROSTER_STATUS_TEAM_REQUIRED','Permanent team ID required.');
 if(!state.universe.teams.some(t=>String(t.id)===id))throw err('ROSTER_STATUS_TEAM_NOT_FOUND','Team not found.');
 const scratches=new Set((options.scratchedPlayerIds||[]).map(String));
 const minor=new Set((options.minorPlayerIds||[]).map(String));const prospects=new Set((options.prospectPlayerIds||[]).map(String));
 const suspended=new Set((options.suspendedPlayerIds||[]).map(String));
 const injured=new Set(state.activity.injuries.map(i=>String(i.playerId)));
 const players=state.universe.players.filter(p=>String(p.teamId)===id&&p.retired!==true);
 const entries=players.map(player=>{const pid=String(player.id);let status='active';
  if(injured.has(pid))status='injured';else if(suspended.has(pid))status='suspended';else if(scratches.has(pid))status='scratched';else if(minor.has(pid))status='minor';else if(prospects.has(pid))status='prospect';
  return Object.freeze({player:Object.freeze({...player}),status,availableForActiveLineup:status==='active'});});
 const byStatus={};for(const bucket of ROSTER_BUCKETS)byStatus[bucket]=Object.freeze(entries.filter(e=>e.status===bucket));
 return Object.freeze({kind:'roster-status-snapshot',version:1,teamId:id,entries:Object.freeze(entries),byStatus:Object.freeze(byStatus),
  statusPriority:Object.freeze(['injured','suspended','scratched','minor','prospect','active']),sourceStateMutated:false,persistencePerformed:false});
}
module.exports={ROSTER_BUCKETS,createRosterStatusSnapshot};
