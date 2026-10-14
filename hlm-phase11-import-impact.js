'use strict';
/* Read-only Phase 11 import impact gate. Does not activate a roster or mutate saves. */
const IMPORT='hlm-phase11-imported-franchise-v1';
const PROTECTED=['customPlayers','playerOverrides','draftPickOverrides','extraDraftPicks','decisions','transactions','lines','depth','contracts','prospects','draftBoard','history','waivers','notes'];
function compare(storage,production){
 const raw=storage.getItem(IMPORT);if(raw===null)throw Error('No staged imported roster');
 if(raw.length>5_000_000)throw Error('Imported roster exceeds size limit');
 let imported;try{imported=JSON.parse(raw)}catch{throw Error('Invalid imported JSON')}
 const u=imported?.universe;
 if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players)||u.teams.length<2||u.players.length<12)throw Error('Invalid imported roster');
 const teamIds=new Set(),playerIds=new Set();
 for(const t of u.teams){if(!t||!Number.isSafeInteger(t.id)||teamIds.has(t.id)||!t.name)throw Error('Duplicate or invalid team');teamIds.add(t.id)}
 for(const p of u.players){if(!p||!Number.isSafeInteger(p.id)||playerIds.has(p.id)||!teamIds.has(p.teamId)||!['C','LW','RW','D','G'].includes(p.position))throw Error('Invalid player reference');playerIds.add(p.id)}
 const controlled=imported?.meta?.controlledTeamId;
 if(!teamIds.has(controlled))throw Error('Imported controlled team missing');
 if(!production||typeof production!=='object'||Array.isArray(production)||production.schema!==7)throw Error('Unsupported production save schema');
 if(!production.settings||typeof production.settings!=='object')throw Error('Production settings missing');
 const protectedFields=PROTECTED.filter(k=>Object.prototype.hasOwnProperty.call(production,k));
 const counts=Object.fromEntries(protectedFields.map(k=>[k,Array.isArray(production[k])?production[k].length:typeof production[k]==='object'&&production[k]!==null?Object.keys(production[k]).length:1]));
 const currentTeam=production.settings.controlledTeamId;
 const conflicts=currentTeam!==undefined&&currentTeam!==controlled;
 return Object.freeze({importedTeams:teamIds.size,importedPlayers:playerIds.size,importedControlledTeamId:controlled,productionControlledTeamId:currentTeam??null,controlledTeamConflict:conflicts,protectedFields,protectedCounts:counts,eligibleForAutomaticCutover:false,productionWrites:0});
}
module.exports={IMPORT,compare,PROTECTED};
