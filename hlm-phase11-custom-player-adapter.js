'use strict';
/* Verified against app.html compactState/initDB: customPlayers appended to U.players.
 * Only additive custom-player mapping is supported; no base-universe team replacement. */
const RESERVED=new Set(['__proto__','constructor','prototype']);
function planCustomPlayers(imported,production,basePlayerIds=[]){
 if(!production||production.schema!==7||!production.settings||!Array.isArray(production.customPlayers))throw Error('Production schema 7 with customPlayers required');
 const u=imported?.universe;if(!u||!Array.isArray(u.teams)||!Array.isArray(u.players))throw Error('Invalid imported universe');
 const teams=new Map();for(const t of u.teams){if(!Number.isSafeInteger(t.id)||t.id<=0||teams.has(t.id)||typeof t.name!=='string'||!t.name.trim())throw Error('Invalid imported team');teams.set(t.id,t)}
 const used=new Set([...basePlayerIds,...production.customPlayers.map(p=>p.id)].map(String));
 const candidates=[],rejected=[];
 for(const p of u.players){
  if(!p||!Number.isSafeInteger(p.id)||p.id<=0||typeof p.name!=='string'||!p.name.trim()||!teams.has(p.teamId)||!['C','LW','RW','D','G'].includes(p.position)||!Number.isInteger(p.ovr)||p.ovr<1||p.ovr>99)throw Error('Invalid imported player');
  const id=String(p.id);if(RESERVED.has(id)||used.has(id)){rejected.push({id:p.id,reason:'Existing player ID collision'});continue}
  used.add(id);
  candidates.push({id:p.id,name:p.name.trim(),teamId:p.teamId,team:p.teamId,position:p.position,positions:[p.position],overall:p.ovr,ovr:p.ovr});
 }
 // Production team identifiers must be matched against actual U.teams before any save writes.
 return {candidateCustomPlayers:candidates,rejected,requiresTeamIdMapping:true,automaticCutoverAllowed:false,productionWrites:0};
}
function previewAdditiveSave(production,plan){
 if(!production||production.schema!==7||!Array.isArray(production.customPlayers)||!plan||plan.requiresTeamIdMapping!==true)throw Error('Invalid additive preview');
 const next=JSON.parse(JSON.stringify(production));
 // Preview only: not suitable for saving until team IDs have been mapped to production U.teams.
 next.customPlayers=[...next.customPlayers,...plan.candidateCustomPlayers];
 return {preview:next,writes:0,authorized:false};
}
module.exports={planCustomPlayers,previewAdditiveSave};
