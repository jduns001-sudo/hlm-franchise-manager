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

/** Reconcile starter pick ownership against the canonical source, never a synthetic fixture. */
function reconcileSourcePicks(universe,state){
 const {teams,importSourcePicks}=require('./hlm-phase11-new-franchise');
 const eligible=teams(universe);
 const imported=importSourcePicks(universe,eligible);
 const authoritative=new Map(imported.accepted.map(p=>[p.pickId,p]));
 const issues=[],seen=new Set();
 for(const p of state.assets?.draftPicks||[]){
  const id=String(p.pickId??p.id);
  if(seen.has(id)){issues.push({code:'duplicate-pick',id});continue;}
  seen.add(id);
  const src=authoritative.get(id);
  if(!src){issues.push({code:'pick-not-in-canonical-source',id});continue;}
  if(String(src.currentOwnerId)!==String(p.currentOwnerId))issues.push({code:'source-owner-mismatch',id});
  if(String(src.originalTeamId)!==String(p.originalTeamId)||src.year!==p.year||src.round!==p.round||src.league!==p.league)issues.push({code:'pick-identity-mismatch',id});
 }
 for(const id of authoritative.keys())if(!seen.has(id))issues.push({code:'source-pick-not-imported',id});
 return Object.freeze({status:issues.length?'blocked':'source-reconciled',sourceCount:authoritative.size,excludedSourceCount:imported.excludedCount,issues:Object.freeze(issues.map(x=>Object.freeze(x))),settlementAuthorized:false,saved:false});
}
module.exports.reconcileSourcePicks=reconcileSourcePicks;

/**
 * Read-only transaction-aware ownership audit.
 * A ledger claim is evidence to inspect, not authentication of CPU consent.
 * Never approves settlement or mutates the state.
 */
function reconcilePickOwnershipHistory(universe,state){
 const base=reconcileSourcePicks(universe,state);
 const {teams,importSourcePicks}=require('./hlm-phase11-new-franchise');
 const source=importSourcePicks(universe,teams(universe)).accepted;
 const byId=new Map(source.map(p=>[p.pickId,p]));
 const history=state.activity?.transactions||[];
 const issues=[],changes=[];
 for(const p of state.assets?.draftPicks||[]){
  const id=String(p.pickId??p.id),original=byId.get(id);
  if(!original)continue;
  if(String(p.currentOwnerId)===String(original.currentOwnerId))continue;
  const claims=history.filter(t=>t&&
   String(t.pickId??'')===id&&
   String(t.toTeamId??'')===String(p.currentOwnerId)&&
   String(t.fromTeamId??'')===String(original.currentOwnerId));
  changes.push(Object.freeze({pickId:id,sourceOwnerId:original.currentOwnerId,currentOwnerId:p.currentOwnerId,ledgerClaims:claims.length}));
  // Matching claims cannot independently establish consent, atomicity or authenticity.
  issues.push(Object.freeze({code:claims.length?'ownership-change-needs-authentication':'ownership-change-without-ledger',id}));
 }
 for(const issue of base.issues){
  if(issue.code==='source-owner-mismatch')continue;
  issues.push(issue);
 }
 return Object.freeze({status:issues.length?'blocked':'source-reconciled',sourceCount:base.sourceCount,changes:Object.freeze(changes),issues:Object.freeze(issues),cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports.reconcilePickOwnershipHistory=reconcilePickOwnershipHistory;
