'use strict';
// Phase 11 Block A: read-only authoritative asset inventory for GM/CPU integration.
// This module never authorizes a trade, signing, draft selection or save.
function audit(universe, state) {
 if(!universe||!Array.isArray(universe.players)||!Array.isArray(universe.teams)) throw Error('Source universe required');
 if(!state||!state.universe||!state.assets) throw Error('Validated franchise state required');
 const sourceIds=new Set(universe.players.map(p=>String(p.id)));
 const playerIds=new Set();
 const issues=[];
 for(const p of state.universe.players||[]){
  const id=String(p.id);
  if(playerIds.has(id)) issues.push({code:'duplicate-player',id});
  if(!sourceIds.has(id)) issues.push({code:'unverified-player',id});
  playerIds.add(id);
 }
 const picks=state.assets.draftPicks||[];
 const pickIds=new Set();
 for(const p of picks){
  const id=String(p.pickId??p.id);
  if(pickIds.has(id)) issues.push({code:'duplicate-pick',id});
  if(p.source!=='hlm-universe.json') issues.push({code:'unverified-pick',id});
  pickIds.add(id);
 }
 const contracts=state.assets.contracts||[];
 const prospects=state.universe.prospects||[];
 const missingContracts=playerIds.size>0&&contracts.length===0;
 const missingProspects=prospects.length===0;
 return Object.freeze({
  status:issues.length?'blocked':'inventory-only',
  counts:Object.freeze({players:playerIds.size,picks:picks.length,contracts:contracts.length,prospects:prospects.length}),
  readiness:Object.freeze({rosterIdentity:issues.every(x=>!['duplicate-player','unverified-player'].includes(x.code)),draftOwnership:issues.every(x=>!['duplicate-pick','unverified-pick'].includes(x.code)),contractGameplay:!missingContracts&&false,prospectGameplay:!missingProspects&&false,cpuConsent:false}),
  issues:Object.freeze(issues.map(x=>Object.freeze(x))),
  missing:Object.freeze({contracts:missingContracts,prospects:missingProspects}),
  settlementAuthorized:false,saved:false
 });
}
module.exports={audit};
