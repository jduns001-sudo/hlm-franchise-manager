'use strict';
const {createPhase10FromFrontOffice}=require('./hlm-phase10-front-office-import');
const {auditIntegratedSeason}=require('./hlm-phase11-integrated-season-readiness');
const {completeOffseasonAndStartSeason}=require('./hlm-phase10-complete-offseason');
/** Read-only, opt-in candidate gate. Never reads production IndexedDB or writes any save. */
function assessRealUniverseCareer(legacy,{controlledTeamId,currentDate,games=[],saveId='phase11-real-universe-career-preview'}={}){
 if(!Array.isArray(games))throw new TypeError('Games must be an array');
 const {nextState:state,summary}=createPhase10FromFrontOffice(legacy,{controlledTeamId,currentDate,saveId});
 state.activity.games=JSON.parse(JSON.stringify(games));
 state.finances=JSON.parse(JSON.stringify(legacy.finances||{}));
 state.universe.leagues=JSON.parse(JSON.stringify(legacy.leagues||[]));
 state.universe.staff=JSON.parse(JSON.stringify(legacy.staff||[]));
 state.activity.injuries=JSON.parse(JSON.stringify(legacy.injuries||[]));
 const issues=[];
 const teams=new Set(state.universe.teams.map(t=>String(t.id)));
 const players=new Set(state.universe.players.map(p=>String(p.id)));
 const contracts=new Set(),picks=new Set(),prospects=new Set();
 for(const c of state.assets.contracts){
  const id=c?.contractId??c?.id;
  if(id==null||contracts.has(String(id)))issues.push('MISSING_OR_DUPLICATE_CONTRACT_ID');
  contracts.add(String(id));
  if(!players.has(String(c?.playerId))||!teams.has(String(c?.teamId)))issues.push('INVALID_CONTRACT_REFERENCE');
 }
 for(const p of state.assets.draftPicks){
  const id=p?.pickId??p?.id;
  if(id==null||picks.has(String(id)))issues.push('MISSING_OR_DUPLICATE_PICK_ID');
  picks.add(String(id));
  if(!teams.has(String(p?.currentOwnerId)))issues.push('INVALID_PICK_OWNER');
 }
 for(const p of state.universe.prospects){
  if(p?.id==null||prospects.has(String(p.id)))issues.push('MISSING_OR_DUPLICATE_PROSPECT_ID');
  prospects.add(String(p?.id));
  if(p?.draftedByTeamId!=null&&!teams.has(String(p.draftedByTeamId)))issues.push('INVALID_PROSPECT_DRAFT_TEAM');
 }
 const readiness=auditIntegratedSeason(state);
 const counts={...summary,prospects:prospects.size,contracts:contracts.size,draftPicks:picks.size,staff:state.universe.staff.length,leagues:state.universe.leagues.length};
 return {ready:issues.length===0&&readiness.ready,issues:[...new Set(issues)],readiness,counts,candidate:state,productionWritePerformed:false,activationEnabled:false};
}
/** Validate existing Phase 10 next-season transaction against an imported candidate without saving it. */
function previewRealUniverseRollover(state,options){
 const before=JSON.stringify(state);
 const result=completeOffseasonAndStartSeason(state,options);
 if(JSON.stringify(state)!==before)throw Error('Offseason mutated input');
 const next=result.nextState;
 const issues=[];
 for(const section of ['players','teams','leagues','staff'])if(JSON.stringify(next.universe[section])!==JSON.stringify(state.universe[section]))issues.push('UNEXPECTED_'+section.toUpperCase()+'_CHANGE');
 if(JSON.stringify(next.finances)!==JSON.stringify(state.finances))issues.push('UNEXPECTED_FINANCE_CHANGE');
 if(next.meta.controlledTeamId!==state.meta.controlledTeamId)issues.push('CONTROLLED_TEAM_CHANGED');
 if(JSON.stringify(next.history.seasons)!==JSON.stringify(state.history.seasons))issues.push('HISTORY_CHANGED');
 return {ready:issues.length===0,issues,summary:result.summary,nextState:next,productionWritePerformed:false,activationEnabled:false};
}
module.exports={assessRealUniverseCareer,previewRealUniverseRollover};
