'use strict';
/* Deterministic, read-only explicit team mapping; no guessing by franchise name. */
function buildTeamMapping(imported,productionTeams,assignments){
 if(!imported||!Array.isArray(imported.teams)||!Array.isArray(imported.players)||!Array.isArray(productionTeams)||!assignments||typeof assignments!=='object')throw Error('Teams, players and explicit assignments required');
 const targets=new Map();for(const t of productionTeams){if(!t||t.id===undefined||t.id===null||targets.has(String(t.id)))throw Error('Invalid production teams');targets.set(String(t.id),t)}
 const seen=new Set(),usedTargets=new Set(),mapping={};
 for(const team of imported.teams){
  if(!team||!Number.isSafeInteger(team.id)||team.id<=0||seen.has(team.id))throw Error('Duplicate or invalid imported team');
  seen.add(team.id);
  if(!Object.prototype.hasOwnProperty.call(assignments,String(team.id)))throw Error('Every imported team requires explicit mapping');
  const target=assignments[String(team.id)],key=String(target);
  if(!targets.has(key)||usedTargets.has(key))throw Error('Unknown or duplicate production team mapping');
  mapping[String(team.id)]=targets.get(key).id;usedTargets.add(key);
 }
 const mappedPlayers=imported.players.map(p=>{
  if(!p||!seen.has(p.teamId)||!Number.isSafeInteger(p.id)||p.id<=0||!['C','LW','RW','D','G'].includes(p.position))throw Error('Invalid player or imported team');
  return {...p,teamId:mapping[String(p.teamId)],team:mapping[String(p.teamId)]};
 });
 const ids=new Set();for(const p of mappedPlayers){if(ids.has(String(p.id)))throw Error('Duplicate player ID');ids.add(String(p.id))}
 return {mapping,mappedPlayers,controlledTeamId:null,requiresExplicitGMApproval:true,automaticCutoverAllowed:false,productionWrites:0};
}
module.exports={buildTeamMapping};
