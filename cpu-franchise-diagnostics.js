(function(root){
'use strict';
// 421: roster positions; 422: player team-mapping gaps;
// 423: duplicate player IDs; 424: contract team-mapping gaps;
// 425: immutable advisory-only diagnostics.
function diagnoseFranchise(state){
 if(!state||state.schemaVersion!==1||!state.universe||!Array.isArray(state.universe.players)||!Array.isArray(state.universe.teams)||!state.assets||!Array.isArray(state.assets.contracts)||!state.meta)throw new Error('Invalid GameState v1');
 const teamId=state.meta.controlledTeamId;
 const roster=state.universe.players.filter(p=>p.teamId!=null&&String(p.teamId)===String(teamId));
 const positions={forward:0,defense:0,goalie:0,unknown:0};
 for(const p of roster){const value=String(p.position??'').toUpperCase();if(['C','LW','RW','F'].includes(value))positions.forward++;else if(['D','LD','RD'].includes(value))positions.defense++;else if(['G','GK'].includes(value))positions.goalie++;else positions.unknown++;}
 const knownTeams=new Set(state.universe.teams.map(t=>String(t.id)));
 const missingTeamPlayers=state.universe.players.filter(p=>p.teamId!=null&&!knownTeams.has(String(p.teamId))).length;
 const seen=new Set();let duplicatePlayerIds=0;
 for(const p of state.universe.players){if(p.id==null)continue;const key=String(p.id);if(seen.has(key))duplicatePlayerIds++;seen.add(key);}
 const unmappedContracts=state.assets.contracts.filter(c=>c.teamId!=null&&!knownTeams.has(String(c.teamId))).length;
 return Object.freeze({kind:'cpu-franchise-diagnostics',version:1,teamId:teamId??null,
  positions:Object.freeze(positions),missingTeamPlayers,duplicatePlayerIds,unmappedContracts,
  mappingAssumption:'teamId',advisoryOnly:true,executionEnabled:false,persistencePerformed:false});
}
if(typeof module!=='undefined'&&module.exports)module.exports={diagnoseFranchise};
root.HFMCPUFranchiseDiagnostics=Object.freeze({diagnoseFranchise});
})(typeof globalThis!=='undefined'?globalThis:this);
